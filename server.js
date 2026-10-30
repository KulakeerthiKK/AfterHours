// AEGIS-AGENT Local Prototype Server & API Skeleton (Zero Dependencies)
// Uses native Node.js core modules only. Hosts both frontend and /api endpoints.

const http = require('http');
const fs = require('fs');
const path = require('path');

// Safe native .env file loader (Zero external dependencies)
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"](.*)['"]$/, '$1');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    } catch (e) {
      console.warn('Note: Could not parse local .env file:', e.message);
    }
  }
}
loadEnvFile();

const { handleApiRequest } = require('./backend/routes');
const { initDb } = require('./backend/db');

// Initialize database storage (PostgreSQL or persistent native SQLite)
initDb().catch(err => console.warn('Database initialization note:', err.message));

const PORT = process.env.PORT || 3000;
const BASE_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf'
};

function serveFile(req, res) {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  // Security barrier: Strictly forbid access to .env, .git, and hidden credentials
  if (reqPath.startsWith('/.') || reqPath.includes('/.env') || reqPath.includes('/.git') || reqPath.includes('/migrations')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden: Protected System File');
    return;
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(BASE_DIR, safePath);

  // Check if file exists within BASE_DIR
  if (!filePath.startsWith(BASE_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + reqPath);
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Error');
      }
      return;
    }

    if (stats.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      fs.stat(indexFile, (err2) => {
        if (!err2) {
          serveStaticFile(indexFile, res);
        } else {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Directory listing prohibited');
        }
      });
      return;
    }

    serveStaticFile(filePath, res);
  });
}

function serveStaticFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Error reading file');
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  // Add basic security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Prototype-Notice', 'AEGIS-AGENT-Local-Demo');

  // Route API requests to backend skeleton
  if (req.url.startsWith('/api/') || req.url === '/api') {
    handleApiRequest(req, res);
    return;
  }

  serveFile(req, res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('====================================================');
  console.log('🛡️  AEGIS-AGENT Security War Room API & UI is running!');
  console.log('----------------------------------------------------');
  console.log(`📡 Local Frontend: http://localhost:${PORT}`);
  console.log(`🔌 Backend API:    http://localhost:${PORT}/api/runs`);
  console.log('🔒 Mode: Local Prototype (Authorized Scope Only)');
  console.log('ℹ️  Notice: Front-end demo - no real scans or code changes');
  console.log('====================================================');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    const fallbackPort = Number(PORT) + 1;
    console.warn(`Port ${PORT} in use, trying ${fallbackPort}...`);
    server.listen(fallbackPort, '127.0.0.1');
  } else {
    console.error('Server error:', e);
  }
});
