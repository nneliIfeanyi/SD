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
        const code = countryCode.trim().replace(/^\+/, '');
        if (!/^[1-9]\d{0,2}$/.test(code)) {
            throw new Error('Enter a valid local country code.');
        }
        number = code + number.slice(1);
    }
    if (!/^[1-9]\d{7,14}$/.test(number)) {
        throw new Error('Use a valid international number or a local number starting with 0.');
    }

    const link = groupLink.trim();
    if (link && !/^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+\/?$/.test(link)) {
        throw new Error('Enter a valid WhatsApp group invite link.');
    }
    const url = new URL(`https://wa.me/${number}`);
    if (link) {
        url.searchParams.set('text', `Hello, here is the WhatsApp group invite link: ${link}`);
    }
    return url.href;
}
