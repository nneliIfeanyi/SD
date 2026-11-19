const OFFLINE_STATE_ID = 'offlineState';

function renderOfflineState(status) {
    let screen = document.getElementById(OFFLINE_STATE_ID);
    if (!screen) {
        screen = document.createElement('main');
        screen.id = OFFLINE_STATE_ID;
        screen.className = 'offline-state';
        screen.setAttribute('role', 'alert');
        screen.setAttribute('aria-live', 'assertive');
        screen.innerHTML = `
            <section class="offline-card" aria-labelledby="offlineTitle" aria-describedby="offlineDescription">
                <div class="offline-state-icon" aria-hidden="true">!</div>
                <p class="offline-eyebrow">EVENT ADMIN</p>
                <h1 id="offlineTitle"></h1>
                <p id="offlineDescription" class="offline-description"></p>
                <div class="offline-status">
                    <span class="offline-status-dot" aria-hidden="true"></span>
                    <span id="offlineStatusText"></span>
                </div>
                <button type="button" class="btn btn-primary" id="offlineRetryButton">
                    <i class="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>Try again
                </button>
            </section>`;
        document.body.append(screen);
        screen.querySelector('#offlineRetryButton').addEventListener('click', () => {
            if (navigator.onLine === false) {
                renderOfflineState('offline');
                return;
            }
            window.location.reload();
        });
    }

    const copy = {
        offline: {
            title: "You're offline",
            description: 'Check your internet connection. The event admin will be ready when you reconnect.',
            status: 'Waiting for your connection',
            disabled: true
        },
        interrupted: {
            title: 'Connection interrupted',
            description: "We can't reach the event service right now. Check your connection and try again.",
            status: 'Unable to reach the event service',
            disabled: false
        },
        restored: {
            title: 'Connection restored',
            description: 'You are back online. Reload the page to continue.',
            status: 'Your connection is available',
            disabled: false
        }
    }[status];

    screen.querySelector('#offlineTitle').textContent = copy.title;
    screen.querySelector('#offlineDescription').textContent = copy.description;
    screen.querySelector('#offlineStatusText').textContent = copy.status;
    screen.querySelector('#offlineRetryButton').disabled = copy.disabled;
}

export class OfflineError extends Error {
    constructor() {
        super('You appear to be offline. Check your internet connection and try again.');
        this.name = 'OfflineError';
    }
}

export function showOfflineState() {
    renderOfflineState(navigator.onLine === false ? 'offline' : 'interrupted');
}

window.addEventListener('offline', () => renderOfflineState('offline'));
window.addEventListener('online', () => {
    if (document.getElementById(OFFLINE_STATE_ID)) {
        renderOfflineState('restored');
    }
});

if (navigator.onLine === false) {
    renderOfflineState('offline');
}

if ('serviceWorker' in navigator) {
    const workerUrl = new URL('../../sw.js', import.meta.url);
    const scope = new URL('../../', import.meta.url).pathname;
    navigator.serviceWorker.register(workerUrl, { scope }).catch((error) => {
        console.error('Unable to register the offline page:', error);
    });
}
