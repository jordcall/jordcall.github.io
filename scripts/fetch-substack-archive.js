#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Ensure the assets/data directory exists
const dataDir = path.join(__dirname, '..', 'assets', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

async function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SubstackFetcher/1.0)' } }, (res) => {
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

async function fetchAllPosts() {
    const allPosts = [];
    let offset = 0;
    const pageSize = 12;
    
    console.log('Fetching Substack archive posts...');
    
    while (true) {
        try {
            const url = `https://farewellfiles.substack.com/api/v1/archive?sort=new&offset=${offset}`;
            console.log(`Fetching offset ${offset}...`);
            
            const response = await fetchJSON(url);
            
            // Handle different possible response structures
            const posts = response.posts || response || [];
            
            if (!Array.isArray(posts) || posts.length === 0) {
                console.log(`No more posts found at offset ${offset}`);
                break;
            }
            
            // Process each post
            posts.forEach(post => {
                if (post && post.title && (post.canonical_url || post.slug)) {
                    allPosts.push({
                        title: post.title,
                        link: post.canonical_url || `https://farewellfiles.substack.com/p/${post.slug}`,
                        date: post.published_at || post.post_date || new Date().toISOString()
                    });
                }
            });
            
            console.log(`Found ${posts.length} posts at offset ${offset}`);
            
            // If we got fewer posts than the page size, we've reached the end
            if (posts.length < pageSize) {
                break;
            }
            
            offset += pageSize;
            
            // Add a small delay to be respectful
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.warn(`Error fetching at offset ${offset}:`, error.message);
            break;
        }
    }
    
    // De-duplicate by canonical URL
    const seenLinks = new Set();
    const dedupedPosts = [];
    
    allPosts.forEach(post => {
        if (!seenLinks.has(post.link)) {
            seenLinks.add(post.link);
            dedupedPosts.push(post);
        }
    });
    
    // Sort by date (newest first)
    dedupedPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Format dates as YYYY-MM-DD
    dedupedPosts.forEach(post => {
        const date = new Date(post.date);
        post.date = date.toISOString().split('T')[0];
    });
    
    console.log(`Total posts collected: ${allPosts.length}, after deduplication: ${dedupedPosts.length}`);
    return dedupedPosts;
}

async function main() {
    try {
        const posts = await fetchAllPosts();
        const outputPath = path.join(dataDir, 'farewellfiles.json');
        
        fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2));
        console.log(`Successfully wrote ${posts.length} posts to ${outputPath}`);
        
        // Show first few posts as preview
        if (posts.length > 0) {
            console.log('\nFirst few posts:');
            posts.slice(0, 3).forEach(post => {
                console.log(`- ${post.title} (${post.date})`);
            });
        }
        
    } catch (error) {
        console.error('Failed to fetch Substack archive:', error);
        // Write empty array as fallback
        const outputPath = path.join(dataDir, 'farewellfiles.json');
        fs.writeFileSync(outputPath, '[]');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}