#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('=== IMAGE INTEGRITY CHECK ===');

// Find all HTML files
function findHtmlFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && item !== 'node_modules' && item !== 'unused' && item !== '.git') {
            files.push(...findHtmlFiles(fullPath));
        } else if (stat.isFile() && item.endsWith('.html')) {
            files.push(fullPath);
        }
    }
    
    return files;
}

const htmlFiles = findHtmlFiles('.');
const missingImages = [];
const checkedImages = new Set();

console.log(`Checking ${htmlFiles.length} HTML files for image references...`);

for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const imgMatches = content.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
    
    if (imgMatches) {
        for (const match of imgMatches) {
            const srcMatch = match.match(/src=["']([^"']+)["']/);
            if (srcMatch) {
                const src = srcMatch[1];
                
                // Only check local asset images
                if (src.startsWith('assets/images/') && !checkedImages.has(src)) {
                    checkedImages.add(src);
                    const imagePath = path.join('.', src);
                    
                    if (!fs.existsSync(imagePath)) {
                        missingImages.push({
                            file: path.relative('.', file),
                            src: src,
                            fullPath: imagePath
                        });
                    }
                }
            }
        }
    }
}

console.log(`Checked ${checkedImages.size} unique image references`);

if (missingImages.length > 0) {
    console.error('\n❌ MISSING IMAGES FOUND:');
    missingImages.forEach(img => {
        console.error(`  ${img.file}: ${img.src} (${img.fullPath})`);
    });
    console.error(`\n${missingImages.length} missing image(s) detected. Build failed.`);
    process.exit(1);
} else {
    console.log('✅ All image references are valid');
}

// Check for available photos for auto-assignment
console.log('\n=== PHOTO INVENTORY ===');
const photosPath = path.join('.', 'assets', 'images', 'photos');
if (fs.existsSync(photosPath)) {
    const imageFiles = fs.readdirSync(photosPath);
    const photoPattern = /^photo(\d+)\.(jpg|jpeg|png|webp)$/i;
    const availablePhotos = [];
    
    imageFiles.forEach(file => {
        const match = file.match(photoPattern);
        if (match) {
            availablePhotos.push({
                number: parseInt(match[1]),
                filename: file
            });
        }
    });
    
    availablePhotos.sort((a, b) => a.number - b.number);
    
    console.log('Available photos for auto-assignment:');
    availablePhotos.forEach(photo => {
        console.log(`  photo${photo.number}: ${photo.filename}`);
    });
    
    if (availablePhotos.length > 0) {
        console.log(`\nRecommended range for assignment: photo${availablePhotos[0]?.number} - photo${availablePhotos[availablePhotos.length - 1]?.number}`);
    } else {
        console.log('\nNo numbered photos found in assets/images/photos/');
    }
} else {
    console.log('No photos directory found at assets/images/photos/');
}

console.log('\n✅ Image integrity check passed');