export const config = { runtime: 'edge' }

export default async function handler(req) {
  const { pathname, searchParams } = new URL(req.url)
  const tmdbId   = pathname.split('/').filter(Boolean)[1]
  const type     = searchParams.get('type') || 'movie'
  const KEY      = process.env.TMDB_API_KEY
  const endpoint = type === 'tv' ? 'tv' : 'movie'
  const APP_STORE = 'https://apps.apple.com/app/id6767443984'

  let title = 'ReelFeel', description = 'Track what you watch.', image = ''

  try {
    const r = await fetch(`https://api.themoviedb.org/3/${endpoint}/${tmdbId}?api_key=${KEY}`)
    const d = await r.json()
    const t    = d.title ?? d.name ?? 'ReelFeel'
    const year = (d.release_date ?? d.first_air_date ?? '').slice(0, 4)
    title       = `${t}${year ? ` (${year})` : ''}`
    description = d.overview?.slice(0, 300) ?? 'Track what you watch on ReelFeel.'
    image       = d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : ''
  } catch (_) {}

  const pageUrl = req.url

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${x(title)} — ReelFeel</title>
  <meta property="og:title"       content="${x(title)}" />
  <meta property="og:description" content="${x(description)}" />
  <meta property="og:image"       content="${x(image)}" />
  <meta property="og:url"         content="${x(pageUrl)}" />
  <meta property="og:type"        content="website" />
  <meta property="og:site_name"   content="ReelFeel" />
  <meta name="twitter:card"        content="summary_large_image" />
  <meta name="twitter:title"       content="${x(title)}" />
  <meta name="twitter:description" content="${x(description)}" />
  <meta name="twitter:image"       content="${x(image)}" />
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#000;color:#fff;font-family:system-ui,-apple-system,sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}
    .poster{width:140px;height:210px;object-fit:cover;border-radius:6px;border:2px solid #2a2a2a;box-shadow:0 20px 60px rgba(0,0,0,.8);margin-bottom:20px}
    .poster-placeholder{width:140px;height:210px;background:#1c1c1e;border-radius:6px;border:2px solid #2a2a2a;margin-bottom:20px}
    h1{font-size:22px;font-weight:900;text-align:center;line-height:1.2;margin-bottom:8px}
    .desc{color:#a3a3a3;font-size:13px;line-height:1.6;text-align:center;max-width:320px;margin-bottom:28px}
    .cta{display:inline-block;background:#d4af37;color:#000;font-weight:900;font-size:11px;letter-spacing:.15em;text-transform:uppercase;padding:12px 28px;border-radius:6px;text-decoration:none;margin-bottom:12px}
    .cta:hover{background:#f0c842}
    .brand{font-size:11px;color:#6b6b6b;letter-spacing:.2em;text-transform:uppercase;margin-bottom:24px}
  </style>
</head>
<body>
  <p class="brand">ReelFeel</p>
  ${image ? `<img src="${x(image)}" class="poster" alt="${x(title)}" />` : '<div class="poster-placeholder"></div>'}
  <h1>${x(title)}</h1>
  <p class="desc">${x(description)}</p>
  <a href="${APP_STORE}" class="cta">Get the app</a>
</body>
</html>`

  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

function x(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
