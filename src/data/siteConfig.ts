export const siteConfig = {
  name: 'ТехБлог',
  description: 'Блог о технологиях, искусственном интеллекте и программировании',
  url: 'https://texblog.ru/',
  author: 'Админ',
  lang: 'ru',
  social: {
    twitter: '@techblog',
    github: 'amatiadellink',
    telegram: 'Nanobaanana_bot'
  },
  postsPerPage: 12,
  // Yandex Metrica counter ID - replace with your actual ID
  yandexMetricaId: 'YOUR_METRICA_ID'
};

export type SiteConfig = typeof siteConfig;
