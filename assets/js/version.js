// Build version loader for cache-busting
window.__getBuildVersion = (async () => {
  try {
    const res = await fetch('/assets/data/version.json', { cache: 'no-store' });
    const { version } = await res.json();
    return version || String(Date.now());
  } catch {
    return String(Date.now());
  }
})();