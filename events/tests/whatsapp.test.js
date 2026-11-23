import { test } from 'node:test';
import assert from 'node:assert/strict';
import { whatsappChatUrl, validateWhatsappSettings } from '../assets/js/whatsapp-helpers.js';
import { chooseDefaultEvent } from '../assets/js/event-helpers.js';

test('formats local and international numbers without changing the invite link', () => {
    const url = new URL(whatsappChatUrl('0801 234 5678', '234', 'https://chat.whatsapp.com/ABC123'));
    assert.equal(url.pathname, '/2348012345678');
    assert.match(url.searchParams.get('text'), /https:\/\/chat\.whatsapp\.com\/ABC123/);
    assert.equal(new URL(whatsappChatUrl('+44 7700 900123', '234', '')).pathname, '/447700900123');
    assert.equal(new URL(whatsappChatUrl('0044 7700 900123', '234', '')).pathname, '/447700900123');
});

test('preserves WhatsApp invite link query parameters', () => {
    const link = 'https://chat.whatsapp.com/CODE?s=cl&p=a&iam=2';
    const url = new URL(whatsappChatUrl('08012345678', '234', link));
    assert.equal(url.searchParams.get('text'), `Hello, here is the WhatsApp group invite link: ${link}`);
});

test('rejects invalid numbers, country codes and invite links', () => {
    assert.throws(() => whatsappChatUrl('08012345678', '', ''));
    assert.throws(() => whatsappChatUrl('phone 123', '234', ''));
    assert.throws(() => whatsappChatUrl('+123', '234', ''));
    assert.throws(() => whatsappChatUrl('+2348012345678', '234', 'https://example.com/invite'));
    assert.throws(() => whatsappChatUrl('+2348012345678', '234', 'https://chat.whatsapp.com.example.com/CODE?s=cl'));
    assert.throws(() => whatsappChatUrl('+2348012345678', '234', 'https://user@chat.whatsapp.com/CODE'));
    assert.throws(() => whatsappChatUrl('+2348012345678', '234', 'https://chat.whatsapp.com/CODE/extra'));
});

test('validates and normalizes shared event settings', () => {
    assert.deepEqual(validateWhatsappSettings(' +234 ', ' https://chat.whatsapp.com/CODE?s=cl&p=a&iam=2 '), {
        countryCode: '234', groupLink: 'https://chat.whatsapp.com/CODE?s=cl&p=a&iam=2'
    });
    assert.deepEqual(validateWhatsappSettings('44', ''), { countryCode: '44', groupLink: '' });
    assert.throws(() => validateWhatsappSettings('', ''));
    assert.throws(() => validateWhatsappSettings('234', 'https://chat.whatsapp.com/CODE?bad value'));
    assert.throws(() => validateWhatsappSettings('234', `https://chat.whatsapp.com/CODE?x=${'a'.repeat(2048)}`));
});

test('chooses the active event, then the nearest upcoming open event', () => {
    const now = new Date(2026, 10, 23);
    const active = { id: 1, start_date: '2026-11-22', end_date: '2026-11-24' };
    const upcoming = { id: 2, start_date: '2026-11-30', end_date: '2026-12-01' };
    const later = { id: 3, start_date: '2026-12-03', end_date: '2026-12-04' };
    assert.equal(chooseDefaultEvent([later, active, upcoming], now), active);
    assert.equal(chooseDefaultEvent([later, upcoming], now), upcoming);
    assert.equal(chooseDefaultEvent([], now), null);
});
