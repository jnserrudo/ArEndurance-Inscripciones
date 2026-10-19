import { useCallback, useEffect, useRef, useState } from 'react'
import Form from './Form.jsx'
import { ToastProvider } from './Toast.jsx'

const FORM_HASH = '#inscripcion'

// Fotos con posición fine-tuned para mostrar personas en el crop
const FOTOS = [
  { src: '/WhatsApp Image 2026-10-19 at 9.44.04 AM.jpeg',     pos: 'center 70%' }, // lago — personas en fondo
  { src: '/WhatsApp Image 2026-10-19 at 9.44.04 AM (1).jpeg', pos: 'center 65%' }, // árboles — personas en centro-bajo
  { src: '/WhatsApp Image 2026-10-19 at 9.44.04 AM (2).jpeg', pos: 'center 60%' }, // piscina nocturna
  { src: '/WhatsApp Image 2026-10-19 at 9.44.05 AM.jpeg',     pos: 'center 65%' }, // piscina día — personas mitad inferior
  { src: '/WhatsApp Image 2026-10-19 at 9.44.05 AM (1).jpeg', pos: 'center 65%' }, // competencia — personas centro-bajo
]

// Cuenta regresiva — etiqueta clara
function DaysLeft() {
  const TARGET = new Date('2026-11-13T00:00:00-03:00').getTime()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(i)
  }, [])
  const dias = Math.ceil((TARGET - now) / 864e5)
  if (dias <= 0) return <span className="badge">Ya empezó</span>
  return <span className="badge">Faltan {dias === 1 ? '1 día' : `${dias} días`}</span>
}

// Carrusel: auto-avance, sin overlay sobre imagen
function Carousel() {
  const [idx, setIdx] = useState(0)
  const timer = useRef(null)

  const go = useCallback((next) => {
    setIdx(((next % FOTOS.length) + FOTOS.length) % FOTOS.length)
  }, [])

  const startAuto = useCallback(() => {
    clearInterval(timer.current)
    timer.current = setInterval(() => setIdx(p => (p + 1) % FOTOS.length), 4000)
  }, [])

  useEffect(() => { startAuto(); return () => clearInterval(timer.current) }, [startAuto])

  const prev = () => { go(idx - 1); startAuto() }
  const next = () => { go(idx + 1); startAuto() }
  const dot  = (i) => { go(i); startAuto() }

  return (
    <div className="carousel" aria-label="Fotos del equipo">
      <div className="carousel-track" style={{ transform: `translateX(-${idx * 100}%)` }}>
        {FOTOS.map(({ src, pos }, i) => (
          <div key={i} className="carousel-slide">
            <img
              src={src}
              alt={`Foto del equipo ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              style={{ objectPosition: pos }}
            />
          </div>
        ))}
      </div>

      <button className="car-btn car-prev" onClick={prev} aria-label="Anterior">‹</button>
      <button className="car-btn car-next" onClick={next} aria-label="Siguiente">›</button>

      <div className="car-dots">
        {FOTOS.map((_, i) => (
          <button
            key={i}
            className={`car-dot${i === idx ? ' on' : ''}`}
            onClick={() => dot(i)}
            aria-label={`Foto ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function Info({ onInscribir }) {
  return (
    <>
      {/* NAV */}
      <header className="nav">
        <a className="brand" href="#top">
          <img src="/logo.jpg" alt="AR Endurance" />
          AR Endurance
        </a>
        <button className="btn btn-sm" onClick={onInscribir}>Inscribirme</button>
      </header>

      <main id="top">

        {/* HERO — imagen de fondo completa, contenido centrado verticalmente */}
        <section
          className="hero"
          style={{ backgroundImage: `url('/WhatsApp Image 2026-10-19 at 9.44.04 AM.jpeg')` }}
        >
          <div className="hero-overlay" />
          <div className="hero-content">
            <p className="hero-eyebrow">Natación · Ciclismo · Running</p>
            <h1 className="hero-title">
              TriCamp
              <span>del Endurance</span>
            </h1>
            <div className="hero-pills">
              <span><strong>La Caldera</strong>, Salta</span>
              <span><strong>13–15</strong> nov 2026</span>
              <DaysLeft />
            </div>
            <button className="btn btn-hero" onClick={onInscribir}>Quiero participar</button>
          </div>
        </section>

        {/* DISCIPLINAS — 3 columnas compactas */}
        <section className="disc-strip">
          {[
            { n: '01', label: 'Natación',  sub: 'Aguas abiertas' },
            { n: '02', label: 'Ciclismo',  sub: 'Ruta de montaña' },
            { n: '03', label: 'Running',   sub: 'Trail y asfalto' },
          ].map(({ n, label, sub }) => (
            <div className="disc-card" key={label}>
              <span className="disc-n">{n}</span>
              <strong>{label}</strong>
              <small>{sub}</small>
            </div>
          ))}
        </section>

        {/* CARRUSEL / GALERÍA según viewport */}
        <section className="car-section">
          <div className="car-header">
            <span className="section-tag">El equipo en acción</span>
            <p className="car-header-sub">Fotos de entrenamientos y competencias</p>
          </div>

          {/* Mobile: carrusel (se oculta en desktop via CSS) */}
          <div className="car-mobile">
            <Carousel />
          </div>

          {/* Desktop: grilla 5 fotos completas sin recorte (se oculta en mobile via CSS) */}
          <div className="desk-gallery">
            {FOTOS.map(({ src }, i) => (
              <div key={i} className="desk-photo">
                <img
                  src={src}
                  alt={`Foto del equipo ${i + 1}`}
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </div>
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
            Tres días en La Caldera, Salta. Natación, ciclismo y running junto al AR Endurance Team.
          </p>
          <button className="btn btn-light" onClick={onInscribir}>Completar inscripción</button>
        </section>

      </main>

      <footer className="foot">
        <img src="/logo.jpg" alt="AR Endurance Team" />
        <span>AR Endurance Team · 2026</span>
      </footer>
    </>
  )
}

export default function App() {
  const [view, setView] = useState(() => (location.hash === FORM_HASH ? 'form' : 'info'))

  useEffect(() => {
    const onHash = () => setView(location.hash === FORM_HASH ? 'form' : 'info')
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  const irForm  = () => { location.hash = FORM_HASH }
  const cerrar  = useCallback(() => { history.pushState(null, '', location.pathname); setView('info') }, [])

  return (
    <ToastProvider>
      <Info onInscribir={irForm} />
      {view === 'form' && <Form onBack={cerrar} />}
    </ToastProvider>
  )
}
