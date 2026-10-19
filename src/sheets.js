// Envío de inscripciones a Google Sheets vía Google Apps Script (ver /apps-script/Code.gs)
// La respuesta se lee de verdad: si el servidor no confirma, se lanza error y el usuario lo ve.
const ENDPOINT = import.meta.env.VITE_SHEETS_URL
const QUEUE_KEY = 'tricamp_pendientes'

export const sheetsConfigurado = Boolean(ENDPOINT)

const nuevoId = () =>
  'TC-' + (crypto.randomUUID?.().slice(0, 8) ?? Math.random().toString(36).slice(2, 10)).toUpperCase()

async function post(payload, ms = 15000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    // text/plain evita el preflight CORS que Apps Script no soporta
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const json = await res.json()
    if (!json.ok) throw new Error(json.error || 'El servidor rechazó los datos')
    return json
  } finally { clearTimeout(t) }
}

const leerCola = () => { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] } }
const guardarCola = (q) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q))

export async function enviarInscripcion(data) {
  const payload = {
    ...data,
    id: nuevoId(),
    fecha_registro: new Date().toISOString(),
    dispositivo: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
  }

  if (!ENDPOINT) return { demo: true, id: payload.id }

  try {
    // Un reintento automático ante fallos de red
    let r
    try { r = await post(payload) } catch { r = await post(payload) }
    return { demo: false, id: r.id || payload.id, duplicado: Boolean(r.duplicado) }
  } catch (err) {
    // Se guarda en cola para reenviar cuando haya conexión
    guardarCola([...leerCola().filter((p) => p.id !== payload.id), payload])
    throw err
  }
}

// Reenvía inscripciones que no pudieron enviarse. Devuelve cuántas se enviaron.
export async function reenviarPendientes() {
  if (!ENDPOINT) return 0
  const cola = leerCola()
  let ok = 0
  const restantes = []
  for (const p of cola) {
    try { await post(p); ok++ } catch { restantes.push(p) }
  }
  guardarCola(restantes)
  return ok
}

export const hayPendientes = () => leerCola().length > 0
