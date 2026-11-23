(() => {
    const countKey = 'event-management-install-page-loads';
    const installedKey = 'event-management-installed';
    const interval = 5;
    let storage;
    let deferredPrompt = null;
    let dialog = null;

    try {
        storage = window.localStorage;
        if (isStandalone()) {
            storage.setItem(installedKey, '1');
        } else if (storage.getItem(installedKey) !== '1') {
            const previous = Number(storage.getItem(countKey));
            const count = Number.isSafeInteger(previous) && previous >= 0 ? previous : 0;
            storage.setItem(countKey, String(Math.min(interval, count + 1)));
        }
    } catch (error) {
        console.error('Unable to access install prompt preferences:', error);
        return;
    }

    function isStandalone() {
        return window.matchMedia('(display-mode: standalone)').matches ||
            window.matchMedia('(display-mode: window-controls-overlay)').matches ||
            window.navigator.standalone === true;
    }

    function markInstalled() {
        try {
            storage.setItem(installedKey, '1');
            storage.removeItem(countKey);
        } catch (error) {
            console.error('Unable to save install status:', error);
        }
        deferredPrompt = null;
        if (dialog?.open) dialog.close();
    }

    function showPrompt() {
        if (!deferredPrompt || !document.body || document.visibilityState !== 'visible' ||
            document.documentElement.classList.contains('auth-pending') ||
            document.querySelector('.modal.show, dialog[open], #offlineState')) return;

        try {
            if (isStandalone()) {
                markInstalled();
                return;
            }
            if (storage.getItem(installedKey) === '1' || Number(storage.getItem(countKey)) < interval) return;

            if (!dialog) {
                dialog = document.createElement('dialog');
                dialog.className = 'install-dialog';
                dialog.setAttribute('aria-labelledby', 'installDialogTitle');
                dialog.setAttribute('aria-describedby', 'installDialogDescription');
                dialog.innerHTML = `
                    <h2 id="installDialogTitle">Install Event Management</h2>
                    <p id="installDialogDescription">Add the app to your device for quicker access. An internet connection is still required.</p>
                    <p class="install-dialog-error" role="alert" hidden></p>
                    <div class="install-dialog-actions">
                        <button type="button" class="install-later">Not now</button>
                        <button type="button" class="install-confirm">Install app</button>
                    </div>`;
                document.body.append(dialog);
                dialog.querySelector('.install-later').addEventListener('click', () => dialog.close());
                dialog.querySelector('.install-confirm').addEventListener('click', installApp);
            }
            dialog.showModal();
            storage.setItem(countKey, '0');
        } catch (error) {
            console.error('Unable to show install prompt:', error);
        }
    }

    async function installApp(event) {
        if (!deferredPrompt) {
            dialog.querySelector('.install-dialog-error').textContent = 'Installation is not available. Please use your browser menu.';
            dialog.querySelector('.install-dialog-error').hidden = false;
            return;
        }
        const prompt = deferredPrompt;
        deferredPrompt = null;
        const button = event.currentTarget;
        button.disabled = true;
        try {
            await prompt.prompt();
            await prompt.userChoice;
            dialog.close();
        } catch (error) {
            console.error('Unable to start installation:', error);
            const message = dialog.querySelector('.install-dialog-error');
            message.textContent = 'Unable to start installation. Please use your browser menu.';
            message.hidden = false;
        } finally {
            button.disabled = false;
        }
    }

    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferredPrompt = event;
        showPrompt();
    });
    window.addEventListener('appinstalled', markInstalled);
    window.addEventListener('storage', (event) => {
        if (event.key === installedKey && event.newValue === '1') {
            deferredPrompt = null;
            if (dialog?.open) dialog.close();
        }
    });
    document.addEventListener('visibilitychange', showPrompt);
    document.addEventListener('DOMContentLoaded', showPrompt);
    new MutationObserver(showPrompt).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class', 'open'],
        subtree: true
    });
})();
