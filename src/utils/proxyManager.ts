export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  country?: string;
  protocol?: 'http' | 'https' | 'socks4' | 'socks5';
}

export interface PublicProxy {
  ip: string;
  port: number;
  country: string;
  protocol: string;
  anonymity: string;
  speed: number;
}

const PROXY_SOURCES = [
  'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country={country}&ssl=all&anonymity=all',
  'https://www.proxy-list.download/api/v1/get?type=http&country={country}',
  'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
  'https://raw.githubusercontent.com/ShiftyTR/Proxy-List/master/http.txt',
  'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
  'https://raw.githubusercontent.com/clarketm/proxy-list/master/proxy-list-raw.txt',
  'https://raw.githubusercontent.com/sunny9577/proxy-scraper/master/proxies.txt',
];

const COUNTRY_CODES: Record<string, string> = {
  'США': 'US',
  'Германия': 'DE',
  'Франция': 'FR',
  'Великобритания': 'GB',
  'Нидерланды': 'NL',
  'Канада': 'CA',
  'Япония': 'JP',
  'Сингапур': 'SG',
  'Австралия': 'AU',
  'Бразилия': 'BR',
  'Индия': 'IN',
  'Россия': 'RU',
  'Украина': 'UA',
  'Польша': 'PL',
  'Испания': 'ES',
  'Италия': 'IT',
  'Швеция': 'SE',
  'Норвегия': 'NO',
  'Финляндия': 'FI',
  'Дания': 'DK',
  'Любая': 'all'
};

export function getCountryList(): string[] {
  return Object.keys(COUNTRY_CODES);
}

export function getCountryCode(countryName: string): string {
  return COUNTRY_CODES[countryName] || 'all';
}

export async function fetchPublicProxies(country: string = 'Любая'): Promise<PublicProxy[]> {
  const countryCode = getCountryCode(country);
  const proxies: PublicProxy[] = [];

  for (const sourceUrl of PROXY_SOURCES) {
    try {
      const url = sourceUrl.replace('{country}', countryCode === 'all' ? '' : countryCode);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) continue;

      const text = await response.text();
      const lines = text.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const [ip, port] = line.split(':');
        if (ip && port && /^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
          proxies.push({
            ip: ip.trim(),
            port: parseInt(port.trim()),
            country: countryCode,
            protocol: 'http',
            anonymity: 'unknown',
            speed: 0
          });
        }
      }

      if (proxies.length > 0) break;
    } catch (error) {
      console.error(`Failed to fetch from ${sourceUrl}:`, error);
    }
  }

  return proxies;
}

export async function testProxy(proxy: ProxyConfig, timeout: number = 5000): Promise<boolean> {
  try {
    const proxyUrl = proxy.username && proxy.password
      ? `http://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`
      : `http://${proxy.host}:${proxy.port}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal,
      // @ts-ignore - proxy support varies by environment
      agent: proxyUrl
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function getWorkingProxy(country: string = 'Любая'): Promise<ProxyConfig | null> {
  const proxies = await fetchPublicProxies(country);

  for (const proxy of proxies.slice(0, 10)) {
    const config: ProxyConfig = {
      host: proxy.ip,
      port: proxy.port,
      country: proxy.country,
      protocol: 'http'
    };

    const isWorking = await testProxy(config, 3000);
    if (isWorking) {
      return config;
    }
  }

  return null;
}

export function formatProxyUrl(proxy: ProxyConfig): string {
  if (proxy.username && proxy.password) {
    return `${proxy.protocol || 'http'}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
  }
  return `${proxy.protocol || 'http'}://${proxy.host}:${proxy.port}`;
}

export function parseProxyUrl(url: string): ProxyConfig | null {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 80,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      protocol: (parsed.protocol.replace(':', '') as any) || 'http'
    };
  } catch {
    return null;
  }
}
