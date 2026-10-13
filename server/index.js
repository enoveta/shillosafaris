import 'dotenv/config'
import express from 'express'
import pg from 'pg'
import jwt from 'jsonwebtoken'
import { timingSafeEqual } from 'node:crypto'
import { initializeContent, registerContentRoutes } from './content.js'

const { Pool } = pg
const app = express()
const port = Number(process.env.PORT || 3001)
const pool = process.env.DATABASE_URL ? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : undefined,
}) : null

app.use(express.json({ limit: '32kb' }))

const requireDatabase = (_request, response, next) => {
  if (!pool) return response.status(503).json({ error: 'The inquiry database is not configured yet.' })
  next()
}

const requireAdmin = (request, response, next) => {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token || !process.env.JWT_SECRET) return response.status(401).json({ error: 'Admin sign-in required.' })
  try {
    request.admin = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    response.status(401).json({ error: 'Your admin session has expired. Please sign in again.' })
  }
}

const clean = (value, limit = 3000) => typeof value === 'string' ? value.trim().slice(0, limit) : ''

app.get('/api/health', (_request, response) => response.json({ ok: true, databaseConfigured: Boolean(pool) }))

app.post('/api/admin/login', (request, response) => {
  const configuredPassword = process.env.ADMIN_PASSWORD
  const configuredSecret = process.env.JWT_SECRET
  const submittedPassword = clean(request.body?.password, 200)
  if (!configuredPassword || !configuredSecret) return response.status(503).json({ error: 'Admin credentials are not configured on the server.' })
  const submitted = Buffer.from(submittedPassword)
  const expected = Buffer.from(configuredPassword)
  if (submitted.length !== expected.length || !timingSafeEqual(submitted, expected)) {
    return response.status(401).json({ error: 'That password did not match.' })
  }
  response.json({ token: jwt.sign({ role: 'admin' }, configuredSecret, { expiresIn: '8h' }) })
})

registerContentRoutes(app, pool, requireAdmin)

app.post('/api/inquiries', requireDatabase, async (request, response) => {
  const name = clean(request.body?.name, 120)
  const email = clean(request.body?.email, 254)
  const message = clean(request.body?.message)
  const travelDate = clean(request.body?.travelDate, 10) || null
  if (!name || !email || !message || !/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ error: 'Please provide your name, a valid email, and a short message.' })
  }
  if (travelDate && !/^\d{4}-\d{2}-\d{2}$/.test(travelDate)) {
    return response.status(400).json({ error: 'Please enter a valid travel date.' })
  }
  try {
    const result = await pool.query(
      `INSERT INTO inquiries (name, email, phone, interest, travel_date, travelers, message)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, created_at`,
      [name, email, clean(request.body?.phone, 60), clean(request.body?.interest, 120), travelDate, Math.max(1, Math.min(50, Number(request.body?.travelers) || 1)), message],
    )
    response.status(201).json({ inquiry: result.rows[0] })
  } catch (error) {
    console.error('Could not save inquiry:', error.message)
    response.status(500).json({ error: 'We could not save your enquiry. Please try again shortly.' })
  }
})

app.get('/api/inquiries', requireAdmin, requireDatabase, async (_request, response) => {
  try {
    const result = await pool.query('SELECT * FROM inquiries ORDER BY created_at DESC')
    response.json({ inquiries: result.rows })
  } catch (error) {
    console.error('Could not load inquiries:', error.message)
    response.status(500).json({ error: 'Could not load enquiries.' })
  }
})

app.patch('/api/inquiries/:id', requireAdmin, requireDatabase, async (request, response) => {
  const status = clean(request.body?.status, 20)
  if (!['new', 'contacted', 'closed'].includes(status)) return response.status(400).json({ error: 'Choose a valid enquiry status.' })
  try {
    const result = await pool.query('UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING *', [status, request.params.id])
    if (!result.rowCount) return response.status(404).json({ error: 'Enquiry not found.' })
    response.json({ inquiry: result.rows[0] })
  } catch (error) {
    console.error('Could not update inquiry:', error.message)
    response.status(500).json({ error: 'Could not update enquiry.' })
  }
})

async function start() {
  if (pool) {
    await pool.query(`CREATE TABLE IF NOT EXISTS inquiries (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      interest TEXT NOT NULL DEFAULT '',
      travel_date DATE,
      travelers INTEGER NOT NULL DEFAULT 1,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`)
    await initializeContent(pool)
    console.log('PostgreSQL connected; inquiry table is ready.')
  } else {
    console.warn('DATABASE_URL is not set. The website runs, but inquiry storage is disabled.')
  }
  app.listen(port, () => console.log(`Shilo API listening on http://localhost:${port}`))
}

start().catch((error) => {
  console.error('Could not start the API:', error.message)
  process.exit(1)
})
