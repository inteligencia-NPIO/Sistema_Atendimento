let API_URL = '';

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  API_URL = 'http://127.0.0.1:8000';
} else {
  API_URL = '';
}

export default API_URL;