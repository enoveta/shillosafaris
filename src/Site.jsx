import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import {
  ArrowDownRight, ArrowLeft, ArrowRight, BadgeCheck, Binoculars, CalendarDays, Check,
  ChevronDown, Coffee, Compass, Leaf, Menu, Mountain, Plane, Ship, Sparkles, TreePine,
  UsersRound, X,
} from 'lucide-react'
import { defaultDestinations, defaultPages, defaultServices } from './contentDefaults.js'
import Dashboard from './Dashboard.jsx'
import './site.css'

const iconMap = { BadgeCheck, Binoculars, CalendarDays, Coffee, Compass, Leaf, Plane, Ship, Sparkles, UsersRound }
const SiteContentContext = createContext(null)

const photo = (id, width = 1000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
const currentYear = new Date().getFullYear()

function Header({ services = defaultServices, destinations = defaultDestinations }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)
  return <header className="site-header"><div className="header-inner">
    <Link to="/" className="brand" onClick={closeMenu} aria-label="Shilo Safaris home"><img src="/shilo-emblem.png" alt="" /><span className="brand-copy"><strong>SHILO</strong><small>SAFARIS &amp; TOURS</small></span></Link>
    <button className="icon-button mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
    <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
      <NavLink to="/" end onClick={closeMenu}>Home</NavLink><NavLink to="/about" onClick={closeMenu}>About</NavLink>
      <details className="nav-dropdown" onMouseEnter={(event) => { event.currentTarget.open = true }} onMouseLeave={(event) => { event.currentTarget.open = false }}><summary>Services <ChevronDown size={14} /></summary><div className="dropdown-panel"><Link to="/services" onClick={closeMenu}>All services <ArrowRight size={14} /></Link>{services.map((service) => <Link key={service.slug} to={`/services/${service.slug}`} onClick={closeMenu}>{service.title}</Link>)}</div></details>
      <details className="nav-dropdown" onMouseEnter={(event) => { event.currentTarget.open = true }} onMouseLeave={(event) => { event.currentTarget.open = false }}><summary>Destinations <ChevronDown size={14} /></summary><div className="dropdown-panel"><Link to="/destinations" onClick={closeMenu}>All destinations <ArrowRight size={14} /></Link>{destinations.map((destination) => <Link key={destination.slug} to={`/destinations/${destination.slug}`} onClick={closeMenu}>{destination.title}</Link>)}</div></details>
      <NavLink to="/contact" onClick={closeMenu}>Contact</NavLink><Link className="nav-cta" to="/contact" onClick={closeMenu}>Plan your trip <ArrowRight size={15} /></Link>
    </nav>
  </div></header>
}

function Footer() {
  return <footer className="site-footer"><div className="footer-main">
    <Link to="/" className="brand footer-brand"><img src="/shilo-emblem.png" alt="" /><span className="brand-copy"><strong>SHILO</strong><small>SAFARIS &amp; TOURS</small></span></Link>
    <p>Rwanda, at your own pace.<br />Local care. Lasting memories.</p>
    <div className="footer-links"><Link to="/about">Our story</Link><Link to="/services">Services</Link><Link to="/destinations">Destinations</Link><Link to="/contact">Get in touch</Link></div>
  </div><div className="footer-bottom"><span>© {currentYear} Shilo Safaris &amp; Tours</span><span>Made for the journey.</span></div></footer>
}

function SectionHeading({ eyebrow, title, text, link, linkText }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>{link && <Link className="text-link" to={link}>{linkText || 'Explore all'} <ArrowRight size={16} /></Link>}</div>
}

function ServiceCard({ item, index = 0 }) {
  const Icon = typeof item.icon === 'string' ? iconMap[item.icon] || Compass : item.icon || Compass
  return <Link to={`/services/${item.slug}`} className="service-card" style={{ '--card-index': index }}><span className="service-icon"><Icon size={20} strokeWidth={1.7} /></span><span className="service-card-bottom"><strong>{item.title}</strong><span className="card-arrow"><ArrowDownRight size={17} className="arrow-up-right" /></span></span><span className="service-card-copy">{item.intro}</span></Link>
}

