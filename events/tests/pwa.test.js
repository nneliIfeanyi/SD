import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const appUrl = new URL('../', import.meta.url);
const manifestUrl = new URL('manifest.json', appUrl);
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'));

test('manifest starts the Event Management app within its own scope', () => {
    assert.equal(manifest.name, 'Event Management');
    assert.equal(manifest.display, 'standalone');
    assert.equal(new URL(manifest.id, manifestUrl).href, appUrl.href);
    assert.equal(new URL(manifest.start_url, manifestUrl).href, appUrl.href);
    assert.equal(new URL(manifest.scope, manifestUrl).href, appUrl.href);
});

test('install icons exist as PNGs at the declared sizes', () => {
    for (const size of [192, 512]) {
        const icon = manifest.icons.find(item => item.sizes === `${size}x${size}` && item.type === 'image/png');
        assert.ok(icon, `Missing ${size}px icon`);
        const png = readFileSync(new URL(icon.src, manifestUrl));
        assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
        assert.equal(png.readUInt32BE(16), size);
        assert.equal(png.readUInt32BE(20), size);
    }
});

test('login and every admin page load the manifest and install prompt', () => {
    const pages = [new URL('index.html', appUrl)];
    for (const entry of readdirSync(new URL('pages/', appUrl), { withFileTypes: true })) {
        if (entry.isFile() && entry.name.endsWith('.html')) pages.push(new URL(`pages/${entry.name}`, appUrl));
    }
    for (const page of pages) {
        const html = readFileSync(page, 'utf8');
        const link = html.match(/<link\s+rel="manifest"\s+href="([^"]+)"/);
        assert.ok(link, `Missing manifest link in ${page.pathname}`);
        assert.equal(new URL(link[1], page).href, manifestUrl.href);
        const script = html.match(/<script\s+defer\s+src="([^"]*install-prompt\.js\?v=1)"/);
        assert.ok(script, `Missing install prompt in ${page.pathname}`);
        assert.equal(new URL(script[1], page).pathname, new URL('assets/js/install-prompt.js', appUrl).pathname);
    }
});
