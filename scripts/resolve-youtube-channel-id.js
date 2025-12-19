#!/usr/bin/env node

const https = require('https');

function fetchHTML(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function resolveChannelId() {
    try {
        const html = await fetchHTML('https://www.youtube.com/@JordanCall');
        
        // Try RSS link pattern first
        const rssLinkMatch = html.match(/<link rel="alternate" type="application\/rss\+xml" href="https:\/\/www\.youtube\.com\/feeds\/videos\.xml\?channel_id=([A-Za-z0-9_-]{24})"/);
        if (rssLinkMatch) {
            return rssLinkMatch[1];
        }
        
        // Try JSON channelId pattern
        const channelIdMatch = html.match(/"channelId":"([A-Za-z0-9_-]{24})"/);
        if (channelIdMatch) {
            return channelIdMatch[1];
        }
        
        // Try externalId pattern
        const externalIdMatch = html.match(/"externalId":"([A-Za-z0-9_-]{24})"/);
        if (externalIdMatch) {
            return externalIdMatch[1];
        }
        
        // Try browse_endpoint pattern
        const browseMatch = html.match(/browse_endpoint.*?"browseId":"([A-Za-z0-9_-]{24})"/);
        if (browseMatch) {
            return browseMatch[1];
        }
        
        throw new Error('Channel ID not found in page source');
        
    } catch (error) {
        console.error('Failed to resolve channel ID:', error.message);
        process.exit(1);
    }
}

async function main() {
    const channelId = await resolveChannelId();
    console.log(channelId);
}

if (require.main === module) {
    main();
}

module.exports = { resolveChannelId };