function DestinationCard({ item, index = 0 }) {
  return <Link to={`/destinations/${item.slug}`} className="destination-card" style={{ '--card-index': index }}><img src={photo(item.image, 850)} alt={item.title} loading="lazy" style={{ objectPosition: item.position }} /><span className="destination-shade" /><span className="destination-copy"><small>{item.eyebrow}</small><strong>{item.title}</strong><span>{item.intro}</span></span><span className="destination-arrow"><ArrowRight size={18} /></span></Link>
}

function Home({ services = defaultServices, destinations = defaultDestinations }) {
  return <>
    <section className="hero"><div className="hero-image" role="img" aria-label="A safari landscape in Rwanda" /><div className="hero-content page-width"><span className="hero-kicker"><span /> YOUR RWANDA, YOUR WAY</span><h1>Come for the<br /><em>landscape.</em><br />Stay for the feeling.</h1><p>From misty mountain trails to the easy hush of Lake Kivu, let Rwanda meet you where you are.</p><div className="hero-actions"><Link className="button button-light" to="/destinations">Explore Rwanda <ArrowRight size={17} /></Link><Link className="hero-secondary" to="/about">Meet Shilo <ArrowRight size={16} /></Link></div></div><div className="hero-caption"><span>01 / 05</span><span>THE LAND OF A THOUSAND HILLS</span><span>KIGALI · RWANDA</span></div><div className="hero-side-note">DESIGNED AROUND YOU</div></section>
    <div className="intro-ribbon"><span><Mountain size={18} /> MOUNTAINS &amp; FORESTS</span><span><TreePine size={18} /> WILDLIFE &amp; WILDERNESS</span><span><Sparkles size={18} /> CULTURE &amp; CONNECTION</span><span><Compass size={18} /> LOCAL, THOUGHTFUL TRAVEL</span></div>
    <section className="story-section page-width section-pad"><div className="story-image-wrap"><img src={photo('photo-1516026672322-bc52d61a55d5', 1100)} alt="Wildlife in a green Rwandan landscape" loading="lazy" /><span className="image-stamp"><strong>RWANDA</strong><small>THE HEART OF AFRICA</small></span></div><div className="story-copy"><span className="eyebrow">A JOURNEY WITH MEANING</span><h2>Travel that feels<br /><em>like it belongs.</em></h2><p>We believe the best journeys leave room for wonder. Shilo Safaris &amp; Tours brings local knowledge and genuine care to every detail, so your time in Rwanda feels personal from the very first hello.</p><Link to="/about" className="text-link">A little about us <ArrowRight size={16} /></Link><div className="story-signoff"><span className="signoff-mark">S</span><span><strong>Local knowledge,</strong><small>with a human touch.</small></span></div></div></section>
    <section className="services-section section-pad"><div className="page-width"><SectionHeading eyebrow="THE DETAILS, THOUGHTFULLY HANDLED" title="A better way to get there." text="From first arrival to that last cup of coffee, we make the moving parts feel easy." /><div className="service-grid home-service-grid">{services.slice(0, 6).map((item, index) => <ServiceCard key={item.slug} item={item} index={index} />)}</div><Link className="service-more-link" to="/services">Explore all services <ArrowRight size={16} /></Link></div></section>
    <section className="destination-section section-pad page-width"><SectionHeading eyebrow="A SMALL COUNTRY, A WORLD OF DIFFERENCE" title="Find your kind of wild." text="Rainforest mornings, savannah sunsets, and lakeside afternoons. Start wherever you feel drawn." link="/destinations" linkText="See every destination" /><div className="destination-grid home-destination-grid">{destinations.slice(0, 3).map((item, index) => <DestinationCard key={item.slug} item={item} index={index} />)}</div></section>
    <section className="quote-band"><div className="quote-inner"><span className="eyebrow">A NOTE FROM THE ROAD</span><p>“The most memorable part was how at home we felt, from the first welcome to the very last goodbye.”</p><span className="quote-credit">A SHILO TRAVELLER · RWANDA</span></div><div className="quote-sun" /></section><Callout />
  </>
}

