import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { enviarInscripcion, reenviarPendientes, hayPendientes } from './sheets.js'
import { useToast } from './Toast.jsx'

const DRAFT_KEY = 'tricamp_borrador'
const STEPS = ['Tus datos', 'Deporte y salud']

const INIT = {
  nombre: '', apellido: '', edad: '', email: '', telefono: '', instagram: '',
  nivel: '', disciplinas: [], antecedentes_deportivos: '', objetivo_corto: '', objetivo_mediano: '',
  lesiones: '', detalle_lesiones: '', condiciones_medicas: '', alimentacion: '',
  contacto_emergencia_nombre: '', contacto_emergencia_telefono: '',
  talle_remera: '', alojamiento: '', comentarios: '', acepta_terminos: false,
}

const NIVELES = ['Principiante', 'Intermedio', 'Avanzado', 'Competitivo']
const DISCS = ['Natación', 'Ciclismo', 'Running', 'Ninguna aún']
const NO_EMPTY = (v) => String(v).trim() !== ''
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TEL = (v) => v.replace(/\D/g, '').length >= 8

const RULES = [
  {
    nombre: [NO_EMPTY, 'Ingresá tu nombre'],
    apellido: [NO_EMPTY, 'Ingresá tu apellido'],
    edad: [(v) => v >= 10 && v <= 90, 'Ingresá una edad válida'],
    email: [(v) => EMAIL_RE.test(v), 'Ingresá un correo válido'],
    telefono: [TEL, 'Ingresá un teléfono válido'],
  },
  {
    nivel: [NO_EMPTY, 'Elegí tu nivel'],
    disciplinas: [(v) => v.length > 0, 'Elegí al menos una opción'],
    objetivo_corto: [NO_EMPTY, 'Contanos tu objetivo a corto plazo'],
    objetivo_mediano: [NO_EMPTY, 'Contanos tu objetivo a mediano plazo'],
    lesiones: [NO_EMPTY, 'Indicá si tuviste lesiones'],
    contacto_emergencia_nombre: [NO_EMPTY, 'Ingresá un contacto de emergencia'],
    contacto_emergencia_telefono: [TEL, 'Ingresá un teléfono válido'],
    acepta_terminos: [(v) => v === true, 'Debés aceptar para inscribirte'],
  },
]

function validar(step, data) {
  const errs = {}
  Object.entries(RULES[step]).forEach(([k, [fn, msg]]) => { if (!fn(data[k])) errs[k] = msg })
  return errs
}

const ErrCtx = createContext({})

function Field({ k, label, hint, children }) {
  const errors = useContext(ErrCtx)
  return (
    <div className={`field ${errors[k] ? 'error' : ''}`}>
      <label htmlFor={k}>{label}{hint && <small> {hint}</small>}</label>
      {children}
      {errors[k] && <span className="err" role="alert">{errors[k]}</span>}
    </div>
  )
}

function Group({ k, label, hint, children }) {
  const errors = useContext(ErrCtx)
  return (
    <fieldset className={`field ${errors[k] ? 'error' : ''}`}>
      <legend>{label}{hint && <small> {hint}</small>}</legend>
      {children}
      {errors[k] && <span className="err" role="alert">{errors[k]}</span>}
    </fieldset>
  )
}

