function normalizeCountryCode(countryCode) {
    const code = countryCode.trim().replace(/^\+/, '');
    if (!/^[1-9]\d{0,2}$/.test(code)) {
        throw new Error('Enter a valid local country code.');
    }
    return code;
}

function validateInviteLink(groupLink) {
    const link = groupLink.trim();
    if (link) {
        let inviteUrl;
        try {
            inviteUrl = new URL(link);
        } catch (error) {
            if (!(error instanceof TypeError)) throw error;
            throw new Error('Enter a valid WhatsApp group invite link.');
        }
        if (new TextEncoder().encode(link).length > 2048 || /[\s\x00-\x1f\x7f]/.test(link) ||
            inviteUrl.protocol !== 'https:' || inviteUrl.hostname !== 'chat.whatsapp.com' ||
            inviteUrl.port || inviteUrl.username || inviteUrl.password ||
            !/^\/[A-Za-z0-9]+\/?$/.test(inviteUrl.pathname)) {
            throw new Error('Enter a valid WhatsApp group invite link.');
        }
    }
    return link;
}

export function validateWhatsappSettings(countryCode, groupLink) {
    return { countryCode: normalizeCountryCode(countryCode), groupLink: validateInviteLink(groupLink) };
}

export function whatsappChatUrl(phone, countryCode, groupLink) {
    const raw = phone.trim();
    if (!/^\+?[\d\s().-]+$/.test(raw)) {
        throw new Error('The phone number is invalid.');
    }

    let number = raw.replace(/[\s().-]/g, '');
    if (number.startsWith('+')) {
        number = number.slice(1);
    } else if (number.startsWith('00')) {
        number = number.slice(2);
    } else if (number.startsWith('0')) {
        number = normalizeCountryCode(countryCode) + number.slice(1);
    }
    if (!/^[1-9]\d{7,14}$/.test(number)) {
        throw new Error('Use a valid international number or a local number starting with 0.');
    }

    const link = validateInviteLink(groupLink);
    const url = new URL(`https://wa.me/${number}`);
    if (link) {
        url.searchParams.set('text', `Hello, here is the WhatsApp group invite link: ${link}`);
    }
    return url.href;
}
