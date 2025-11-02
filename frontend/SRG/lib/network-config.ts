import { Platform } from 'react-native';

/**
 * Network configuration helper that automatically detects the correct backend URL
 * and provides fallbacks to prevent Axios network errors
 */

// Common development IP ranges to try
const COMMON_DEV_IPS = [
  '192.168.66.17',  // Your current IP
  '10.0.0.8',       // Your previous IP
  '10.0.0.14',      // Your older IP
  '192.168.1.1',
  '192.168.0.1',
  '172.16.0.1',
  'localhost',
  '127.0.0.1'
];

const BACKEND_PORT = 8080;

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

  // For development, try to detect the correct IP
  if (__DEV__) {
    // Try localhost first (most reliable for development)
    console.log('🌐 Using localhost backend URL for development');
    return `http://localhost:${BACKEND_PORT}`;
  }

  // Fallback to default
  console.log('🌐 Using default backend URL');
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
export async function testBackendUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`❌ Backend URL ${url} not accessible:`, error.message);
    return false;
  }
}

/**
 * Find the first working backend URL
 */
export async function findWorkingBackendUrl(): Promise<string | null> {
  const urls = getBackendUrls();
  
  console.log('🔍 Testing backend URLs:', urls);
  
  for (const url of urls) {
    console.log(`🔍 Testing: ${url}`);
    const isWorking = await testBackendUrl(url);
    if (isWorking) {
      console.log(`✅ Found working backend: ${url}`);
      return url;
    }
  }
  
  console.log('❌ No working backend URLs found');
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

