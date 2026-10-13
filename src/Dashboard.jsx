import { useEffect, useState } from 'react'
import { ArrowUpRight, BarChart3, Compass, FileText, Globe2, LogOut, MapPin, Plus, Save, Trash2, UsersRound } from 'lucide-react'
import { defaultDestinations, defaultPages, defaultServices } from './contentDefaults.js'
import './dashboard.css'

const initialContent = { services: defaultServices, destinations: defaultDestinations, pages: defaultPages }
const labels = { overview: 'Overview', analytics: 'Analytics', services: 'Services', destinations: 'Destinations', pages: 'Pages', inquiries: 'Enquiries' }
const editableFields = {
  services: ['title', 'slug', 'intro', 'body', 'image', 'icon'],
  destinations: ['title', 'slug', 'eyebrow', 'intro', 'body', 'image', 'position'],
}
const titleCase = (value) => value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

function authOptions(token, method = 'GET', body) {
  return { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }
}

export default function Dashboard() {
  const [token, setToken] = useState(() => sessionStorage.getItem('shilo-admin-token') || '')
  const [password, setPassword] = useState('')
  const [section, setSection] = useState('overview')
  const [pageKey, setPageKey] = useState('about')
  const [content, setContent] = useState(initialContent)
  const [analytics, setAnalytics] = useState({ total: 0, today: 0, pages: [], days: [], serviceCount: defaultServices.length, destinationCount: defaultDestinations.length })
  const [inquiries, setInquiries] = useState([])
  const [selectedSlug, setSelectedSlug] = useState('')
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    let active = true
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch('/api/admin/content', { headers }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data }),
      fetch('/api/admin/analytics', { headers }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data }),
      fetch('/api/inquiries', { headers }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data }),
    ]).then(([nextContent, nextAnalytics, nextInquiries]) => {
      if (!active) return
      setContent(nextContent)
      setAnalytics({ ...nextAnalytics, serviceCount: nextContent.services.length, destinationCount: nextContent.destinations.length })
      setInquiries(nextInquiries.inquiries)
    }).catch((loadError) => {
      if (!active) return
      setError(loadError.message || 'Could not load dashboard data.')
      sessionStorage.removeItem('shilo-admin-token')
      setToken('')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const login = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Sign-in failed.')
      sessionStorage.setItem('shilo-admin-token', data.token)
      setLoading(true)
      setToken(data.token)
      setPassword('')
    } catch (loginError) { setError(loginError.message) }
  }

  const logout = () => {
    sessionStorage.removeItem('shilo-admin-token')
    setToken('')
    setEditing(null)
    setError('')
  }

  const collection = section === 'services' ? content.services : content.destinations
  const beginNew = () => {
    const fresh = section === 'services'
      ? { title: '', slug: '', intro: '', body: '', image: '', icon: 'Compass' }
      : { title: '', slug: '', eyebrow: '', intro: '', body: '', image: '', position: '' }
    setSelectedSlug('')
    setEditing(fresh)
    setMessage('')
  }

  const saveItem = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    const type = section
    const body = { ...editing, slug: editing.slug || slugify(editing.title) }
    const isNew = !selectedSlug
    try {
      const response = await fetch(isNew ? `/api/admin/content/${type}` : `/api/admin/content/${type}/${encodeURIComponent(selectedSlug)}`, authOptions(token, isNew ? 'POST' : 'PUT', body))
      const data = response.status === 204 ? {} : await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save this item.')
      setContent((current) => ({ ...current, [type]: isNew ? [...current[type], data.item] : current[type].map((item) => item.slug === selectedSlug ? data.item : item) }))
      if (isNew) setAnalytics((current) => ({ ...current, [type === 'services' ? 'serviceCount' : 'destinationCount']: current[type === 'services' ? 'serviceCount' : 'destinationCount'] + 1 }))
      setSelectedSlug(data.item.slug)
      setEditing(data.item)
      setMessage(isNew ? 'Item added to the website.' : 'Changes saved to the website.')
    } catch (saveError) { setError(saveError.message) }
    finally { setBusy(false) }
  }

  const deleteItem = async (item) => {
    if (!window.confirm(`Remove “${item.title}” from the website?`)) return
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/admin/content/${section}/${encodeURIComponent(item.slug)}`, authOptions(token, 'DELETE'))
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || 'Could not remove this item.') }
      setContent((current) => ({ ...current, [section]: current[section].filter((entry) => entry.slug !== item.slug) }))
      setAnalytics((current) => ({ ...current, [section === 'services' ? 'serviceCount' : 'destinationCount']: current[section === 'services' ? 'serviceCount' : 'destinationCount'] - 1 }))
      setEditing(null)
      setSelectedSlug('')
      setMessage('Item removed from the website.')
    } catch (deleteError) { setError(deleteError.message) }
    finally { setBusy(false) }
  }

  const savePage = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/admin/pages/${pageKey}`, authOptions(token, 'PUT', content.pages[pageKey]))
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not save page copy.')
      setContent((current) => ({ ...current, pages: { ...current.pages, [pageKey]: data.page } }))
      setMessage('Page copy saved to the website.')
    } catch (saveError) { setError(saveError.message) }
    finally { setBusy(false) }
  }

  if (!token) return <main className="dashboard-login"><a className="dashboard-back" href="/">← Back to website</a><form className="dashboard-login-form" onSubmit={login}><img src="/shilo-emblem.png" alt="" /><span>SHILO SAFARIS &amp; TOURS</span><h1>Dashboard sign in</h1><p>Manage website content and enquiries.</p><label>Admin password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label><button className="dashboard-primary" type="submit">Sign in <ArrowUpRight size={16} /></button>{error && <p className="dashboard-error" role="alert">{error}</p>}</form></main>

  return <main className="dashboard-app">
    <aside className="dashboard-sidebar"><a className="dashboard-brand" href="/" aria-label="Shilo Safaris website"><img src="/shilo-emblem.png" alt="" /><span><strong>SHILO</strong><small>CONTENT STUDIO</small></span></a><span className="dashboard-nav-label">WORKSPACE</span><nav aria-label="Dashboard sections">{Object.entries(labels).map(([key, label]) => <button key={key} className={section === key ? 'is-active' : ''} onClick={() => { setSection(key); setEditing(null); setError(''); setMessage('') }}>{key === 'overview' || key === 'analytics' ? <BarChart3 size={17} /> : key === 'services' ? <Compass size={17} /> : key === 'destinations' ? <MapPin size={17} /> : key === 'pages' ? <FileText size={17} /> : key === 'inquiries' ? <UsersRound size={17} /> : null}{label}</button>)}</nav><a className="dashboard-site-link" href="/" target="_blank" rel="noreferrer"><Globe2 size={16} /> View website <ArrowUpRight size={14} /></a></aside>
    <section className="dashboard-main"><header className="dashboard-topbar"><div><span>SHILO SAFARIS &amp; TOURS</span><h1>{labels[section]}</h1></div><button className="dashboard-logout" onClick={logout}><LogOut size={16} /> Sign out</button></header>
      {error && <p className="dashboard-error" role="alert">{error}</p>}{message && <p className="dashboard-success" role="status">{message}</p>}
      {loading ? <p className="dashboard-loading">Loading dashboard…</p> : section === 'overview' ? <Overview analytics={analytics} inquiries={inquiries} onOpen={setSection} /> : ['services', 'destinations'].includes(section) ? <section className="cms-layout"><div className="cms-list"><div className="cms-list-heading"><div><span>{collection.length} published</span><h2>{labels[section]}</h2></div><button className="dashboard-primary compact" onClick={beginNew}><Plus size={16} /> Add new</button></div>{collection.length === 0 && <p className="dashboard-empty">Nothing here yet. Add the first item.</p>}{collection.map((item) => <div className={`cms-list-item ${selectedSlug === item.slug ? 'selected' : ''}`} key={item.slug}><button className="cms-select" onClick={() => { setEditing({ ...item }); setSelectedSlug(item.slug); setMessage('') }}><strong>{item.title}</strong><span>/{section}/{item.slug}</span></button><button className="cms-delete" aria-label={`Remove ${item.title}`} onClick={() => deleteItem(item)} disabled={busy}><Trash2 size={16} /></button></div>)}</div>{editing ? <form className="cms-editor" onSubmit={saveItem}><div className="cms-editor-heading"><div><span>{selectedSlug ? 'EDIT PUBLISHED ITEM' : 'NEW WEBSITE ITEM'}</span><h2>{selectedSlug ? editing.title : `New ${section === 'services' ? 'service' : 'destination'}`}</h2></div>{selectedSlug && <button type="button" className="cms-delete editor-delete" onClick={() => deleteItem(editing)} disabled={busy} aria-label={`Remove ${editing.title}`}><Trash2 size={17} /></button>}</div><div className="cms-fields">{editableFields[section].map((field) => <label className={['body', 'intro'].includes(field) ? 'wide' : ''} key={field}>{titleCase(field)}{field === 'icon' && section === 'services' ? <select value={editing[field] || 'Compass'} onChange={(event) => setEditing({ ...editing, [field]: event.target.value })}>{['Compass', 'Binoculars', 'Sparkles', 'Plane', 'BadgeCheck', 'CalendarDays', 'UsersRound', 'Ship', 'Leaf', 'Coffee'].map((icon) => <option key={icon}>{icon}</option>)}</select> : ['body', 'intro'].includes(field) ? <textarea rows={field === 'body' ? 5 : 3} value={editing[field] || ''} onChange={(event) => setEditing({ ...editing, [field]: event.target.value })} required={['title', 'slug', 'intro', 'body'].includes(field)} /> : <input value={editing[field] || ''} onChange={(event) => setEditing({ ...editing, [field]: event.target.value })} required={['title', 'slug', 'image'].includes(field)} />}</label>)}</div><button className="dashboard-primary" type="submit" disabled={busy}><Save size={16} /> {busy ? 'Saving…' : 'Save changes'}</button></form> : <div className="cms-editor cms-editor-empty"><Compass size={24} /><p>Select an item to edit, or add a new one.</p></div>}</section> : section === 'pages' ? <form className="page-editor" onSubmit={savePage}><div className="page-switcher" role="tablist" aria-label="Choose page to edit">{['about', 'contact'].map((page) => <button type="button" role="tab" aria-selected={pageKey === page} key={page} onClick={() => { setPageKey(page); setMessage(''); setError('') }}>{page}</button>)}</div><div className="page-fields">{Object.entries(content.pages[pageKey] || {}).map(([key, value]) => <label key={key} className={/body|lead|paragraph|description/i.test(key) ? 'wide' : ''}>{titleCase(key)}{/body|lead|paragraph|description/i.test(key) ? <textarea rows={key === 'lead' ? 4 : 3} value={value} onChange={(event) => setContent((current) => ({ ...current, pages: { ...current.pages, [pageKey]: { ...current.pages[pageKey], [key]: event.target.value } } }))} /> : <input value={value} onChange={(event) => setContent((current) => ({ ...current, pages: { ...current.pages, [pageKey]: { ...current.pages[pageKey], [key]: event.target.value } } }))} />}</label>)}</div><button className="dashboard-primary" type="submit" disabled={busy}><Save size={16} /> {busy ? 'Saving…' : 'Save page copy'}</button></form> : section === 'inquiries' ? <InquiryList inquiries={inquiries} /> : <Analytics analytics={analytics} />}
    </section>
  </main>
}

