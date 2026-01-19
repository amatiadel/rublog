# ТехБлог - Задачи для завершения проекта

## ✅ Завершено (Январь 2026)

### Безопасность
- [x] Создать `.env` файл для хранения секретов
- [x] Перенести пароль админа в переменные окружения
- [x] Добавить хеширование пароля (bcrypt)
- [x] Добавить срок действия сессии админа
- [x] Добавить CSRF защиту для форм
- [x] Создать `.gitignore` файл

### SEO & Базовая оптимизация
- [x] Добавить JSON-LD структурированные данные для статей
- [x] Добавить поле `updatedDate` в схему контента
- [x] Добавить поле `draft` для черновиков
- [x] Добавить поле `featured` для избранных постов
- [x] Добавить canonical URL на все страницы
- [x] Заменить `https://example.com` на реальный домен в конфиге

### Accessibility
- [x] Исправить ARIA атрибуты в ThemeToggle (aria-checked вместо aria-pressed)
- [x] Добавить skip-to-content ссылку для доступности
- [x] Добавить aria-labels на интерактивные элементы

### Оптимизация изображений
- [x] Конвертировать все изображения в WebP формат (85% экономии: 18.76 MB → 2.77 MB)
- [x] Обновить ссылки на изображения в блог-постах
- [x] Создать скрипт автоматической оптимизации (`npm run optimize:images`)
- [x] Добавить конфигурацию изображений в astro.config.mjs

---

## � Критические задачи (Performance - Score: 82)

### Priority 1: Исправить LCP (3.9s → <2.5s)
- [ ] **Добавить lazy loading для изображений в markdown**
  - Файлы: `src/pages/blog/[...slug].astro`
  - Добавить `loading="lazy"` для всех изображений ниже fold
  - Оставить `loading="eager"` только для hero-изображения

- [ ] **Preload критических ресурсов**
  - Добавить `<link rel="preload">` для LCP изображения
  - Preload критических шрифтов (если используются)
  - Файл: `src/layouts/BaseLayout.astro` или `src/components/SEO.astro`

- [ ] **Реализовать responsive images**
  - Использовать Astro Image component вместо обычных `<img>`
  - Генерировать srcset для разных размеров экрана
  - Файлы: все компоненты с изображениями

### Priority 2: Устранить render-blocking (экономия 1.15s)
- [ ] **Defer non-critical JavaScript**
  - Переместить Yandex Metrica в конец body с `defer`
  - Проверить все `<script>` теги на необходимость
  - Файл: `src/components/YandexMetrica.astro`

- [ ] **Inline critical CSS**
  - Выделить критический CSS для above-the-fold контента
  - Остальной CSS загружать асинхронно
  - Рассмотреть использование `astro-critters`

### Priority 3: Оптимизация доставки изображений (экономия 138 KiB)
- [ ] **Дополнительная компрессия WebP**
  - Снизить quality с 80% до 75% для non-hero изображений
  - Обновить `scripts/optimize-images.mjs`

- [ ] **Добавить responsive image sizes**
  - Генерировать 3-4 размера для каждого изображения
  - Использовать `sizes` attribute для правильного выбора

---

## 🟠 Важные задачи (Best Practices - Score: 96)

### Исправить ошибки консоли
- [ ] **Найти и исправить 404 ошибку скрипта**
  - Ошибка: `...insights/script.js-10` (404 Not Found)
  - Проверить все `<script>` теги в layouts
  - Удалить или исправить сломанную ссылку
  - Файлы для проверки: `src/layouts/*.astro`, `src/components/SEO.astro`

### Безопасность
- [ ] **Добавить Content Security Policy (CSP)**
  - Настроить CSP headers в `vercel.json` или middleware
  - Защита от XSS атак

- [ ] **Настроить HSTS policy**
  - Добавить Strict-Transport-Security header
  - Файл: `vercel.json` или `astro.config.mjs`

---

## 🟡 Средний приоритет (UX & Features)

### Производительность
- [ ] **Настроить HTTP/2 Server Push**
  - Если хостинг поддерживает
  - Push критических ресурсов

- [ ] **Добавить Service Worker для PWA**
  - Offline support
  - Кэширование для повторных визитов
  - Использовать `@astrojs/pwa` или `workbox`

- [ ] **Code splitting**
  - Разбить большие JS бандлы
  - Динамический импорт для тяжелых компонентов

### Мониторинг
- [ ] Заменить `YOUR_METRICA_ID` на реальный ID Яндекс.Метрики
- [ ] Добавить Google Analytics (опционально)
- [ ] Настроить Real User Monitoring (RUM)

---

## 🟢 Низкий приоритет (Nice to have)

### Долгосрочные улучшения
- [ ] **CDN для изображений**
  - Cloudflare Images или аналог
  - Serve from edge locations

- [ ] **Advanced caching strategies**
  - Stale-while-revalidate patterns
  - Cache-Control headers оптимизация

- [ ] **Database optimization**
  - Если добавятся динамические features
  - Индексы, query optimization

### Контент
- [ ] Написать больше статей (минимум 10 для запуска)
- [ ] Добавить изображения для всех постов
- [ ] Заполнить мета-описания для всех страниц

---

## 📊 Текущие метрики Lighthouse

- **Performance**: 82/100 (Target: 90+)
  - FCP: 2.6s (Target: <1.8s)
  - LCP: 3.9s (Target: <2.5s) ⚠️
  - TBT: 0ms ✅
  - CLS: 0 ✅
  - SI: 4.4s (Target: <3.4s)

- **Accessibility**: 100/100 ✅
- **Best Practices**: 96/100 (Target: 100)
- **SEO**: 100/100 ✅

---

## 🎯 Roadmap

### Фаза 1: Quick Wins (1-2 дня)
1. Исправить 404 ошибку скрипта
2. Добавить lazy loading для изображений
3. Preload LCP изображения
4. Defer Yandex Metrica

**Ожидаемый результат**: Performance 82 → 88-90

### Фаза 2: Image Optimization (2-3 дня)
1. Внедрить Astro Image component
2. Генерировать responsive images
3. Дополнительная компрессия WebP

**Ожидаемый результат**: Performance 88-90 → 92-95

### Фаза 3: Advanced (1 неделя)
1. Service Worker / PWA
2. Critical CSS inlining
3. Code splitting
4. CSP & HSTS

**Ожидаемый результат**: Performance 92-95 → 95-98

---

## Прогресс: 35/60 задач выполнено (58%)
