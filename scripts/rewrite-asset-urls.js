#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read version from version.json
const versionPath = path.join(__dirname, '..', 'assets', 'data', 'version.json');
let version;

try {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    version = versionData.version;
} catch (error) {
    console.error('Could not read version.json. Run stamp-version.js first.');
    process.exit(1);
}

console.log(`Using version: ${version}`);

// Find all HTML files in the repo (simple directory scan)
function findHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && item !== 'node_modules' && item !== 'unused' && item !== '.git') {
            files.push(...findHtmlFiles(fullPath));
        } else if (stat.isFile() && item.endsWith('.html')) {
            files.push(path.relative(path.join(__dirname, '..'), fullPath));
        }
    }
    
    return files;
}

const htmlFiles = findHtmlFiles(path.join(__dirname, '..'));

console.log(`Found ${htmlFiles.length} HTML files to process`);

htmlFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Update CSS links (relative paths only)
    content = content.replace(
        /<link\s+([^>]*?)href\s*=\s*"([^"]+\.css)"([^>]*?)>/gi,
        (match, beforeHref, href, afterHref) => {
            // Skip external URLs
            if (href.startsWith('http://') || href.startsWith('https://')) {
                return match;
            }
            
            // Add or append version parameter
            const separator = href.includes('?') ? '&' : '?';
            const newHref = `${href}${separator}v=${encodeURIComponent(version)}`;
            modified = true;
            return `<link ${beforeHref}href="${newHref}"${afterHref}>`;
        }
    );

    // Update JS script sources (relative paths only)
    content = content.replace(
        /<script\s+([^>]*?)src\s*=\s*"([^"]+\.js)"([^>]*?)>/gi,
        (match, beforeSrc, src, afterSrc) => {
            // Skip external URLs
            if (src.startsWith('http://') || src.startsWith('https://')) {
                return match;
            }
            
            // Add or append version parameter
            const separator = src.includes('?') ? '&' : '?';
            const newSrc = `${src}${separator}v=${encodeURIComponent(version)}`;
            modified = true;
            return `<script ${beforeSrc}src="${newSrc}"${afterSrc}>`;
        }
    );

    if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated: ${file}`);
    }
});

console.log('Asset URL rewriting complete');