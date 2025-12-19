#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');
const { resolveChannelId } = require('./resolve-youtube-channel-id');

// Ensure the assets/data directory exists
const dataDir = path.join(__dirname, '..', 'assets', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function fetchXML(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function parseXMLEntries(xmlString) {
    const entries = [];
    const entryRegex = /<entry>(.*?)<\/entry>/gs;
    let match;

    while ((match = entryRegex.exec(xmlString)) !== null) {
        const entryContent = match[1];
        
        // Extract title
        const titleMatch = entryContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || 
                          entryContent.match(/<title>(.*?)<\/title>/);
        
        // Extract link
        const linkMatch = entryContent.match(/<link href="([^"]+)"/);
        
        // Extract published date
        const publishedMatch = entryContent.match(/<published>(.*?)<\/published>/);
        
        if (titleMatch && linkMatch && publishedMatch) {
            entries.push({
                title: titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
                link: linkMatch[1],
                date: publishedMatch[1]
            });
        }
    }
    
    return entries;
}

async function main() {
    try {
        console.log('Resolving YouTube channel ID...');
        const channelId = await resolveChannelId();
        console.log(`Channel ID: ${channelId}`);
        
        // Construct RSS feed URL
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        console.log(`Fetching RSS feed from: ${feedUrl}`);
        
        // Fetch the RSS feed
        const feedXML = await fetchXML(feedUrl);
        
        // Parse entries from the XML
        const videos = parseXMLEntries(feedXML);
        
        // Sort by date (newest first)
        videos.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Format dates consistently
        videos.forEach(video => {
            const date = new Date(video.date);
            video.date = date.toISOString().split('T')[0];
        });
        
        console.log(`Found ${videos.length} videos via RSS (latest ~15)`);
        
        // Write to JSON file
        const outputPath = path.join(dataDir, 'youtube.json');
        fs.writeFileSync(outputPath, JSON.stringify(videos, null, 2));
        
        console.log(`Successfully wrote ${videos.length} videos to ${outputPath}`);
        
        // Show first few videos as preview
        if (videos.length > 0) {
            console.log('\nFirst few videos:');
            videos.slice(0, 3).forEach(video => {
                console.log(`- ${video.title} (${video.date})`);
            });
        }
        
    } catch (error) {
        console.error('Failed to fetch YouTube RSS:', error);
        // Write empty array as fallback
        const outputPath = path.join(dataDir, 'youtube.json');
        fs.writeFileSync(outputPath, '[]');
        console.log('Created empty youtube.json as fallback');
    }
}

if (require.main === module) {
    main();
}