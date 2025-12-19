#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create an ISO timestamp string
const version = new Date().toISOString();

// Ensure assets/data directory exists
const dataDir = path.join(__dirname, '..', 'assets', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Write version to JSON file
const versionData = { version };
const versionPath = path.join(dataDir, 'version.json');

fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));

console.log(`Version stamped: ${version}`);
console.log(`Written to: ${versionPath}`);