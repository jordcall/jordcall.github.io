(() => {
    const iframe = document.querySelector('#rehearsal-player iframe');

    if (!iframe) return;

    // Accept only this Instagram frame's height updates, never arbitrary styles.
    window.addEventListener('message', (event) => {
        if (event.origin !== 'https://www.instagram.com' || event.source !== iframe?.contentWindow) return;

        let message;
        try {
            message = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        } catch {
            return;
        }

        const height = message?.details?.height;
        if (message?.type === 'MEASURE' && Number.isFinite(height) && height >= 200 && height <= 2000) {
            iframe.style.height = `${Math.ceil(height)}px`;
        }
    });

})();
