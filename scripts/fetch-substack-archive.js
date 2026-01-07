#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'assets', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const archiveBaseUrl = 'https://farewellfiles.substack.com/api/v1/archive?sort=new&offset=';
const pageSize = 12;

function logEvent(name, details) {
    if (details) {
        console.log(name, details);
        return;
    }
    console.log(name);
}

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SubstackFetcher/1.0)' } }, (res) => {
            if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`HTTP ${res.statusCode}`));
                res.resume();
                return;
            }

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

function normalizeLink(link) {
    if (!link) {
        return '';
    }
    try {
        const url = new URL(String(link));
        url.hash = '';
        url.search = '';
        let pathname = url.pathname || '';
        if (pathname.length > 1) {
            pathname = pathname.replace(/\/$/, '');
        }
        return `${url.origin}${pathname}`;
    } catch (err) {
        return String(link).trim().replace(/\/$/, '');
    }
}

function formatDate(value) {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toISOString().split('T')[0];
}

function coerceDate(value) {
    return formatDate(value) || formatDate(new Date());
}

function normalizePost(post) {
    if (!post || !post.link) {
        return null;
    }
    return {
        title: String(post.title || '').trim(),
        link: String(post.link).trim(),
        date: coerceDate(post.date || post.published_at || post.post_date)
    };
}

async function fetchAllPosts() {
    const allPosts = [];
    let offset = 0;
    let page = 1;

    logEvent('substack_fetch_start');

    while (true) {
        const url = `${archiveBaseUrl}${offset}`;
        logEvent('substack_fetch_page', { page, offset });

        const response = await fetchJSON(url);
        const posts = Array.isArray(response?.posts) ? response.posts : response;

        if (!Array.isArray(posts)) {
            throw new Error('Unexpected Substack response format');
        }

        if (posts.length === 0) {
            if (offset === 0) {
                throw new Error('No posts returned from Substack');
            }
            break;
        }

        posts.forEach(post => {
            if (post && post.title && (post.canonical_url || post.slug)) {
                allPosts.push({
                    title: post.title,
                    link: post.canonical_url || `https://farewellfiles.substack.com/p/${post.slug}`,
                    date: coerceDate(post.published_at || post.post_date)
                });
            }
        });

        if (posts.length < pageSize) {
            break;
        }

        offset += pageSize;
        page += 1;
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    logEvent('substack_fetch_end', { count: allPosts.length });
    return allPosts;
}

function readJsonIfExists(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
}

function mergePosts(existingPosts, fetchedPosts) {
    const merged = new Map();

    existingPosts.forEach(post => {
        const normalized = normalizePost(post);
        if (!normalized) {
            return;
        }
        const key = normalizeLink(normalized.link);
        if (!key) {
            return;
        }
        merged.set(key, normalized);
    });

    fetchedPosts.forEach(post => {
        const normalized = normalizePost(post);
        if (!normalized) {
            return;
        }
        const key = normalizeLink(normalized.link);
        if (!key) {
            return;
        }
        merged.set(key, normalized);
    });

    const mergedPosts = Array.from(merged.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
    logEvent('substack_merge_end', { count: mergedPosts.length });
    return mergedPosts;
}

function syncTagsFile(posts, tagsPath) {
    let tagsData = {};
    if (fs.existsSync(tagsPath)) {
        const parsed = JSON.parse(fs.readFileSync(tagsPath, 'utf8'));
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            tagsData = parsed;
        }
    }

    posts.forEach(post => {
        if (!post || !post.link) {
            return;
        }
        let urlPath = '';
        try {
            urlPath = new URL(post.link).pathname;
        } catch (err) {
            return;
        }
        if (!urlPath) {
            return;
        }
        const existing = tagsData[urlPath];
        const tags = Array.isArray(existing?.tags) ? existing.tags : [];
        tagsData[urlPath] = {
            title: post.title,
            date: post.date,
            tags
        };
    });

    fs.writeFileSync(tagsPath, JSON.stringify(tagsData, null, 2));
    logEvent('substack_tags_sync_end', { count: Object.keys(tagsData).length });
}

async function main() {
    try {
        const fetchedPosts = await fetchAllPosts();
        if (!Array.isArray(fetchedPosts) || fetchedPosts.length === 0) {
            throw new Error('Empty Substack result');
        }

        const outputPath = path.join(dataDir, 'farewellfiles.json');
        const tagsPath = path.join(dataDir, 'essay-tags.json');

        let existingPosts = [];
        try {
            const existingData = readJsonIfExists(outputPath);
            if (Array.isArray(existingData)) {
                existingPosts = existingData;
            }
        } catch (err) {
            throw new Error(`Failed to read existing archive: ${err.message}`);
        }

        const mergedPosts = mergePosts(existingPosts, fetchedPosts);
        if (mergedPosts.length === 0) {
            throw new Error('Merged archive is empty');
        }

        fs.writeFileSync(outputPath, JSON.stringify(mergedPosts, null, 2));
        syncTagsFile(mergedPosts, tagsPath);
    } catch (error) {
        logEvent('substack_fetch_error', { message: error.message });
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
