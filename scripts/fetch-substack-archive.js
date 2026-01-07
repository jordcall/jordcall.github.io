#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'assets', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const archiveBaseUrl = 'https://farewellfiles.substack.com/api/v1/archive?sort=new&offset=';
const pageSize = 12;
const retryStatuses = new Set([403, 429, 500, 502, 503, 504]);

function logEvent(name, details) {
    if (details) {
        console.log(name, details);
        return;
    }
    console.log(name);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getHeaders() {
    return {
        'User-Agent': process.env.SUBSTACK_UA || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
        'Accept': 'application/json,text/plain,*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://farewellfiles.substack.com/',
        'Origin': 'https://farewellfiles.substack.com'
    };
}

function getBackoffDelay(attempt) {
    const base = Math.min(16000, 1000 * (2 ** (attempt - 1)));
    return base + randomInt(100, 400);
}

async function fetchJson(url, context) {
    const headers = getHeaders();
    const maxAttempts = 5;
    const contextData = context && typeof context === 'object' ? context : {};

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        let response;
        try {
            response = await fetch(url, { headers });
        } catch (error) {
            logEvent('substack_fetch_page', { ...contextData, attempt, status: 'network_error' });
            if (attempt === maxAttempts) {
                throw error;
            }
            await delay(getBackoffDelay(attempt));
            continue;
        }

        const status = response.status;
        logEvent('substack_fetch_page', { ...contextData, attempt, status });

        if (response.ok) {
            return response.json();
        }

        if (!retryStatuses.has(status) || attempt === maxAttempts) {
            throw new Error(`HTTP ${status}`);
        }

        await delay(getBackoffDelay(attempt));
    }

    throw new Error('Failed to fetch Substack data');
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
        const response = await fetchJson(url, { page, offset });
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
        await delay(randomInt(400, 900));
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