function Overview({ analytics, inquiries, onOpen }) {
  return <section className="dashboard-overview"><div className="dashboard-metrics"><button onClick={() => onOpen('services')}><span>LIVE SERVICES</span><strong>{analytics.serviceCount}</strong><small>Manage the service catalog <ArrowUpRight size={14} /></small></button><button onClick={() => onOpen('destinations')}><span>DESTINATIONS</span><strong>{analytics.destinationCount}</strong><small>Manage destinations <ArrowUpRight size={14} /></small></button><button onClick={() => onOpen('inquiries')}><span>NEW ENQUIRIES</span><strong>{inquiries.filter((item) => item.status === 'new').length}</strong><small>{inquiries.length} total enquiries <ArrowUpRight size={14} /></small></button><button onClick={() => onOpen('analytics')}><span>VISITS TODAY</span><strong>{analytics.today}</strong><small>{analytics.total} in the last 30 days <ArrowUpRight size={14} /></small></button></div><Analytics analytics={analytics} compact /><div className="dashboard-quick-links"><button onClick={() => onOpen('pages')}>Edit About &amp; Contact <ArrowUpRight size={15} /></button><a href="/" target="_blank" rel="noreferrer">Open public website <ArrowUpRight size={15} /></a></div></section>
}

function Analytics({ analytics, compact = false }) {
  const maxVisits = Math.max(1, ...analytics.days.map((day) => day.visits))
  return <section className={`analytics-panel ${compact ? 'compact' : ''}`}><div className="analytics-heading"><div><span>PRIVACY-LIGHT ANALYTICS</span><h2>Page visits</h2></div><small>Last 7 days</small></div>{analytics.days.length ? <div className="visit-bars">{analytics.days.map((day) => <div className="visit-day" key={day.day} title={`${day.visits} visits`}><span>{day.visits}</span><div><i style={{ height: `${Math.max(4, day.visits / maxVisits * 100)}%` }} /></div><small>{new Date(`${day.day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })}</small></div>)}</div> : <p className="dashboard-empty">Visits will appear here as people browse the site.</p>}{!compact && <div className="popular-pages"><h3>Popular pages · 30 days</h3>{analytics.pages.length ? analytics.pages.map((page) => <div key={page.path}><span>{page.path}</span><strong>{page.visits}</strong></div>) : <p>No visits recorded yet.</p>}</div>}</section>
}

function InquiryList({ inquiries }) {
  const [statuses, setStatuses] = useState(() => Object.fromEntries(inquiries.map((inquiry) => [inquiry.id, inquiry.status])))
  const [statusError, setStatusError] = useState('')
  const updateStatus = async (id, status) => {
    setStatusError('')
    try {
      const response = await fetch(`/api/inquiries/${id}`, authOptions(sessionStorage.getItem('shilo-admin-token') || '', 'PATCH', { status }))
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Could not update enquiry status.')
      setStatuses((current) => ({ ...current, [id]: data.inquiry.status }))
    } catch (error) { setStatusError(error.message) }
  }
  if (!inquiries.length) return <p className="dashboard-empty inquiry-empty">No enquiries yet. New messages from the contact form will appear here.</p>
  return <div className="dashboard-inquiries">{statusError && <p className="dashboard-error" role="alert">{statusError}</p>}{inquiries.map((inquiry) => <article key={inquiry.id}><header><div><strong>{inquiry.name}</strong><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></div><select className={`inquiry-status ${statuses[inquiry.id] || inquiry.status}`} value={statuses[inquiry.id] || inquiry.status} onChange={(event) => updateStatus(inquiry.id, event.target.value)} aria-label={`Status for ${inquiry.name}`}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></header><p>{inquiry.message}</p><small>{inquiry.interest || 'General enquiry'} · {inquiry.travelers} travellers · {new Date(inquiry.created_at).toLocaleDateString()}</small></article>)}</div>
}
