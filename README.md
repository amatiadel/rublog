# ТехБлог

Высокопроизводительный, SEO-оптимизированный технический блог на русском языке, построенный на Astro.

## 🚀 Возможности

- **Zero JS по умолчанию** — Astro Islands для максимальной производительности
- **Content Collections** — удобное управление контентом
- **Полная SEO-оптимизация** — OpenGraph, Twitter Cards, canonical URLs, JSON-LD
- **RSS-лента и sitemap** — автоматическая генерация
- **Фильтрация по тегам** — удобная навигация по контенту
- **Тёмная тема** — автоматическое переключение
- **Mobile-first дизайн** — адаптивная вёрстка
- **Админ-панель** — управление постами через веб-интерфейс
- **Поиск** — быстрый поиск по статьям

## 📋 Требования

- Node.js 18+
- npm или pnpm

## 🛠️ Установка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd astro-blog

# Установить зависимости
npm install

# Создать файл окружения
cp .env.example .env

# Настроить переменные в .env
```

## ⚙️ Конфигурация

Создайте файл `.env` на основе `.env.example` и заполните переменные:

```env
ADMIN_PASSWORD_HASH=<bcrypt-хеш-пароля>
SESSION_SECRET=<секретный-ключ-сессии>
INDEXNOW_KEY=<ключ-indexnow>
```

## 🧞 Команды

| Команда           | Описание                              |
| :---------------- | :------------------------------------ |
| `npm run dev`     | Запуск dev-сервера на `localhost:4321`|
| `npm run build`   | Сборка для продакшена в `./dist/`     |
| `npm run preview` | Предпросмотр продакшен-сборки         |

## 📁 Структура проекта

```
├── src/
│   ├── components/     # UI компоненты
│   ├── content/
│   │   └── blog/       # Markdown статьи
│   ├── data/           # Конфигурация сайта
│   ├── layouts/        # Шаблоны страниц
│   ├── pages/          # Страницы и API
│   └── utils/          # Утилиты
├── public/             # Статические файлы
├── astro.config.mjs    # Конфигурация Astro
└── tailwind.config.mjs # Конфигурация Tailwind
```

## 📝 Добавление статей

Создайте файл в `src/content/blog/` с frontmatter:

```markdown
---
title: "Заголовок статьи"
description: "Описание для SEO"
pubDate: 2025-01-13
tags: ["tag1", "tag2"]
image: "/uploads/image.jpg"
draft: false
featured: false
---

Содержимое статьи...
```

## 🔐 Админ-панель

Доступна по адресу `/admin`. Для входа используйте пароль, хеш которого указан в `ADMIN_PASSWORD_HASH`.

## 📡 API Эндпоинты

| Эндпоинт                | Метод  | Описание                    |
| :---------------------- | :----- | :-------------------------- |
| `/api/posts/[slug]`     | GET    | Получить пост по slug       |
| `/api/posts/[slug]`     | PUT    | Обновить пост               |
| `/api/indexnow`         | POST   | Уведомить поисковики        |
| `/rss.xml`              | GET    | RSS-лента                   |
| `/sitemap-index.xml`    | GET    | Sitemap                     |
| `/turbo.xml`            | GET    | Turbo-страницы для Яндекса  |

## 🚀 Деплой

### Vercel

```bash
npm i -g vercel
vercel
```

### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
```

### VPS (PM2)

```bash
npm run build
pm2 start ./dist/server/entry.mjs --name techblog
```

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)
