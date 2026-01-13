import type { APIRoute } from 'astro';
import { siteConfig } from '@/data/siteConfig';

// IndexNow API for faster Bing/Yandex indexing
// Generate your key at: https://www.indexnow.org/
// Then create a file: public/[YOUR_KEY].txt containing just the key

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'YOUR_INDEXNOW_KEY';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { urls } = await request.json();
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: 'No URLs provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const host = new URL(siteConfig.url).host;
    
    // Submit to IndexNow (works for Bing, Yandex, and other participating search engines)
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${siteConfig.url}/${INDEXNOW_KEY}.txt`,
        urlList: urls.map(url => url.startsWith('http') ? url : `${siteConfig.url}${url}`)
      })
    });

    return new Response(JSON.stringify({ 
      success: response.ok,
      status: response.status,
      message: response.ok ? 'URLs submitted to IndexNow' : 'Failed to submit'
    }), {
      status: response.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
