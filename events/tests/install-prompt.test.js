import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../assets/js/install-prompt.js', import.meta.url), 'utf8');
const countKey = 'event-management-install-page-loads';
const installedKey = 'event-management-installed';

function createPage(values, { standalone = false, authPending = false, existingModal = false } = {}) {
    function target() {
        const listeners = {};
        return {
            addEventListener(name, callback) { (listeners[name] ||= []).push(callback); },
            dispatch(name, event = {}) { return (listeners[name] || []).map(callback => callback(event)); }
        };
    }

    const storage = {
        getItem(key) { return values.has(key) ? values.get(key) : null; },
        setItem(key, value) { values.set(key, String(value)); },
        removeItem(key) { values.delete(key); }
    };
    const state = { authPending, existingModal, dialog: null, observer: null };
    const document = Object.assign(target(), {
        visibilityState: 'visible',
        documentElement: { classList: { contains() { return state.authPending; } } },
        body: { append(element) { state.dialog = element; } },
        querySelector() { return state.existingModal || state.dialog?.open ? {} : null; },
        createElement() {
            const buttons = {
                '.install-later': target(),
                '.install-confirm': target(),
                '.install-dialog-error': { hidden: true, textContent: '' }
            };
            return Object.assign(target(), {
                open: false,
                setAttribute() {},
                querySelector(selector) { return buttons[selector]; },
                showModal() { this.open = true; },
                close() { this.open = false; }
            });
        }
    });
    const window = Object.assign(target(), {
        localStorage: storage,
        navigator: { standalone },
        matchMedia() { return { matches: standalone }; }
    });
    class MutationObserver {
        constructor(callback) { state.observer = callback; }
        observe() {}
    }
    runInNewContext(source, { window, document, MutationObserver, console });
    return { window, document, state };
}

function offer(page, prompt = async () => {}) {
    const event = { preventDefault() {}, prompt, userChoice: Promise.resolve({ outcome: 'accepted' }) };
    page.window.dispatch('beforeinstallprompt', event);
}

test('offers on every fifth page load, not after each dismissal', () => {
    const values = new Map();
    for (let i = 1; i <= 10; i++) {
        const page = createPage(values);
        offer(page);
        assert.equal(Boolean(page.state.dialog?.open), i === 5 || i === 10);
        if (page.state.dialog?.open) page.state.dialog.querySelector('.install-later').dispatch('click');
    }
});

test('waits until a browser offer is available and the page is ready', () => {
    const values = new Map();
    for (let i = 0; i < 5; i++) createPage(values);
    const page = createPage(values, { authPending: true });
    offer(page);
    assert.equal(page.state.dialog, null);
    assert.equal(values.get(countKey), '5');
    page.state.authPending = false;
    page.state.existingModal = true;
    page.state.observer();
    assert.equal(page.state.dialog, null);
    page.state.existingModal = false;
    page.state.observer();
    assert.equal(page.state.dialog.open, true);
});

test('starts installation only after a click and stops after installation', async () => {
    const values = new Map([[countKey, '4']]);
    const page = createPage(values);
    let calls = 0;
    offer(page, async () => { calls++; });
    assert.equal(calls, 0);
    const button = page.state.dialog.querySelector('.install-confirm');
    await Promise.all(button.dispatch('click', { currentTarget: button }));
    assert.equal(calls, 1);
    page.window.dispatch('appinstalled');
    assert.equal(values.get(installedKey), '1');
    for (let i = 0; i < 10; i++) {
        const later = createPage(values);
        offer(later);
        assert.equal(later.state.dialog, null);
    }
});

test('never offers in an installed standalone app', () => {
    const values = new Map([[countKey, '4']]);
    const page = createPage(values, { standalone: true });
    offer(page);
    assert.equal(page.state.dialog, null);
    assert.equal(values.get(installedKey), '1');
});
