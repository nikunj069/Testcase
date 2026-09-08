FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libomp-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
# Ensure fastembed and uvicorn are installed (in case they are missing from requirements)
RUN pip install --no-cache-dir fastembed uvicorn

# We will copy the whole repository because simple_sse.py might expect to run from the root
# or backend folder, but let's copy the backend specifically into /app/backend
COPY backend /app/backend
COPY data /app/data

# PYTHONPATH to allow absolute imports if any
ENV PYTHONPATH=/app

# Default command (will be overridden by docker-compose)
CMD ["python", "backend/simple_sse.py"]
