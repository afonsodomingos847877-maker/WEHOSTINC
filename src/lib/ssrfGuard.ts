import dns from 'dns/promises';
import net from 'net';

function isBlockedIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true; // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8
  if (a === 169 && b === 254) return true; // Link-local / cloud metadata 169.254.0.0/16
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  if (a === 192 && b === 0 && parts[2] === 0) return true; // IETF 192.0.0.0/24
  if (a === 192 && b === 0 && parts[2] === 2) return true; // TEST-NET-1
  if (a === 198 && (b === 18 || b === 19)) return true; // Benchmarking 198.18.0.0/15
  if (a >= 224) return true; // Multicast & reserved
  return false;
}

export function isBlockedIp(ip: string): boolean {
  const clean = ip.trim().toLowerCase().replace(/^\[|\]$/g, '');
  if (!clean) return true;

  if (net.isIPv4(clean)) {
    return isBlockedIPv4(clean);
  }

  if (net.isIPv6(clean)) {
    // Strip IPv6 zone ID if present
    const withoutZone = clean.split('%')[0];
    if (withoutZone === '::' || withoutZone === '::1') return true;
    // IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1 or ::ffff:7f00:1)
    if (withoutZone.startsWith('::ffff:')) {
      const mapped = withoutZone.slice(7);
      if (net.isIPv4(mapped)) {
        return isBlockedIPv4(mapped);
      }
      return true;
    }
    // ULA fc00::/7 (fc.. or fd..) and link-local fe80::/10 (fe8.. fe9.. fea.. feb..)
    if (/^(fc|fd|fe8|fe9|fea|feb)/i.test(withoutZone)) return true;
    if (withoutZone.startsWith('ff')) return true; // Multicast
    return false;
  }

  return true;
}

export function isBlockedHostnameString(hostname: string): boolean {
  const h = hostname.trim().toLowerCase().replace(/\.+$/, '');
  if (!h) return true;
  if (
    h === 'localhost' ||
    h.endsWith('.localhost') ||
    h.endsWith('.local') ||
    h.endsWith('.internal') ||
    h.endsWith('.arpa')
  ) {
    return true;
  }
  const cleanIp = h.replace(/^\[|\]$/g, '');
  if (net.isIP(cleanIp)) {
    return isBlockedIp(cleanIp);
  }
  return false;
}

export async function assertSafePublicHostname(hostname: string): Promise<void> {
  const cleanHost = hostname.trim().replace(/^\[|\]$/g, '');
  if (isBlockedHostnameString(cleanHost)) {
    throw new Error('Host interno ou reservado não permitido.');
  }

  if (net.isIP(cleanHost)) {
    if (isBlockedIp(cleanHost)) {
      throw new Error('Endereço IP privado ou reservado não permitido.');
    }
    return;
  }

  const records = await dns.lookup(cleanHost, { all: true });
  if (!records || records.length === 0) {
    throw new Error('Não foi possível resolver o host de destino.');
  }
  for (const rec of records) {
    if (isBlockedIp(rec.address)) {
      throw new Error('Host resolve para endereço IP interno ou reservado.');
    }
  }
}

export async function assertSafePublicUrl(
  rawUrl: string,
  allowedProtocols: string[] = ['https:', 'http:']
): Promise<URL> {
  const target = new URL(rawUrl);
  if (!allowedProtocols.includes(target.protocol)) {
    throw new Error('Protocolo não permitido.');
  }
  if (target.username || target.password) {
    throw new Error('Credenciais embutidas na URL não são permitidas.');
  }
  await assertSafePublicHostname(target.hostname);
  return target;
}

export async function safeFetchPublicUrl(
  rawUrl: string,
  options: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    maxRedirects?: number;
    allowedProtocols?: string[];
  } = {}
): Promise<Response> {
  const {
    headers = {},
    timeoutMs = 15000,
    maxRedirects = 3,
    allowedProtocols = ['https:', 'http:'],
  } = options;

  let currentUrl = rawUrl;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    for (let hop = 0; hop <= maxRedirects; hop++) {
      const parsed = await assertSafePublicUrl(currentUrl, allowedProtocols);
      const res = await fetch(parsed.toString(), {
        headers,
        signal: controller.signal,
        redirect: 'manual',
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('location');
        if (!location || hop === maxRedirects) {
          throw new Error('Redirecionamento excessivo ou inválido.');
        }
        currentUrl = new URL(location, parsed).toString();
        continue;
      }

      return res;
    }

    throw new Error('Limite de redirecionamentos excedido.');
  } finally {
    clearTimeout(timer);
  }
}

