#!/usr/bin/env node

/*
 * YouTube Data API v3 fetcher - fetches complete video archive
 * Set YT_API_KEY (YouTube Data API v3). Enable API in Google Cloud.
 * https://developers.google.com/youtube/v3/getting-started
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { resolveChannelId } = require('./resolve-youtube-channel-id');

// Ensure the assets/data directory exists
const dataDir = path.join(__dirname, '..', 'assets', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

async function getUploadsPlaylistId(channelId, apiKey) {
    // Convert channel ID to uploads playlist ID
    // Replace leading UC with UU
    if (channelId.startsWith('UC')) {
        return 'UU' + channelId.slice(2);
    }
    
    // Fallback: use channels.list API
    const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
    const response = await fetchJSON(url);
    
    if (response.items && response.items.length > 0) {
        return response.items[0].contentDetails.relatedPlaylists.uploads;
    }
    
    throw new Error('Could not determine uploads playlist ID');
}

async function fetchAllVideos(playlistId, apiKey) {
    const videos = [];
    let nextPageToken = null;
    
    do {
        let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=50&key=${apiKey}`;
        if (nextPageToken) {
            url += `&pageToken=${nextPageToken}`;
        }
        
        console.log(`Fetching page: ${nextPageToken || 'first'}`);
        const response = await fetchJSON(url);
        
        if (response.items) {
            response.items.forEach(item => {
                if (item.snippet && item.snippet.resourceId) {
                    videos.push({
                        title: item.snippet.title,
                        videoId: item.snippet.resourceId.videoId,
                        link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                        publishedAt: item.snippet.publishedAt,
                        date: item.snippet.publishedAt.split('T')[0]
                    });
                }
            });
        }
        
        nextPageToken = response.nextPageToken;
        
        // Small delay to be respectful to API
        if (nextPageToken) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
    } while (nextPageToken);
    
    return videos;
}

async function main() {
    const apiKey = process.env.YT_API_KEY;
    
    if (!apiKey) {
        console.error('YT_API_KEY environment variable not set');
        console.error('Get your API key from: https://developers.google.com/youtube/v3/getting-started');
        process.exit(1);
    }
    
    try {
        console.log('Resolving YouTube channel ID...');
        const channelId = await resolveChannelId();
        console.log(`Channel ID: ${channelId}`);
        
        console.log('Getting uploads playlist ID...');
        const playlistId = await getUploadsPlaylistId(channelId, apiKey);
        console.log(`Uploads playlist ID: ${playlistId}`);
        
        console.log('Fetching all videos from API...');
        const videos = await fetchAllVideos(playlistId, apiKey);
        
        // Sort by date (newest first)
        videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        
        console.log(`Found ${videos.length} videos via YouTube Data API`);
        
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
        console.error('Failed to fetch from YouTube API:', error);
        // Write empty array as fallback
        const outputPath = path.join(dataDir, 'youtube.json');
        fs.writeFileSync(outputPath, '[]');
        console.log('Created empty youtube.json as fallback');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}