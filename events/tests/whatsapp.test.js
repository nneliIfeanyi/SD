import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatsappChatUrl } from '../assets/js/whatsapp-helpers.js';

test('formats local and international numbers without changing the invite link', () => {
    const url = new URL(whatsappChatUrl('0801 234 5678', '234', 'https://chat.whatsapp.com/ABC123'));
    assert.equal(url.pathname, '/2348012345678');
    assert.match(url.searchParams.get('text'), /https:\/\/chat\.whatsapp\.com\/ABC123/);
    assert.equal(new URL(whatsappChatUrl('+44 7700 900123', '234', '')).pathname, '/447700900123');
    assert.equal(new URL(whatsappChatUrl('0044 7700 900123', '234', '')).pathname, '/447700900123');
});

test('rejects invalid numbers, country codes and invite links', () => {
    assert.throws(() => whatsappChatUrl('08012345678', '', ''));
    assert.throws(() => whatsappChatUrl('phone 123', '234', ''));
    assert.throws(() => whatsappChatUrl('+123', '234', ''));
    assert.throws(() => whatsappChatUrl('+2348012345678', '234', 'https://example.com/invite'));
});
