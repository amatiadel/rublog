import bcrypt from 'bcryptjs';

// Хеширование пароля (используйте для генерации хеша)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Проверка пароля
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Генерация CSRF токена
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Проверка CSRF токена
export function verifyCsrfToken(token: string | null, sessionToken: string | null): boolean {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
}

// Конфигурация сессии
export const SESSION_CONFIG = {
  maxAge: 60 * 60 * 8, // 8 часов (вместо 24)
  cookieName: 'admin_session',
  csrfCookieName: 'csrf_token'
};
