const { pathToRegexp } = require('path-to-regexp');

const patterns = [
  '/api/(.*)', 
  '/api/:path*',
  '/api/:path(.*)',
  '/api/{*path}'
];

patterns.forEach(p => {
  try {
    const keys = [];
    const re = pathToRegexp(p, keys);
    console.log(`PASS: "${p}" ->`, re);
  } catch (e) {
    console.log(`FAIL: "${p}" ->`, e.message);
  }
});
