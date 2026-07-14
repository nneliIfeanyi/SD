function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.info('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.warn('Service Worker registration failed:', error);
            });
    });
}
