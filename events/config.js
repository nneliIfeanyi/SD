const localHosts = ['localhost', '127.0.0.1', '[::1]', '::1'];
const isLocal = localHosts.includes(window.location.hostname);

window.APP_API_URL = isLocal
    ? 'http://localhost/SD-api'
    : 'https://api.leadstar.com.ng/SD';
