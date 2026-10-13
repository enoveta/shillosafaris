import { defaultDestinations, defaultPages, defaultServices } from '../src/contentDefaults.js'

const types = new Set(['services', 'destinations'])
const contentType = (type) => type === 'services' ? 'service' : type === 'destinations' ? 'destination' : null
const clean = (value, limit = 4000) => typeof value === 'string' ? value.trim().slice(0, limit) : ''

function normalizeRecord(record) {
  const title = clean(record?.title, 120)
  const slug = clean(record?.slug, 120).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '')
  if (!title || !slug) throw new Error('A title and URL slug are required.')
  return { ...record, title, slug }
}

async function readContent(pool) {
  const result = await pool.query('SELECT type, slug, data FROM site_content ORDER BY type, created_at, slug')
  const content = { services: [], destinations: [], pages: {} }
  for (const row of result.rows) {
    if (row.type === 'service') content.services.push(row.data)
    if (row.type === 'destination') content.destinations.push(row.data)
    if (row.type === 'page') content.pages[row.slug] = row.data
  }
  return content
}

export async function initializeContent(pool) {
  await pool.query(`CREATE TABLE IF NOT EXISTS site_content (
    type TEXT NOT NULL CHECK (type IN ('service', 'destination', 'page')),
    slug TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (type, slug)
  )`)
  await pool.query(`CREATE TABLE IF NOT EXISTS page_visits (
    id BIGSERIAL PRIMARY KEY,
    path TEXT NOT NULL,
    visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`)

  for (const [type, items] of [['service', defaultServices], ['destination', defaultDestinations]]) {
    for (const item of items) {
      await pool.query('INSERT INTO site_content (type, slug, data) VALUES ($1, $2, $3) ON CONFLICT (type, slug) DO NOTHING', [type, item.slug, item])
    }
  }
  for (const [slug, page] of Object.entries(defaultPages)) {
    await pool.query('INSERT INTO site_content (type, slug, data) VALUES (\'page\', $1, $2) ON CONFLICT (type, slug) DO NOTHING', [slug, page])
  }
}

export function registerContentRoutes(app, pool, requireAdmin) {
  app.get('/api/site/content', async (_request, response) => {
    try {
      response.json(await readContent(pool))
    } catch (error) {
      console.error('Could not load site content:', error.message)
      response.status(500).json({ error: 'Could not load site content.' })
    }
  })

  app.post('/api/site/visit', async (request, response) => {
    const path = clean(request.body?.path, 200)
    if (!path.startsWith('/') || path.startsWith('/dashboard') || path.startsWith('/admin')) return response.status(204).end()
    try {
      await pool.query('INSERT INTO page_visits (path) VALUES ($1)', [path.split('?')[0]])
      response.status(204).end()
    } catch (error) {
      console.error('Could not record page visit:', error.message)
      response.status(500).json({ error: 'Could not record page visit.' })
    }
  })

  app.get('/api/admin/content', requireAdmin, async (_request, response) => {
    try {
      response.json(await readContent(pool))
    } catch (error) {
      console.error('Could not load editable content:', error.message)
      response.status(500).json({ error: 'Could not load editable content.' })
    }
  })

  app.post('/api/admin/content/:type', requireAdmin, async (request, response) => {
    const type = contentType(request.params.type)
    if (!type || !types.has(request.params.type)) return response.status(404).json({ error: 'Unknown content type.' })
    try {
      const item = normalizeRecord(request.body)
      await pool.query('INSERT INTO site_content (type, slug, data) VALUES ($1, $2, $3)', [type, item.slug, item])
      response.status(201).json({ item })
    } catch (error) {
      const duplicate = error.code === '23505'
      response.status(duplicate ? 409 : 400).json({ error: duplicate ? 'That URL slug is already in use.' : error.message })
    }
  })

  app.put('/api/admin/content/:type/:slug', requireAdmin, async (request, response) => {
    const type = contentType(request.params.type)
    if (!type || !types.has(request.params.type)) return response.status(404).json({ error: 'Unknown content type.' })
    try {
      const item = normalizeRecord(request.body)
      const result = await pool.query('UPDATE site_content SET slug = $3, data = $4, updated_at = NOW() WHERE type = $1 AND slug = $2 RETURNING data', [type, request.params.slug, item.slug, item])
      if (!result.rowCount) return response.status(404).json({ error: 'Content item not found.' })
      response.json({ item: result.rows[0].data })
    } catch (error) {
      const duplicate = error.code === '23505'
      response.status(duplicate ? 409 : 400).json({ error: duplicate ? 'That URL slug is already in use.' : error.message })
    }
  })

  app.delete('/api/admin/content/:type/:slug', requireAdmin, async (request, response) => {
    const type = contentType(request.params.type)
    if (!type || !types.has(request.params.type)) return response.status(404).json({ error: 'Unknown content type.' })
    try {
      const result = await pool.query('DELETE FROM site_content WHERE type = $1 AND slug = $2', [type, request.params.slug])
      if (!result.rowCount) return response.status(404).json({ error: 'Content item not found.' })
      response.status(204).end()
    } catch {
      response.status(500).json({ error: 'Could not delete content item.' })
    }
  })

  app.put('/api/admin/pages/:slug', requireAdmin, async (request, response) => {
    if (!['about', 'contact'].includes(request.params.slug) || !request.body || typeof request.body !== 'object') {
      return response.status(400).json({ error: 'Unknown page or invalid page content.' })
    }
    try {
      const result = await pool.query('UPDATE site_content SET data = $2, updated_at = NOW() WHERE type = \'page\' AND slug = $1 RETURNING data', [request.params.slug, request.body])
      if (!result.rowCount) return response.status(404).json({ error: 'Page content not found.' })
      response.json({ page: result.rows[0].data })
    } catch {
      response.status(500).json({ error: 'Could not update page content.' })
    }
  })

  app.get('/api/admin/analytics', requireAdmin, async (_request, response) => {
    try {
      const [totals, pages, days] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL \'24 hours\')::int AS today FROM page_visits WHERE visited_at >= NOW() - INTERVAL \'30 days\''),
        pool.query('SELECT path, COUNT(*)::int AS visits FROM page_visits WHERE visited_at >= NOW() - INTERVAL \'30 days\' GROUP BY path ORDER BY visits DESC, path LIMIT 20'),
        pool.query('SELECT TO_CHAR(DATE_TRUNC(\'day\', visited_at), \'YYYY-MM-DD\') AS day, COUNT(*)::int AS visits FROM page_visits WHERE visited_at >= NOW() - INTERVAL \'7 days\' GROUP BY DATE_TRUNC(\'day\', visited_at) ORDER BY DATE_TRUNC(\'day\', visited_at)'),
      ])
      response.json({ total: totals.rows[0].total, today: totals.rows[0].today, pages: pages.rows, days: days.rows })
    } catch (error) {
      console.error('Could not load visit analytics:', error.message)
      response.status(500).json({ error: 'Could not load visit analytics.' })
    }
  })
}