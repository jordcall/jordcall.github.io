(() => {
    const button = document.querySelector('.lst-load-video');
    const player = document.getElementById('rehearsal-player');
    const template = document.getElementById('rehearsal-embed');

    if (!button || !player || !template) return;

    let iframe;

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

    // No Instagram request is made until the visitor chooses to load the embed.
    // The direct link in the HTML also works without JavaScript or the embed.
    button.hidden = false;
    button.addEventListener('click', () => {
        const content = template.content.cloneNode(true);
        iframe = content.querySelector('iframe');
        player.append(content);
        player.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        iframe.focus();
        button.hidden = true;
    }, { once: true });
})();
