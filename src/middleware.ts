import { defineMiddleware } from 'astro:middleware';
import { SESSION_CONFIG } from '@/utils/auth';

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://mc.yandex.ru",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://mc.yandex.ru",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

// Rate limiting configuration
const RATE_LIMIT = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  api: { maxAttempts: 30, windowMs: 60 * 1000 }        // 30 requests per minute
};

// In-memory rate limit store (use Redis in production for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

function checkRateLimit(key: string, config: { maxAttempts: number; windowMs: number }): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetTime) rateLimitStore.delete(k);
    }
  }
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true, remaining: config.maxAttempts - 1, resetIn: config.windowMs };
  }
  
  if (record.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: config.maxAttempts - record.count, resetIn: record.resetTime - now };
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const clientIP = getClientIP(context.request);
  
  // Rate limit login attempts
  if (pathname === '/admin/login' && context.request.method === 'POST') {
    const rateKey = `login:${clientIP}`;
    const { allowed, remaining, resetIn } = checkRateLimit(rateKey, RATE_LIMIT.login);
    
    if (!allowed) {
      return new Response(`Слишком много попыток входа. Попробуйте через ${Math.ceil(resetIn / 60000)} мин.`, {
        status: 429,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Retry-After': String(Math.ceil(resetIn / 1000)),
          'X-RateLimit-Remaining': '0'
        }
      });
    }
  }
  
  // Rate limit API endpoints
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(context.request.method)) {
    const rateKey = `api:${clientIP}`;
    const { allowed, remaining, resetIn } = checkRateLimit(rateKey, RATE_LIMIT.api);
    
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Превышен лимит запросов', retryAfter: Math.ceil(resetIn / 1000) }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(Math.ceil(resetIn / 1000)),
          'X-RateLimit-Remaining': '0'
        }
      });
    }
  }
  
  // Проверяем только админ-страницы (кроме login и logout)
  if (pathname.startsWith('/admin') && !pathname.includes('/login') && !pathname.includes('/logout')) {
    const sessionCookie = context.cookies.get(SESSION_CONFIG.cookieName);
    
    if (!sessionCookie?.value || !sessionCookie.value.startsWith('authenticated:')) {
      return context.redirect('/admin/login');
    }
    
    // Проверяем срок действия сессии
    const [, timestamp] = sessionCookie.value.split(':');
    const sessionTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    if (now - sessionTime > SESSION_CONFIG.maxAge * 1000) {
      // Сессия истекла
      context.cookies.delete(SESSION_CONFIG.cookieName, { path: '/' });
      return context.redirect('/admin/login');
    }
  }
  
  // Проверяем CSRF для POST/PUT/DELETE запросов к API
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'DELETE'].includes(context.request.method)) {
    // Для API проверяем наличие сессии админа
    const sessionCookie = context.cookies.get(SESSION_CONFIG.cookieName);
    
    if (!sessionCookie?.value || !sessionCookie.value.startsWith('authenticated:')) {
      return new Response(JSON.stringify({ error: 'Не авторизован' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Проверяем срок действия
    const [, timestamp] = sessionCookie.value.split(':');
    const sessionTime = parseInt(timestamp, 10);
    const now = Date.now();
    
    if (now - sessionTime > SESSION_CONFIG.maxAge * 1000) {
      context.cookies.delete(SESSION_CONFIG.cookieName, { path: '/' });
      return new Response(JSON.stringify({ error: 'Сессия истекла' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  
  const response = await next();
  
  // Add security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Add HSTS header in production
  if (import.meta.env.PROD) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  return response;
});
