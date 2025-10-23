// Dynamically determine backend URL based on environment
const backend_url = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://127.0.0.1:8000' 
    : 'https://api.bmp.com.ng';