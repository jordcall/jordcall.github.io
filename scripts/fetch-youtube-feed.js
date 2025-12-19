#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Ensure the assets/data directory exists
const dataDir = path.join(__dirname, '..', 'assets', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

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
        console.log('Fetching YouTube channel page...');
        
        // Fetch the YouTube channel page
        const channelHTML = await fetchHTML('https://www.youtube.com/@JordanCall');
        
        // Extract channel ID from the HTML
        let channelId = null;
        
        // Try multiple patterns to find channel ID
        const patterns = [
            /channel_id=([A-Za-z0-9_-]{24})/,
            /"channelId":"([A-Za-z0-9_-]{24})"/,
            /\/channel\/([A-Za-z0-9_-]{24})/,
            /"externalId":"([A-Za-z0-9_-]{24})"/
        ];
        
        for (const pattern of patterns) {
            const match = channelHTML.match(pattern);
            if (match) {
                channelId = match[1];
                console.log(`Found channel ID: ${channelId}`);
                break;
            }
        }
        
        if (!channelId) {
            console.error('Could not find channel ID from page source');
            throw new Error('Channel ID not found');
        }
        
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
        
        console.log(`Found ${videos.length} videos`);
        
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
        console.error('Failed to fetch YouTube feed:', error);
        // Write empty array as fallback
        const outputPath = path.join(dataDir, 'youtube.json');
        fs.writeFileSync(outputPath, '[]');
        console.log('Created empty youtube.json as fallback');
    }
}

if (require.main === module) {
    main();
}