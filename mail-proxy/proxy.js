/**
 * WEHOSTHERE — Zero-Cost IMAP & SMTP TLS Reverse Proxy
 * Encaminha conexões seguras de domínios customizados (ex: mail.msservices.co.mz, smtp.msservices.co.mz)
 * diretamente para a infraestrutura da Migadu (imap.migadu.com e smtp.migadu.com).
 */

const tls = require('tls');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Portas e Destinos Migadu
const CONFIG = {
  imap: {
    port: parseInt(process.env.IMAP_PORT || '993', 10),
    targetHost: process.env.MIGADU_IMAP_HOST || 'imap.migadu.com',
    targetPort: 993,
  },
  smtp: {
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    targetHost: process.env.MIGADU_SMTP_HOST || 'smtp.migadu.com',
    targetPort: 465,
  },
  certsDir: process.env.CERTS_DIR || path.join(__dirname, 'certs'),
};

// Certificado padrão de fallback caso não haja certificado do domínio específico
function getDefaultTlsOptions() {
  const defaultCertPath = path.join(CONFIG.certsDir, 'default.crt');
  const defaultKeyPath = path.join(CONFIG.certsDir, 'default.key');

  if (fs.existsSync(defaultCertPath) && fs.existsSync(defaultKeyPath)) {
    return {
      cert: fs.readFileSync(defaultCertPath),
      key: fs.readFileSync(defaultKeyPath),
    };
  }

  // Gera certificado autoassinado temporário se não houver
  const selfsigned = require('selfsigned');
  const pems = selfsigned.generate([{ name: 'commonName', value: 'mail.wehosthere.com' }], { days: 365 });
  return { cert: pems.cert, key: pems.private };
}

// Resolução dinâmica de SNI (Server Name Indication) para múltiplos domínios de clientes
function sniCallback(servername, cb) {
  try {
    const certPath = path.join(CONFIG.certsDir, `${servername}.crt`);
    const keyPath = path.join(CONFIG.certsDir, `${servername}.key`);

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const ctx = tls.createSecureContext({
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath),
      });
      return cb(null, ctx);
    }
    // Fallback para contexto padrão
    return cb(null, defaultContext);
  } catch (err) {
    console.error(`[SNI Error] ${servername}:`, err.message);
    return cb(null, defaultContext);
  }
}

let defaultOptions;
let defaultContext;

try {
  defaultOptions = getDefaultTlsOptions();
  defaultContext = tls.createSecureContext(defaultOptions);
} catch (e) {
  console.warn('Aviso ao carregar certificados TLS:', e.message);
}

// 1. Proxy IMAP (Porta 993)
const imapServer = tls.createServer(
  {
    ...defaultOptions,
    SNICallback: sniCallback,
  },
  (clientSocket) => {
    const clientName = clientSocket.servername || 'cliente-desconhecido';
    console.log(`[IMAP] Nova conexão recebida para: ${clientName} (${clientSocket.remoteAddress})`);

    const upstream = tls.connect(
      {
        host: CONFIG.imap.targetHost,
        port: CONFIG.imap.targetPort,
        servername: CONFIG.imap.targetHost,
      },
      () => {
        clientSocket.pipe(upstream);
        upstream.pipe(clientSocket);
      }
    );

    upstream.on('error', (err) => {
      console.error(`[IMAP Upstream Error]: ${err.message}`);
      clientSocket.destroy();
    });

    clientSocket.on('error', (err) => {
      console.warn(`[IMAP Client Error]: ${err.message}`);
      upstream.destroy();
    });
  }
);

// 2. Proxy SMTP (Porta 465)
const smtpServer = tls.createServer(
  {
    ...defaultOptions,
    SNICallback: sniCallback,
  },
  (clientSocket) => {
    const clientName = clientSocket.servername || 'cliente-desconhecido';
    console.log(`[SMTP] Nova conexão recebida para: ${clientName} (${clientSocket.remoteAddress})`);

    const upstream = tls.connect(
      {
        host: CONFIG.smtp.targetHost,
        port: CONFIG.smtp.targetPort,
        servername: CONFIG.smtp.targetHost,
      },
      () => {
        clientSocket.pipe(upstream);
        upstream.pipe(clientSocket);
      }
    );

    upstream.on('error', (err) => {
      console.error(`[SMTP Upstream Error]: ${err.message}`);
      clientSocket.destroy();
    });

    clientSocket.on('error', (err) => {
      console.warn(`[SMTP Client Error]: ${err.message}`);
      upstream.destroy();
    });
  }
);

imapServer.listen(CONFIG.imap.port, '0.0.0.0', () => {
  console.log(`🚀 Proxy IMAP WeHostHere ativo na porta ${CONFIG.imap.port} -> ${CONFIG.imap.targetHost}:${CONFIG.imap.targetPort}`);
});

smtpServer.listen(CONFIG.smtp.port, '0.0.0.0', () => {
  console.log(`🚀 Proxy SMTP WeHostHere ativo na porta ${CONFIG.smtp.port} -> ${CONFIG.smtp.targetHost}:${CONFIG.smtp.targetPort}`);
});

// Servidor HTTP interno de Health Check e status para Vercel Services
const httpPort = parseInt(process.env.PORT || '3000', 10);
const httpServer = http.createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      service: 'mail-proxy',
      imap: { port: CONFIG.imap.port, target: CONFIG.imap.targetHost },
      smtp: { port: CONFIG.smtp.port, target: CONFIG.smtp.targetHost },
      uptime: process.uptime(),
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

httpServer.listen(httpPort, '0.0.0.0', () => {
  console.log(`🚀 Servidor HTTP de Health/Status ativo na porta ${httpPort}`);
});
