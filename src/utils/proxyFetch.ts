import { ChatConfig } from '../types';
import { getWorkingProxy, formatProxyUrl, ProxyConfig } from './proxyManager';

const proxyCache = new Map<string, ProxyConfig>();
let currentProxyConfig: ProxyConfig | null = null;

export async function getProxyForChat(chatConfig: ChatConfig): Promise<ProxyConfig | null> {
  if (!chatConfig.proxyMode || chatConfig.proxyMode === 'none') {
    return null;
  }

  if (chatConfig.proxyMode === 'manual') {
    if (!chatConfig.proxyHost || !chatConfig.proxyPort) {
      console.warn('Manual proxy mode enabled but host/port not configured');
      return null;
    }

    return {
      host: chatConfig.proxyHost,
      port: chatConfig.proxyPort,
      username: chatConfig.proxyUsername,
      password: chatConfig.proxyPassword,
      protocol: 'http'
    };
  }

  if (chatConfig.proxyMode === 'auto') {
    const cacheKey = `auto_${chatConfig.proxyCountry || 'any'}`;

    if (proxyCache.has(cacheKey)) {
      const cached = proxyCache.get(cacheKey)!;
      console.log('Using cached proxy:', cached.host);
      return cached;
    }

    console.log('Fetching working proxy for country:', chatConfig.proxyCountry || 'Любая');
    const proxy = await getWorkingProxy(chatConfig.proxyCountry || 'Любая');

    if (proxy) {
      proxyCache.set(cacheKey, proxy);
      setTimeout(() => proxyCache.delete(cacheKey), 300000); // Cache for 5 minutes
      console.log('Found working proxy:', proxy.host);
      return proxy;
    } else {
      console.warn('No working proxy found, proceeding without proxy');
      return null;
    }
  }

  return null;
}

async function configureElectronProxy(proxy: ProxyConfig | null): Promise<void> {
  if (!window.electronAPI?.proxy) {
    console.warn('Electron proxy API not available');
    return;
  }

  try {
    if (proxy) {
      const result = await window.electronAPI.proxy.setProxy({
        host: proxy.host,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password
      });

      if (result.success) {
        console.log(`✓ Proxy configured: ${proxy.host}:${proxy.port}`);
        currentProxyConfig = proxy;
      } else {
        console.error('Failed to configure proxy:', result.error);
      }
    } else {
      if (currentProxyConfig) {
        const result = await window.electronAPI.proxy.clearProxy();
        if (result.success) {
          console.log('✓ Proxy cleared');
          currentProxyConfig = null;
        }
      }
    }
  } catch (error) {
    console.error('Error configuring Electron proxy:', error);
  }
}

export async function fetchWithProxy(
  url: string,
  options: RequestInit,
  chatConfig: ChatConfig
): Promise<Response> {
  const proxy = await getProxyForChat(chatConfig);

  // Настраиваем прокси на уровне Electron session
  await configureElectronProxy(proxy);

  // Теперь все fetch запросы будут автоматически идти через настроенный прокси
  return fetch(url, options);
}

export function clearProxyCache(): void {
  proxyCache.clear();
}

