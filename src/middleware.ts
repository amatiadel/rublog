import { defineMiddleware } from 'astro:middleware';
import { SESSION_CONFIG } from '@/utils/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
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
  
  return next();
});
