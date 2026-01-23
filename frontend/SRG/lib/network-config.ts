import { Platform } from 'react-native';

/**
 * Network configuration helper that automatically detects the correct backend URL
 * and provides fallbacks to prevent Axios network errors
 */

// Common development IP ranges to try (excluding router IPs)
const COMMON_DEV_IPS = [
  '10.0.0.4',       // Your current IP
  '192.168.66.17',  // Your previous IP
  '10.0.0.8',       // Your older IP
  '10.0.0.14',      // Your older IP
  'localhost',
  '127.0.0.1'
];

const BACKEND_PORT = 8080;

// Production backend URL - update this with your deployed backend URL
// For now, using a placeholder - you need to set this to your actual backend URL
const PRODUCTION_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || null;

/**
 * Get the backend URL with automatic IP detection and fallbacks
 */
export function getBackendUrl(): string {
  // First, try the environment variable (highest priority)
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim()) {
    console.log('🌐 Using environment backend URL:', envUrl);
    return envUrl.trim();
  }

  // For production builds (not in development), use production URL if available
  if (!__DEV__ && PRODUCTION_BACKEND_URL) {
    console.log('🌐 Using production backend URL:', PRODUCTION_BACKEND_URL);
    return PRODUCTION_BACKEND_URL;
  }

  // For development, try to detect the correct IP
  if (__DEV__) {
    // Try localhost first (most reliable for development)
    console.log('🌐 Using localhost backend URL for development');
    return `http://localhost:${BACKEND_PORT}`;
  }

  // Fallback to default (shouldn't happen in production if PRODUCTION_BACKEND_URL is set)
  console.warn('⚠️ No backend URL configured! Using localhost (will not work on physical devices)');
  return `http://localhost:${BACKEND_PORT}`;
}

/**
 * Get multiple backend URLs to try in order of preference
 */
export function getBackendUrls(): string[] {
  const urls: string[] = [];
  
  // Add environment URL if it exists
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl) {
    urls.push(envUrl);
  }
  
  // Add localhost (most reliable for development)
  urls.push(`http://localhost:${BACKEND_PORT}`);
  
  // Add common development IPs
  COMMON_DEV_IPS.forEach(ip => {
    if (ip !== 'localhost' && ip !== '127.0.0.1') {
      urls.push(`http://${ip}:${BACKEND_PORT}`);
    }
  });
  
  // Remove duplicates
  return [...new Set(urls)];
}

/**
 * Test if a backend URL is accessible
 */
export async function testBackendUrl(url: string, silent: boolean = false): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout (reduced from 3)
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (!silent) {
      console.log(`❌ Backend URL ${url} not accessible:`, error.message);
    }
    return false;
  }
}

/**
 * Find the first working backend URL
 */
export async function findWorkingBackendUrl(silent: boolean = false): Promise<string | null> {
  const urls = getBackendUrls();
  
  // If environment URL is set, test it first and only test others if it fails
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && urls[0] === envUrl) {
    if (!silent) {
      console.log('🔍 Testing environment backend URL first:', envUrl);
    }
    const isWorking = await testBackendUrl(envUrl, silent);
    if (isWorking) {
      if (!silent) {
        console.log(`✅ Environment backend URL is working: ${envUrl}`);
      }
      return envUrl;
    }
    if (!silent) {
      console.log('⚠️ Environment backend URL not accessible, testing alternatives...');
    }
  }
  
  if (!silent && urls.length > 1) {
    console.log(`🔍 Testing ${urls.length} backend URLs...`);
  }
  
  for (const url of urls) {
    // Skip if we already tested the env URL
    if (envUrl && url === envUrl && urls[0] === envUrl) {
      continue;
    }
    
    if (!silent) {
      console.log(`🔍 Testing: ${url}`);
    }
    const isWorking = await testBackendUrl(url, silent);
    if (isWorking) {
      if (!silent) {
        console.log(`✅ Found working backend: ${url}`);
      }
      return url;
    }
  }
  
  if (!silent) {
    console.log('❌ No working backend URLs found');
  }
  return null;
}

/**
 * Get the best backend URL with automatic detection
 */
export async function getBestBackendUrl(): Promise<string> {
  // Try to find a working URL
  const workingUrl = await findWorkingBackendUrl();
  
  if (workingUrl) {
    return workingUrl;
  }
  
  // Fallback to the first URL in the list
  const urls = getBackendUrls();
  console.log('⚠️ Using fallback URL:', urls[0]);
  return urls[0];
}