export default function Form({ onBack }) {
  const [data, setData] = useState(() => {
    try { return { ...INIT, ...JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}') } } catch { return INIT }
  })
  const [step, setStep] = useState(() => Math.min(Number(sessionStorage.getItem(DRAFT_KEY + '_step')) || 0, STEPS.length - 1))
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [done, setDone] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [demo, setDemo] = useState(false)
  const top = useRef(null)
  const toast = useToast()

  useEffect(() => { if (!done) localStorage.setItem(DRAFT_KEY, JSON.stringify(data)) }, [data, done])
  useEffect(() => { sessionStorage.setItem(DRAFT_KEY + '_step', String(step)) }, [step])

  useEffect(() => {
    if (data.nombre || data.email) toast.info('Retomamos tu borrador', 'Tus datos guardados siguen acá.')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reenviar inscripciones que quedaron pendientes por falta de conexión
  useEffect(() => {
    const retry = async () => {
      if (!hayPendientes()) return
      const n = await reenviarPendientes()
      if (n) toast.success('Inscripción enviada', 'Se envió la inscripción que había quedado pendiente.')
    }
    retry()
    window.addEventListener('online', retry)
    return () => window.removeEventListener('online', retry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const set = (k, v) => { setData((d) => ({ ...d, [k]: v })); if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined })) }
  const toggle = (k, v) => set(k, data[k].includes(v) ? data[k].filter((x) => x !== v) : [...data[k], v])
  const scrollTop = () => top.current?.scrollTo({ top: 0 })

  // Comportamiento de modal: Esc cierra, el fondo no se desplaza
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape' && !sending) onBack() }
    addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; removeEventListener('keydown', onKey) }
  }, [onBack, sending])

  const next = () => {
    const e = validar(step, data)
    setErrors(e)
    const n = Object.keys(e).length
    if (n) {
      toast.warning(n === 1 ? 'Falta completar 1 campo' : `Faltan completar ${n} campos`, 'Revisá los campos marcados para continuar.')
      document.querySelector('.field.error input, .field.error textarea')?.focus()
      return
    }
    setStep((s) => s + 1); scrollTop()
  }
  const back = () => { setErrors({}); setStep((s) => s - 1); scrollTop() }

  const submit = async (ev) => {
    ev.preventDefault()
    if (step < STEPS.length - 1) { next(); return }
    const e = { ...validar(0, data), ...validar(1, data) }
    setErrors(e)
    if (Object.keys(e).length) {
      const n = Object.keys(e).length
      toast.warning(n === 1 ? 'Falta completar 1 campo' : `Faltan completar ${n} campos`, 'Revisá los campos marcados para confirmar.')
      if (Object.keys(validar(0, data)).length) setStep(0)
      return
    }
    if (!navigator.onLine) { toast.error('Sin conexión', 'Conectate a internet para enviar tu inscripción.'); return }
    setSending(true); setSendError('')
    const loadingId = toast.info('Enviando tu inscripción', 'No cierres esta página.', 0)
    try {
      const [res] = await Promise.all([
        enviarInscripcion({ ...data, instagram: data.instagram.replace(/^@/, '') }),
        new Promise((r) => setTimeout(r, 500)),
      ])
      localStorage.removeItem(DRAFT_KEY); sessionStorage.removeItem(DRAFT_KEY + '_step')
      toast.dismiss(loadingId)
      if (res.demo) toast.warning('Modo de prueba', 'Falta conectar Google Sheets: esta inscripción NO se guardó en la planilla.', 9000)
      else toast.success('Inscripción enviada', 'Tus datos quedaron guardados correctamente.')
      setCodigo(res.id); setDemo(res.demo)
      setDone(true); scrollTop()
    } catch {
      toast.dismiss(loadingId)
      toast.error('No pudimos enviar tu inscripción', 'Tus datos están a salvo en este dispositivo. Se reenviarán solos al volver la conexión, o probá de nuevo.')
      setSendError('No se pudo enviar. Tus datos siguen guardados: tocá "Confirmar inscripción" para reintentar.')
    } finally { setSending(false) }
  }

  const txt = (k, props = {}) => (
    <input id={k} type="text" value={data[k]} onChange={(e) => set(k, e.target.value)} {...props} />
  )
  const area = (k, ph) => <textarea id={k} rows={3} value={data[k]} placeholder={ph} onChange={(e) => set(k, e.target.value)} />
  const opts = (k, list, multi = false) => (
    <div className="opts">
      {list.map((o) => (
        <label className="opt" key={o}>
          <input
            type={multi ? 'checkbox' : 'radio'} name={k}
            checked={multi ? data[k].includes(o) : data[k] === o}
            onChange={() => (multi ? toggle(k, o) : set(k, o))}
          />
          <span>{o}</span>
        </label>
      ))}
    </div>
  )

  const modal = (children) => (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && !sending) onBack() }}>
      <div className="card" role="dialog" aria-modal="true" aria-labelledby="form-title">
        {children}
      </div>
    </div>
  )

  const head = (title, sub) => (
    <header className="card-head">
      <div>
        <h2 id="form-title">{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      <button type="button" className="close" onClick={onBack} disabled={sending} aria-label="Cerrar">×</button>
    </header>
  )

  if (done) {
    return modal(
      <>
        {head('Ya estás adentro', 'Inscripción recibida')}
        <div className="card-body done" ref={top}>
          <p>Recibimos tu inscripción, {data.nombre}. Te vamos a contactar por WhatsApp o mail con los próximos pasos del TriCamp (13, 14 y 15 de noviembre).</p>
          {codigo && <p className="code">Tu código de inscripción<b>{codigo}</b></p>}
          {demo && <p className="notice">Modo de prueba: esta inscripción no se guardó en Google Sheets.</p>}
        </div>
        <footer className="card-foot">
          <button type="button" className="btn btn-plain" onClick={() => { setData(INIT); setStep(0); setDone(false) }}>Inscribir a otra persona</button>
          <button type="button" className="btn btn-main" onClick={onBack}>Listo</button>
        </footer>
      </>
    )
  }

  return modal(
    <ErrCtx.Provider value={errors}>
      {head('Inscripción al TriCamp', 'La Caldera, Salta · 13, 14 y 15 de noviembre')}
      <ol className="steps" aria-label="Progreso">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'on' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
            <span>{i < step ? '✓' : i + 1}</span>{s}
          </li>
        ))}
      </ol>

      <form onSubmit={submit} noValidate aria-busy={sending} className="card-form">
        <div className="card-body" ref={top} key={step}>
          {step === 0 && (
            <div className="grid two">
              <Field k="nombre" label="Nombre">{txt('nombre', { autoComplete: 'given-name' })}</Field>
              <Field k="apellido" label="Apellido">{txt('apellido', { autoComplete: 'family-name' })}</Field>
              <Field k="edad" label="Edad"><input id="edad" type="number" inputMode="numeric" min="10" max="90" value={data.edad} onChange={(e) => set('edad', e.target.value)} /></Field>
              <Field k="telefono" label="Teléfono / WhatsApp"><input id="telefono" type="tel" inputMode="tel" autoComplete="tel" placeholder="387 000 0000" value={data.telefono} onChange={(e) => set('telefono', e.target.value)} /></Field>
              <div className="span2"><Field k="email" label="Correo electrónico"><input id="email" type="email" inputMode="email" autoComplete="email" value={data.email} onChange={(e) => set('email', e.target.value)} /></Field></div>
              <div className="span2"><Field k="instagram" label="Instagram" hint="(opcional)">{txt('instagram', { autoCapitalize: 'none', autoCorrect: 'off', placeholder: '@usuario' })}</Field></div>
            </div>
          )}

          {step === 1 && (
            <div className="grid">
              <Group k="nivel" label="Nivel actual">{opts('nivel', NIVELES)}</Group>
              <Group k="disciplinas" label="¿Qué disciplinas practicás?" hint="(podés elegir varias)">{opts('disciplinas', DISCS, true)}</Group>
              <Field k="antecedentes_deportivos" label="Antecedentes deportivos" hint="(carreras, años entrenando, club; opcional)">{area('antecedentes_deportivos')}</Field>
              <Field k="objetivo_corto" label="Objetivo a corto plazo" hint="(próximos 3 meses)">{area('objetivo_corto')}</Field>
              <Field k="objetivo_mediano" label="Objetivo a mediano plazo" hint="(6 a 12 meses)">{area('objetivo_mediano')}</Field>

              <h3>Salud</h3>
              <Group k="lesiones" label="¿Tuviste lesiones?">{opts('lesiones', ['No', 'Sí, ya recuperada', 'Sí, actualmente'])}</Group>
              {data.lesiones.startsWith('Sí') && <Field k="detalle_lesiones" label="Detalle de la lesión" hint="(zona, cuándo, tratamiento)">{area('detalle_lesiones')}</Field>}
              <Field k="condiciones_medicas" label="Condiciones médicas, alergias o medicación" hint="(opcional)">{area('condiciones_medicas')}</Field>
              <Field k="alimentacion" label="Restricciones alimentarias" hint="(opcional)">{txt('alimentacion')}</Field>

              <h3>Contacto de emergencia</h3>
              <div className="grid two">
                <Field k="contacto_emergencia_nombre" label="Nombre y vínculo">{txt('contacto_emergencia_nombre', { placeholder: 'Ej: María (madre)' })}</Field>
                <Field k="contacto_emergencia_telefono" label="Teléfono"><input id="contacto_emergencia_telefono" type="tel" inputMode="tel" value={data.contacto_emergencia_telefono} onChange={(e) => set('contacto_emergencia_telefono', e.target.value)} /></Field>
              </div>

              <h3>Logística</h3>
              <Group k="talle_remera" label="Talle de remera" hint="(opcional)">{opts('talle_remera', ['XS', 'S', 'M', 'L', 'XL', 'XXL'])}</Group>
              <Group k="alojamiento" label="¿Necesitás alojamiento?" hint="(opcional)">{opts('alojamiento', ['Sí', 'No', 'Ya tengo'])}</Group>
              <Field k="comentarios" label="Comentarios" hint="(opcional)">{area('comentarios')}</Field>

              <div className={`field ${errors.acepta_terminos ? 'error' : ''}`}>
                <label className="agree" htmlFor="acepta_terminos">
                  <input id="acepta_terminos" type="checkbox" checked={data.acepta_terminos} onChange={(e) => set('acepta_terminos', e.target.checked)} />
                  <span>Declaro que la información es verdadera, que me encuentro apto/a para realizar actividad física y autorizo el uso de mis datos para la organización del TriCamp.</span>
                </label>
                {errors.acepta_terminos && <span className="err" role="alert">{errors.acepta_terminos}</span>}
              </div>
              {sendError && <p className="notice" role="alert">{sendError}</p>}
            </div>
          )}
        </div>

        <footer className="card-foot">
          {step > 0
            ? <button type="button" className="btn btn-plain" onClick={back}>Atrás</button>
            : <span className="draft">Tu avance se guarda solo.</span>}
          {step < STEPS.length - 1
            ? <button type="button" className="btn btn-main" onClick={next}>Siguiente</button>
            : <button type="submit" className="btn btn-main" disabled={sending}>{sending ? 'Enviando…' : 'Confirmar inscripción'}</button>}
        </footer>
      </form>
    </ErrCtx.Provider>
  )
}
