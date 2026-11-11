#!/usr/bin/env node
/**
 * scripts/start-with-agent.js
 * Inicia o Next.js no Render e ativa o ciclo de monitorização automática
 * do Agente de E-mail (CRON) a cada 5 minutos em segundo plano.
 */
const { spawn } = require('child_process');
const http = require('http');

const PORT = process.env.PORT || 10000;
const CRON_SECRET = process.env.CRON_SECRET || '1f68a2837fbfbc2452ecff2c845d1f28';
const CHECK_INTERVAL_MS = Math.max(60 * 1000, Number(process.env.AGENT_CHECK_INTERVAL_MS) || 2 * 60 * 1000);

console.log(`[Render Runner] A iniciar Next.js na porta ${PORT}...`);

const nextBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(nextBin, ['next', 'start', '-p', String(PORT)], {
  stdio: 'inherit',
  env: process.env,
});

child.on('error', (err) => {
  console.error('[Render Runner] Erro no processo Next.js:', err);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  console.log(`[Render Runner] Next.js terminou com código ${code} e sinal ${signal}`);
  process.exit(code || 0);
});

function callAgentCron() {
  const url = `http://127.0.0.1:${PORT}/api/cron/ai-email-agent`;
  const req = http.request(
    url,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
        'User-Agent': 'Render-Internal-Cron/1.0',
      },
      timeout: 45000,
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const replies = parsed?.results?.reduce((acc, r) => acc + (r.repliedCount || 0), 0) || 0;
          console.log(
            `[Render Agent Worker] Sucesso (Status ${res.statusCode}): ${parsed.processedConfigs || 0} caixa(s), ${replies} resposta(s) enviada(s).`
          );
        } catch {
          console.log(`[Render Agent Worker] Executado (Status ${res.statusCode})`);
        }
      });
    }
  );

  req.on('error', (err) => {
    console.warn('[Render Agent Worker] Aviso ao contactar agente local:', err.message);
  });

  req.on('timeout', () => {
    req.destroy();
  });

  req.end();
}

function waitForServerReady(retries = 30) {
  if (retries <= 0) {
    console.warn('[Render Runner] Servidor demorou a responder, iniciando timer de contingência...');
    setInterval(callAgentCron, CHECK_INTERVAL_MS);
    return;
  }

  const req = http.get(`http://127.0.0.1:${PORT}/api/health`, { timeout: 3000 }, (res) => {
    if (res.statusCode >= 200 && res.statusCode < 400) {
      console.log(`[Render Runner] Next.js pronto na porta ${PORT}! Ativando Agente de E-mail automático a cada ${CHECK_INTERVAL_MS / 60000} minutos.`);
      setTimeout(callAgentCron, 25000);
      setInterval(callAgentCron, CHECK_INTERVAL_MS);
    } else {
      setTimeout(() => waitForServerReady(retries - 1), 2000);
    }
  });

  req.on('error', () => {
    setTimeout(() => waitForServerReady(retries - 1), 2000);
  });
}

setTimeout(() => waitForServerReady(), 5000);

process.on('SIGTERM', () => {
  console.log('[Render Runner] SIGTERM recebido, encerrando...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('[Render Runner] SIGINT recebido, encerrando...');
  child.kill('SIGINT');
});

