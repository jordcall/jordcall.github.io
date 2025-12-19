const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * INCREMENTAL MERGE STRATEGY:
 * 1. Load existing farewellfiles.json (historical record)
 * 2. Fetch latest posts from RSS
 * 3. Merge new posts with existing (union by link)
 * 4. Never overwrite/delete - only add
 * 5. This ensures we never lose older posts
 */
function fetchSubstackRSS() {
  const url = 'https://farewellfiles.substack.com/feed';
  
  console.log('📚 Fetching Substack RSS feed...\n');
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const newPosts = parseRSS(data);
        console.log(`📥 Fetched ${newPosts.length} posts from RSS feed`);
        
        // Ensure assets/data directory exists
        const dataDir = path.join(__dirname, '..', 'assets', 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Load existing posts (our historical archive)
        const outputPath = path.join(dataDir, 'farewellfiles.json');
        let existingPosts = [];
        if (fs.existsSync(outputPath)) {
          try {
            existingPosts = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
            console.log(`📂 Loaded ${existingPosts.length} existing posts from archive`);
          } catch (e) {
            console.warn('⚠️  Could not read existing farewellfiles.json, starting fresh');
          }
        }
        
        // INCREMENTAL MERGE: Union by normalized link
        const allPostsMap = new Map();
        
        // Add existing posts first
        existingPosts.forEach(post => {
          const normalizedLink = normalizeLink(post.link);
          allPostsMap.set(normalizedLink, post);
        });
        
        // Add/update with new posts from RSS
        const trulyNewPosts = [];
        newPosts.forEach(post => {
          const normalizedLink = normalizeLink(post.link);
          if (!allPostsMap.has(normalizedLink)) {
            trulyNewPosts.push(post);
          }
          allPostsMap.set(normalizedLink, post);
        });
        
        // Convert back to array
        const allPosts = Array.from(allPostsMap.values());
        
        console.log(`📊 Total posts after merge: ${allPosts.length}`);
        
        if (trulyNewPosts.length > 0) {
          console.log(`\n🆕 NEW posts found (${trulyNewPosts.length}):`);
          trulyNewPosts.forEach(post => {
            console.log(`  - ${post.title} (${post.date})`);
            console.log(`    ${post.link}`);
          });
          console.log('');
        } else {
          console.log('\nℹ️  No new posts since last run\n');
        }
        
        // Load essay tags
        const tagsPath = path.join(dataDir, 'essay-tags.json');
        let essayTags = {};
        if (fs.existsSync(tagsPath)) {
          try {
            essayTags = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
          } catch (e) {
            console.warn('⚠️  Could not read essay-tags.json');
          }
        }
        
        // Merge tags into posts
        const postsWithTags = allPosts.map(post => {
          const slug = new URL(post.link).pathname;
          const tags = essayTags[slug] || [];
          return { ...post, tags };
        });
        
        // Sort newest first (ISO date strings sort correctly)
        postsWithTags.sort((a, b) => b.date.localeCompare(a.date));
        
        // Save merged result
        fs.writeFileSync(outputPath, JSON.stringify(postsWithTags, null, 2));
        
        console.log(`✅ Saved ${postsWithTags.length} total posts to ${outputPath}`);
        console.log('💡 Posts are incrementally merged - historical posts are never lost');
        
      } catch (error) {
        console.error('❌ Error parsing RSS:', error.message);
        process.exit(1);
      }
    });
    
  }).on('error', (err) => {
    console.error('❌ Error fetching RSS:', err.message);
    process.exit(1);
  });
}

function normalizeLink(link) {
  // Remove trailing slashes and query params for consistent comparison
  return link.replace(/\/$/, '').split('?')[0].split('#')[0];
}

function parseRSS(xmlData) {
  const posts = [];
  
  // Extract all item blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlData)) !== null) {
    const itemXml = match[1];
    
    // Extract title (handle CDATA)
    let title = '';
    const titleMatch = itemXml.match(/<title>(<!\[CDATA\[(.*?)\]\]>|([^<]*))<\/title>/);
    if (titleMatch) {
      title = titleMatch[2] || titleMatch[3] || '';
    }
    
    // Extract link
    let link = '';
    const linkMatch = itemXml.match(/<link>([^<]*)<\/link>/);
    if (linkMatch) {
      link = linkMatch[1].trim();
    }
    
    // Extract and format pubDate
    let date = '';
    const pubDateMatch = itemXml.match(/<pubDate>([^<]*)<\/pubDate>/);
    if (pubDateMatch) {
      const pubDate = new Date(pubDateMatch[1]);
      if (!isNaN(pubDate.getTime())) {
        // Format as YYYY-MM-DD
        date = pubDate.toISOString().split('T')[0];
      }
    }
    
    if (title && link && date) {
      posts.push({ title, link, date });
    }
  }
  
  return posts;
}

// Run the script
fetchSubstackRSS();
