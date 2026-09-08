const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src', (filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        if (content.includes('http://127.0.0.1:8000')) {
            content = content.replace(/['"`]http:\/\/127\.0\.0\.1:8000([^'"`]*)['"`]/g, "`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}$1`");
            modified = true;
        }
        
        if (content.includes('http://127.0.0.1:5055')) {
            content = content.replace(/['"`]http:\/\/127\.0\.0\.1:5055([^'"`]*)['"`]/g, "`${process.env.NEXT_PUBLIC_FAISS_URL || 'http://127.0.0.1:5055'}$1`");
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
});