function Callout() {
  return <section className="callout-band"><div className="callout page-width"><div><span className="eyebrow">YOUR RWANDA STORY STARTS HERE</span><h2>Tell us what you<br /><em>have in mind.</em></h2></div><Link to="/contact" className="button button-callout">Let’s plan it <ArrowRight size={17} /></Link></div></section>
}

function PageHero({ eyebrow, title, description, image, imageAlt }) {
  return <section className="page-hero"><div className="page-width page-hero-inner"><div className="page-hero-copy"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div><img src={photo(image, 1200)} alt={imageAlt || ''} /></div></section>
}

function About({ page = defaultPages.about }) {
  return <><PageHero eyebrow={page.heroEyebrow} title={<>{page.heroTitle}<br /><em>{page.heroAccent}</em></>} description={page.heroDescription} image="photo-1516026672322-bc52d61a55d5" imageAlt="Rwandan hills and wildlife" /><section className="about-content page-width section-pad"><div className="about-lead"><span className="eyebrow">{page.introEyebrow}</span><h2>{page.introTitle}<br /><em>{page.introAccent}</em></h2></div><div className="about-body"><p className="large-copy">{page.lead}</p><p>{page.paragraphOne}</p><p>{page.paragraphTwo}</p><Link to="/contact" className="text-link">Start a conversation <ArrowRight size={16} /></Link></div></section><section className="values-band"><div className="page-width values-grid"><div><span className="value-number">01</span><h3>{page.valueOneTitle}</h3><p>{page.valueOneBody}</p></div><div><span className="value-number">02</span><h3>{page.valueTwoTitle}</h3><p>{page.valueTwoBody}</p></div><div><span className="value-number">03</span><h3>{page.valueThreeTitle}</h3><p>{page.valueThreeBody}</p></div></div></section><Callout /></>
}

function Services({ items = defaultServices }) {
  return <><PageHero eyebrow="TRAVEL, MADE EASIER" title={<>The details that<br /><em>make the journey.</em></>} description="A trusted local team for the big plans and the little things in between." image="photo-1516426122078-c23e76319801" imageAlt="A safari journey through the wild" /><section className="listing-section page-width section-pad"><SectionHeading eyebrow="HOW WE CAN HELP" title="Our services" text="Pick a starting point. We’ll take care of the details around it." /><div className="service-grid listing-service-grid">{items.map((item, index) => <ServiceCard key={item.slug} item={item} index={index} />)}</div></section><Callout /></>
}

function Destinations({ items = defaultDestinations }) {
  return <><PageHero eyebrow="THE LAND OF A THOUSAND HILLS" title={<>One small country.<br /><em>So many worlds.</em></>} description="A collection of places to explore slowly, each with a character all its own." image="photo-1464822759023-fed622ff2c3b" imageAlt="Mountain peaks beneath an open sky" /><section className="listing-section page-width section-pad"><SectionHeading eyebrow="WHERE WILL THE ROAD TAKE YOU?" title="Our destinations" text="Explore Rwanda’s wild places, vibrant communities, and lovely quiet corners." /><div className="destination-grid listing-destination-grid">{items.map((item, index) => <DestinationCard key={item.slug} item={item} index={index} />)}</div></section><Callout /></>
}

