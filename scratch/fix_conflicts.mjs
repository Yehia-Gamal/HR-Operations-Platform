import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('<<<<<<<')) return;

        // More robust regex to match the conflict markers accurately
        const fixedContent = content.replace(/([\s\S]*?)
        fs.writeFileSync(filePath, fixedContent);
        console.log(`Fixed: ${filePath}`);
    } catch (e) {
        console.error(`Error fixing ${filePath}:`, e);
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.git') walk(fullPath);
        } else {
            const ext = path.extname(file).toLowerCase();
            if (['.js', '.mjs', '.css', '.html', '.sql', '.ts', '.json', '.toml', '.md'].includes(ext)) {
                fixFile(fullPath);
            }
        }
    }
}

console.log('Starting conflict resolution (Keeping modern version)...');
walk('.');
console.log('Done.');
