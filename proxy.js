/**
 * CORS Proxy — per Expo Web (expo start --web) ne development.
 * Run: node proxy.js
 * Proxon kerkesa nga localhost:8090 → https://kartaestudentitshkoder.al
 */
const https = require('https');
const http  = require('http');

const TARGET = 'kartaestudentitshkoder.al';
const PORT   = 8090;

http.createServer((req, res) => {
  const origin = req.headers['origin'] || '';

  // CORS headers per çdo pergjigje
  res.setHeader('Access-Control-Allow-Origin',  origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-WP-Nonce, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  // OPTIONS preflight — pergjigj menjehere pa shkuar tek serveri
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Percilll kerkesen tek serveri real
  const options = {
    hostname: TARGET,
    port:     443,
    path:     req.url,
    method:   req.method,
    headers:  { ...req.headers, host: TARGET },
  };

  // Hiq headerat qe mund te shkaktojne probleme
  delete options.headers['origin'];
  delete options.headers['referer'];

  const proxy = https.request(options, (proxyRes) => {
    // Hiq CORS headers te serverit (i zevdezojme me tonat)
    const headers = {};
    for (const [k, v] of Object.entries(proxyRes.headers)) {
      if (!k.toLowerCase().startsWith('access-control-')) headers[k] = v;
    }
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxy.on('error', (err) => {
    console.error('Proxy error:', err.message);
    if (!res.headersSent) { res.writeHead(502); res.end('Proxy error: ' + err.message); }
  });

  req.pipe(proxy);

}).listen(PORT, () => {
  console.log('\n✓ CORS Proxy aktiv');
  console.log(`  Dego:     http://localhost:${PORT}`);
  console.log(`  Proxon:   https://${TARGET}`);
  console.log('\n  Hap terminal tjeter dhe nis: npx expo start --web\n');
});
