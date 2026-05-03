import fs from 'fs';
import path from 'path';

function fixFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('<<<<<<<')) return;

        const lines = content.split('\n');
        const result = [];
        let inHead = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('<<<<<<< HEAD')) {
                inHead = true;
                continue;
            }
            if (line.startsWith('=======')) {
                inHead = false;
                continue;
            }
            if (line.startsWith('>>>>>>>')) {
                // Skip the marker itself
                continue;
            }
            
            if (!inHead) {
                result.push(line);
            }
        }

        fs.writeFileSync(filePath, result.join('\n'));
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

console.log('Starting Aggressive Conflict Resolution (Keeping modernized block)...');
walk('.');
console.log('Done.');
