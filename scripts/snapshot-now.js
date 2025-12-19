#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const nowHtmlPath = path.join(__dirname, '..', 'now.html');
const nowArchivePath = path.join(__dirname, '..', 'now-archive.html');
const nowDirPath = path.join(__dirname, '..', 'now');

if (!fs.existsSync(nowHtmlPath)) {
  console.error('Error: now.html not found');
  process.exit(1);
}

const nowHtmlContent = fs.readFileSync(nowHtmlPath, 'utf8');

const startMarker = '<!-- CURRENT-NOW-START -->';
const endMarker = '<!-- CURRENT-NOW-END -->';

const startIndex = nowHtmlContent.indexOf(startMarker);
const endIndex = nowHtmlContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Error: Could not find NOW content markers in now.html');
  console.error('Make sure <!-- CURRENT-NOW-START --> and <!-- CURRENT-NOW-END --> exist');
  process.exit(1);
}

const currentNowContent = nowHtmlContent.substring(
  startIndex + startMarker.length,
  endIndex
).trim();

const dateMatch = currentNowContent.match(/Updated\s+(\d{4}-\d{2}-\d{2})/);
if (!dateMatch) {
  console.error('Error: Could not extract date from Now content');
  console.error('Make sure the Now page has a date in format: Updated YYYY-MM-DD');
  process.exit(1);
}

const dateString = dateMatch[1];

if (!fs.existsSync(nowDirPath)) {
  fs.mkdirSync(nowDirPath, { recursive: true });
  console.log(`Created directory: ${nowDirPath}`);
}

const snapshotFileName = `${dateString}.html`;
const snapshotFilePath = path.join(nowDirPath, snapshotFileName);

if (fs.existsSync(snapshotFilePath)) {
  console.warn(`Warning: Snapshot already exists: ${snapshotFilePath}`);
  console.warn('Overwriting...');
}

const snapshotHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Now (${dateString}) — Jordan Call</title>
    <meta name="description" content="Jordan Call's Now page snapshot from ${dateString}.">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://jordancall.com/now/${dateString}.html">
    <meta property="og:title" content="Now (${dateString}) — Jordan Call">
    <meta property="og:description" content="Jordan Call's Now page snapshot from ${dateString}.">
    <meta property="og:image" content="https://jordancall.com/assets/images/web/top-photo.webp">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://jordancall.com/now/${dateString}.html">
    <meta property="twitter:title" content="Now (${dateString}) — Jordan Call">
    <meta property="twitter:description" content="Jordan Call's Now page snapshot from ${dateString}.">
    <meta property="twitter:image" content="https://jordancall.com/assets/images/web/top-photo.webp">

    <link rel="icon" type="image/x-icon" href="/assets/images/favicon.ico">
    
    <!-- Preconnect to Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..800&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="../assets/css/styles.css">
</head>
<body>
    <main id="main">
        <div class="container page--justify">
          <h1>Now (${dateString})</h1>
          
          <p><a href="/now.html">&larr; Back to current Now</a></p>
          
          ${currentNowContent}
        </div>
    </main>

<footer>
  <div class="container">
    <p>&copy; <span id="current-year"></span> Jordan Call · <a href="https://farewellfiles.substack.com/" target="_blank" rel="noopener">Substack</a></p>
  </div>
</footer>

    <script src="/assets/js/version.js" defer></script>
    <script src="/assets/js/main.js" defer></script>
    <script src="/assets/js/kill-sw.js" defer></script>
</body>
</html>
`;

fs.writeFileSync(snapshotFilePath, snapshotHtml);
console.log(`✅ Snapshot created: now/${snapshotFileName}`);

if (fs.existsSync(nowArchivePath)) {
  let archiveContent = fs.readFileSync(nowArchivePath, 'utf8');
  
  const listMarker = '<p>Past snapshots of what I was up to:</p>';
  const insertIndex = archiveContent.indexOf(listMarker);
  
  if (insertIndex !== -1) {
    const insertPosition = insertIndex + listMarker.length;
    const newEntry = `
            <ul>
              <li><a href="/now/${dateString}.html">${dateString}</a></li>
            </ul>`;
    
    if (!archiveContent.includes(`/now/${dateString}.html`)) {
      archiveContent = archiveContent.substring(0, insertPosition) + newEntry + archiveContent.substring(insertPosition);
      fs.writeFileSync(nowArchivePath, archiveContent);
      console.log(`✅ Updated now-archive.html with link to ${dateString}`);
    } else {
      console.log(`ℹ️  Archive already contains link to ${dateString}`);
    }
  }
} else {
  console.warn(`Warning: now-archive.html not found, skipping archive update`);
}

console.log('');
console.log('Snapshot complete! Next steps:');
console.log('1. Update now.html with new content and date');
console.log('2. Run build scripts before deploying');
