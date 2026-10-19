import { useCallback, useEffect, useState } from 'react'
import Form from './Form.jsx'
import { ToastProvider } from './Toast.jsx'

const FORM_HASH = '#inscripcion'

const FOTOS = [
  { src: '/WhatsApp Image 2026-10-19 at 9.44.04 AM.jpeg',     pos: 'center 70%' },
  { src: '/WhatsApp Image 2026-10-19 at 9.44.04 AM (1).jpeg', pos: 'center 62%' },
  { src: '/WhatsApp Image 2026-10-19 at 9.44.04 AM (2).jpeg', pos: 'center 58%' },
  { src: '/WhatsApp Image 2026-10-19 at 9.44.05 AM.jpeg',     pos: 'center 62%' },
  { src: '/WhatsApp Image 2026-10-19 at 9.44.05 AM (1).jpeg', pos: 'center 60%' },
]

/* ─── Lightbox ──────────────────────────────────────────────────── */
function Lightbox({ idx, onClose }) {
  const [cur, setCur] = useState(idx)
  const total = FOTOS.length
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape')     onClose()
      if (e.key === 'ArrowRight') setCur((c) => (c + 1) % total)
      if (e.key === 'ArrowLeft')  setCur((c) => (c - 1 + total) % total)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose, total])
  return (
    <div className="lightbox" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true">
      <button className="lb-close" onClick={onClose} aria-label="Cerrar">×</button>
      <button className="lb-nav lb-prev" onClick={() => setCur((c) => (c - 1 + total) % total)} aria-label="Anterior">‹</button>
      <figure className="lb-figure">
        <img key={cur} src={FOTOS[cur].src} alt={`Foto ${cur + 1}`} className="lb-img" />
        <figcaption className="lb-caption">{cur + 1} / {total}</figcaption>
      </figure>
      <button className="lb-nav lb-next" onClick={() => setCur((c) => (c + 1) % total)} aria-label="Siguiente">›</button>
    </div>
  )
}

/* ─── Cuenta regresiva ──────────────────────────────────────────── */
function DaysLeft({ fecha }) {
  const TARGET = new Date(fecha).getTime()
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(i) }, [])
  const dias = Math.ceil((TARGET - now) / 864e5)
  if (dias <= 0) return <span className="badge">Ya empezó</span>
  return <span className="badge">Faltan {dias === 1 ? '1 día' : `${dias} días`}</span>
}

/* ─── Info (página principal) ───────────────────────────────────── */
function Info({ onInscribir }) {
  const [lightboxIdx, setLightboxIdx] = useState(null)

  return (
    <>
      <header className="nav">
        <a className="brand" href="#top">
          <img src="/logo.jpg" alt="AR Endurance" />
          AR Endurance
        </a>
        <button className="btn btn-sm" onClick={() => onInscribir()}>Inscribirme</button>
      </header>

      <main id="top">

        {/* HERO */}
        <section className="hero" style={{ backgroundImage: `url('/WhatsApp Image 2026-10-19 at 9.44.04 AM.jpeg')` }}>
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-eyebrow">Natación · Ciclismo · Running · Trail</p>
            <h1 className="hero-title">
              AR Endurance
              <span>Camps 2026</span>
            </h1>
            <div className="hero-pills">
              <span><strong>La Caldera</strong>, Salta</span>
              <span><strong>13–15</strong> nov 2026</span>
              <DaysLeft fecha="2026-11-13T00:00:00-03:00" />
            </div>
          </div>
        </section>

        {/* CAMPS — info breve (la elección se hace en el formulario) */}
        <section className="camps-brief" id="camps">
          <p className="cb cb-tri">
            <strong>TriCamp</strong>
            <span>Triatlón — natación en aguas abiertas, ciclismo y running</span>
          </p>
          <p className="cb cb-trail">
            <strong>TrailCamp</strong>
            <span>Montaña — trail running, senderismo y orientación</span>
          </p>
        </section>

        {/* DISCIPLINAS */}
        <section className="disc-strip">
          {[
            { n: '01', label: 'Natación',  sub: 'Aguas abiertas' },
            { n: '02', label: 'Ciclismo',  sub: 'Ruta y montaña' },
            { n: '03', label: 'Running',   sub: 'Trail y asfalto' },
            { n: '04', label: 'Trail',     sub: 'Montaña y altura' },
          ].map(({ n, label, sub }) => (
            <div className="disc-card" key={label}>
              <span className="disc-n">{n}</span>
              <strong>{label}</strong>
              <small>{sub}</small>
            </div>
          ))}
        </section>

        {/* FOTOS */}
        <section className="car-section">
          <div className="car-header">
            <span className="section-tag">El equipo en acción</span>
            <p className="car-header-sub">Fotos de entrenamientos y competencias · Clic para ampliar</p>
          </div>
          <div className="desk-gallery" role="list" aria-label="Fotos del equipo">
            {FOTOS.map(({ src, pos }, i) => (
              <button key={i} className="desk-photo" role="listitem" aria-label={`Ver foto ${i + 1}`} onClick={() => setLightboxIdx(i)} title="Clic para ampliar">
                <img src={src} alt={`Foto ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} style={{ objectPosition: pos }} />
                <div className="desk-photo-overlay"><span className="desk-photo-icon">⊕</span></div>
              </button>
            ))}
          </div>
        </section>

        {/* PILARES */}
        <section className="pillars-strip">
          <p className="section-tag light">Más que entrenar</p>
          <div className="pillars-row">
            {['Entrenamiento', 'Comunidad', 'Naturaleza'].map((p) => (
              <span key={p} className="pillar-item">{p}</span>
            ))}
          </div>
          <p className="pillars-body">
            Tres días en La Caldera, Salta. Elegí tu camp: triatlón o trail. Entrená junto al AR Endurance Team en un entorno natural único.
          </p>
        </section>

      </main>

      <footer className="foot">
        <img src="/logo.jpg" alt="AR Endurance Team" />
        <span>AR Endurance Team · 2026</span>
      </footer>

      {lightboxIdx !== null && (
        <Lightbox idx={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </>
  )
}

/* ─── App root ──────────────────────────────────────────────────── */
export default function App() {
  const [view, setView]         = useState(() => (location.hash === FORM_HASH ? 'form' : 'info'))
  const [campInicial, setCampInicial] = useState('')

  useEffect(() => {
    const onHash = () => setView(location.hash === FORM_HASH ? 'form' : 'info')
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  const irForm = useCallback((camp = '') => {
    setCampInicial(camp)
    location.hash = FORM_HASH
  }, [])

  const cerrar = useCallback(() => {
    history.pushState(null, '', location.pathname)
    setView('info')
  }, [])

  return (
    <ToastProvider>
      <Info onInscribir={irForm} />
      {view === 'form' && <Form onBack={cerrar} campInicial={campInicial} />}
    </ToastProvider>
  )
}
