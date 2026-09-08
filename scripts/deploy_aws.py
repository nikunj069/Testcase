import boto3
import paramiko
import time
import os
import sys
import urllib.request
import json

def get_ubuntu_ami(region):
    # Fetch the latest Ubuntu 22.04 LTS AMI ID for the region
    client = boto3.client('ec2', region_name=region)
    response = client.describe_images(
        Filters=[
            {'Name': 'name', 'Values': ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*']},
            {'Name': 'state', 'Values': ['available']}
        ],
        Owners=['099720109477'] # Canonical owner ID
    )
    # Sort on CreationDate and get the most recent
    images = sorted(response['Images'], key=lambda x: x['CreationDate'], reverse=True)
    return images[0]['ImageId']

def main():
    print("========================================")
    print("pineSAW Automated AWS Deployment Script")
    print("========================================")
    print("This script will provision a secure, encrypted t2.micro instance and deploy your code.")
    print("Make sure you have pushed your latest Dockerfiles to your separate GitHub repo.")
    print("")

    access_key = os.getenv('AWS_ACCESS_KEY_ID') or input("Enter AWS Access Key ID: ")
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY') or input("Enter AWS Secret Access Key: ")
    region = os.getenv('AWS_DEFAULT_REGION') or input("Enter AWS Region (e.g. us-east-1): ")
    github_repo = os.getenv('GITHUB_REPO') or input("Enter your GitHub repository URL (press Enter for default https://github.com/nikunj069/Testcase.git): ").strip() or "https://github.com/nikunj069/Testcase.git"

    os.environ['AWS_ACCESS_KEY_ID'] = access_key
    os.environ['AWS_SECRET_ACCESS_KEY'] = secret_key
    os.environ['AWS_DEFAULT_REGION'] = region

    try:
        ec2 = boto3.client('ec2', region_name=region)
        ec2_resource = boto3.resource('ec2', region_name=region)
    except Exception as e:
        print(f"Failed to connect to AWS: {e}")
        return

    # 1. Create Security Group
    sg_name = 'pinesaw-sg-' + str(int(time.time()))
    print(f"[*] Creating Security Group: {sg_name}...")
    try:
        vpc_response = ec2.describe_vpcs(Filters=[{'Name': 'isDefault', 'Values': ['true']}])
        vpc_id = vpc_response['Vpcs'][0]['VpcId']
        sg_response = ec2.create_security_group(GroupName=sg_name, Description='PineSAW Web and SSH', VpcId=vpc_id)
        sg_id = sg_response['GroupId']
        
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {'IpProtocol': 'tcp', 'FromPort': 22, 'ToPort': 22, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                {'IpProtocol': 'tcp', 'FromPort': 80, 'ToPort': 80, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                {'IpProtocol': 'tcp', 'FromPort': 8000, 'ToPort': 8000, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
                {'IpProtocol': 'tcp', 'FromPort': 5055, 'ToPort': 5055, 'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}
            ]
        )
    except Exception as e:
        print(f"Error creating security group: {e}")
        return

    # 2. Create Key Pair
    key_name = 'pinesaw-key-' + str(int(time.time()))
    print(f"[*] Creating Key Pair: {key_name}...")
    try:
        key_pair = ec2.create_key_pair(KeyName=key_name, KeyType='rsa', KeyFormat='pem')
        key_file_path = os.path.join(os.path.dirname(__file__), 'pinesaw-deploy-key.pem')
        with open(key_file_path, 'w', encoding='utf-8') as f:
            f.write(key_pair['KeyMaterial'])
    except Exception as e:
        print(f"Error creating key pair: {e}")
        return

    # 3. Launch Instance
    print("[*] Launching t2.micro EC2 Instance with encrypted 30GB EBS volume...")
    ami_id = get_ubuntu_ami(region)
    try:
        instances = ec2_resource.create_instances(
            ImageId=ami_id,
            MinCount=1,
            MaxCount=1,
            InstanceType='t2.micro',
            KeyName=key_name,
            SecurityGroupIds=[sg_id],
            BlockDeviceMappings=[
                {
                    'DeviceName': '/dev/sda1',
                    'Ebs': {
                        'VolumeSize': 30,
                        'VolumeType': 'gp3',
                        'Encrypted': True  # Mandatory encryption at rest
                    }
                }
            ],
            TagSpecifications=[
                {'ResourceType': 'instance', 'Tags': [{'Key': 'Name', 'Value': 'pineSAW-Production'}]}
            ]
        )
        instance = instances[0]
        print(f"[*] Instance {instance.id} created. Waiting for it to enter 'running' state...")
        instance.wait_until_running()
        instance.reload()
        public_ip = instance.public_ip_address
        print(f"[*] Instance is running! Public IP: {public_ip}")
    except Exception as e:
        print(f"Error launching instance: {e}")
        return

    print("[*] Waiting 45 seconds for SSH daemon to initialize...")
    time.sleep(45)

    # 4. SSH and Deploy
    print("[*] Connecting via SSH...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    key = paramiko.RSAKey.from_private_key_file(key_file_path)
    
    # Retry SSH connection up to 5 times
    connected = False
    for attempt in range(1, 6):
        try:
            print(f"[*] SSH Connection attempt {attempt}/5...")
            ssh.connect(hostname=public_ip, username='ubuntu', pkey=key, timeout=20)
            connected = True
            break
        except Exception as err:
            print(f"    SSH attempt {attempt} failed: {err}. Retrying in 15 seconds...")
            time.sleep(15)

    if not connected:
        print("Failed to establish SSH connection.")
        return

    try:
        commands = [
            "echo '[*] Setting up 4GB Swap...' && sudo fallocate -l 4G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab",
            "echo '[*] Installing Docker and Git...' && sudo apt-get update -y && sudo apt-get install -y docker.io docker-compose git",
            "echo '[*] Starting Docker...' && sudo systemctl start docker && sudo systemctl enable docker && sudo usermod -aG docker ubuntu",
            f"echo '[*] Cloning repository...' && rm -rf app && git clone {github_repo} app",
            f"echo '[*] Configuring environment and launching Docker containers...' && cd app && printf 'NEXT_PUBLIC_API_URL=http://{public_ip}:8000\\nNEXT_PUBLIC_FAISS_URL=http://{public_ip}:5055\\n' > .env.production && sudo docker-compose up -d --build"
        ]
        
        for command in commands:
            print(f"\n> Running remote command: {command[:60]}...")
            stdin, stdout, stderr = ssh.exec_command(command)
            while True:
                line = stdout.readline()
                if not line:
                    break
                print(line.rstrip())
            exit_status = stdout.channel.recv_exit_status()
            if exit_status != 0:
                print(f"Warning: Command returned status {exit_status}")
                err_output = stderr.read().decode()
                if err_output:
                    print(f"STDERR: {err_output}")
        
        print("\n========================================")
        print("DEPLOYMENT COMPLETE!")
        print(f"Access your pineSAW application at: http://{public_ip}")
        print("========================================")
        
    except Exception as e:
        print(f"SSH Deployment failed: {e}")
    finally:
        ssh.close()

if __name__ == '__main__':
    main()
