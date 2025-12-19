// Inject header partial into every page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const v = await window.__getBuildVersion;
        const response = await fetch(`/partials/header.html?v=${encodeURIComponent(v)}`, { cache: 'no-store' });
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
        
        // Set current year in footer
        const yearElement = document.getElementById('current-year');
        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
        
    } catch (error) {
        console.error('Failed to load header:', error);
    }
});