function DetailPage({ items, kind }) {
  const { slug } = useParams()
  const item = items.find((entry) => entry.slug === slug)
  if (!item) return <NotFound />
  const isDestination = kind === 'destination'
  const Icon = typeof item.icon === 'string' ? iconMap[item.icon] || Mountain : item.icon || Mountain
  const related = items.filter((entry) => entry.slug !== item.slug).slice(0, 3)
  return <><section className="detail-hero"><img src={photo(item.image, 1800)} alt={item.title} /><div className="detail-shade" /><div className="page-width detail-hero-copy"><Link to={isDestination ? '/destinations' : '/services'} className="back-link"><ArrowLeft size={15} /> Back to {isDestination ? 'destinations' : 'all services'}</Link><span className="eyebrow">{isDestination ? item.eyebrow : 'A SHILO EXPERIENCE'}</span><h1>{item.title}</h1><p>{item.intro}</p></div></section><section className="detail-body page-width section-pad"><div className="detail-icon"><Icon size={22} /></div><div className="detail-article"><span className="eyebrow">{isDestination ? 'GET TO KNOW THE PLACE' : 'A LITTLE MORE ABOUT IT'}</span><h2>{item.intro}</h2><p>{item.body}</p><Link to="/contact" className="button button-dark">{isDestination ? 'Plan a visit' : 'Ask us about it'} <ArrowRight size={16} /></Link></div><aside className="detail-aside"><span className="eyebrow">GOOD TO KNOW</span><p>{isDestination ? 'We can help build this destination into a wider Rwanda itinerary, with transport and stays arranged along the way.' : 'Every plan is tailored to your dates, interests, and group. Tell us what you need and we’ll take it from there.'}</p><Link to="/contact" className="text-link">Talk to our team <ArrowRight size={15} /></Link></aside></section><section className="related-section"><div className="page-width section-pad"><SectionHeading eyebrow={isDestination ? 'KEEP EXPLORING' : 'MORE WAYS TO GO'} title={isDestination ? 'Another place to fall for.' : 'Build your own kind of trip.'} link={isDestination ? '/destinations' : '/services'} linkText={isDestination ? 'All destinations' : 'All services'} />{isDestination ? <div className="destination-grid home-destination-grid">{related.map((entry, index) => <DestinationCard key={entry.slug} item={entry} index={index} />)}</div> : <div className="service-grid home-service-grid">{related.map((entry, index) => <ServiceCard key={entry.slug} item={entry} index={index} />)}</div>}</div></section></>
}

function Contact({ services = defaultServices, destinations = defaultDestinations, page = defaultPages.contact }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', interest: '', travelDate: '', travelers: '2', message: '' })
  const [state, setState] = useState({ status: 'idle', message: '' })
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault()
    setState({ status: 'sending', message: '' })
    try {
      const response = await fetch('/api/inquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'We could not send your message just now.')
      setState({ status: 'sent', message: page.successMessage })
      setForm({ name: '', email: '', phone: '', interest: '', travelDate: '', travelers: '2', message: '' })
    } catch (error) { setState({ status: 'error', message: error.message || 'Something went wrong. Please try again.' }) }
  }
  return <><PageHero eyebrow={page.heroEyebrow} title={<>{page.heroTitle}<br /><em>{page.heroAccent}</em></>} description={page.heroDescription} image="photo-1472396961693-142e6e269027" imageAlt="A quiet wildlife landscape" /><section className="contact-section page-width section-pad"><div className="contact-aside"><span className="eyebrow">{page.asideEyebrow}</span><h2>{page.asideTitle}<br /><em>{page.asideAccent}</em></h2><p>{page.asideBody}</p><div className="contact-detail"><span className="contact-icon"><Plane size={18} /></span><span><small>BASED IN</small><strong>{page.location}</strong></span></div><div className="contact-detail"><span className="contact-icon"><CalendarDays size={18} /></span><span><small>HERE TO HELP WITH</small><strong>{page.helpText}</strong></span></div></div>
    <form className="inquiry-form" onSubmit={submit}><div className="form-heading"><span className="eyebrow">{page.formEyebrow}</span><span>{page.formNote}</span></div><div className="form-grid"><label>Your name *<input name="name" value={form.name} onChange={update} autoComplete="name" required /></label><label>Email address *<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" required /></label><label>Phone number<input name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" /></label><label>What are you interested in?<select name="interest" value={form.interest} onChange={update}><option value="">Choose one</option>{[...services.map((service) => service.title), ...destinations.map((destination) => destination.title)].map((interest) => <option key={interest}>{interest}</option>)}</select></label><label>Travel date<input name="travelDate" type="date" value={form.travelDate} onChange={update} /></label><label>Number travelling<input name="travelers" type="number" min="1" max="50" value={form.travelers} onChange={update} /></label><label className="full-field">Tell us a little about your plans<textarea name="message" rows="4" value={form.message} onChange={update} required /></label></div><div className="form-submit"><button className="button button-dark" type="submit" disabled={state.status === 'sending'}>{state.status === 'sending' ? 'Sending…' : page.submitLabel} <ArrowRight size={16} /></button>{state.message && <p className={`form-message ${state.status}`} role="status">{state.status === 'sent' && <Check size={16} />}{state.message}</p>}</div></form>
  </section></>
}

