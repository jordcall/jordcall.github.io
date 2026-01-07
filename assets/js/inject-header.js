// Inject header partial into every page
document.addEventListener('DOMContentLoaded', async function() {
    debugLog('header_inject_start', { path: location.pathname });
    try {
        const v = await window.__getBuildVersion;
        debugLog('fetch_start', { name: 'header', path: '/partials/header.html' });
        debugTime('fetch_header');
        const response = await fetch(`/partials/header.html?v=${encodeURIComponent(v)}`, { cache: 'no-store' });
        debugTimeEnd('fetch_header');
        debugLog('fetch_end', { name: 'header', status: response.status });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const headerHtml = await response.text();
        
        // Insert header as first child of body
        const body = document.body;
        const headerContainer = document.createElement('div');
        headerContainer.innerHTML = headerHtml;
        
        // Insert all header elements at the beginning of body
        while (headerContainer.firstChild) {
            body.insertBefore(headerContainer.firstChild, body.firstChild);
        }
        
        // Initialize navigation after header is injected
        if (typeof initNav === 'function') {
            initNav();
        }
        debugLog('header_inject_done', { navInit: typeof initNav === 'function' });
        
        // Set current year in footer
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
        
    } catch (error) {
        debugError('header_inject_error', { message: error.message });
    }
});