function NotFound() { return <section className="not-found page-width"><span className="eyebrow">A WRONG TURN?</span><h1>Let’s find<br /><em>the right road.</em></h1><Link to="/" className="button button-dark">Back to home <ArrowRight size={16} /></Link></section> }

function AppRoutes() {
  const content = useContext(SiteContentContext)
  const location = useLocation()
  const lastVisitPath = useRef('')
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')) return
    if (lastVisitPath.current === location.pathname) return
    lastVisitPath.current = location.pathname
    fetch('/api/site/visit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: location.pathname }) }).catch(() => {})
  }, [location.pathname])
  if (location.pathname.startsWith('/dashboard')) return <Dashboard />
  if (location.pathname.startsWith('/admin')) return <Navigate to="/dashboard" replace />
  return <><Header services={content.services} destinations={content.destinations} /><main><Routes><Route path="/" element={<Home services={content.services} destinations={content.destinations} />} /><Route path="/about" element={<About page={content.pages.about} />} /><Route path="/services" element={<Services items={content.services} />} /><Route path="/services/:slug" element={<DetailPage items={content.services} kind="service" />} /><Route path="/destinations" element={<Destinations items={content.destinations} />} /><Route path="/destinations/:slug" element={<DetailPage items={content.destinations} kind="destination" />} /><Route path="/contact" element={<Contact services={content.services} destinations={content.destinations} page={content.pages.contact} />} /><Route path="*" element={<NotFound />} /></Routes></main><Footer /></>
}

function SiteContentProvider() {
  const [content, setContent] = useState(initialSiteContent)
  useEffect(() => {
    let active = true
    fetch('/api/site/content').then((response) => response.ok ? response.json() : null).then((data) => {
      if (active && data) setContent(mergeSiteContent(data))
    }).catch(() => {})
    return () => { active = false }
  }, [])
  return <SiteContentContext.Provider value={content}><AppRoutes /></SiteContentContext.Provider>
}

const initialSiteContent = mergeSiteContent({ services: defaultServices, destinations: defaultDestinations, pages: defaultPages })

function mergeSiteContent(data) {
  const mergeCollection = (defaults, incoming) => incoming.map((item) => {
    const fallback = defaults.find((entry) => entry.slug === item.slug) || {}
    return { ...fallback, ...item, icon: typeof item.icon === 'string' ? iconMap[item.icon] || Compass : item.icon || fallback.icon || Compass }
  })
  return { services: mergeCollection(defaultServices, data.services || defaultServices), destinations: mergeCollection(defaultDestinations, data.destinations || defaultDestinations), pages: { ...defaultPages, ...data.pages } }
}

export default function Site() { return <BrowserRouter><SiteContentProvider /></BrowserRouter> }
