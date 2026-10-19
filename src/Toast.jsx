import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

const ICONS = {
  success: <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>,
  error: <svg viewBox="0 0 24 24"><path d="M12 8v5M12 17h.01" /><circle cx="12" cy="12" r="9" /></svg>,
  warning: <svg viewBox="0 0 24 24"><path d="M12 4l9 16H3L12 4zM12 10v4M12 17h.01" /></svg>,
  info: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const id = useRef(0)

  const remove = useCallback((i) => setItems((l) => l.filter((t) => t.id !== i)), [])
  const push = useCallback((type, title, message, ms = 4500) => {
    const i = ++id.current
    setItems((l) => [...l.slice(-3), { id: i, type, title, message, ms }])
    if (ms) setTimeout(() => remove(i), ms)
    return i
  }, [remove])

  const api = useRef({}).current
  api.success = (t, m, ms) => push('success', t, m, ms)
  api.error = (t, m, ms) => push('error', t, m, ms ?? 6500)
  api.warning = (t, m, ms) => push('warning', t, m, ms)
  api.info = (t, m, ms) => push('info', t, m, ms)
  api.dismiss = remove

  useEffect(() => {
    const on = () => api.success('Conexión restablecida', 'Ya podés enviar tu inscripción.')
    const off = () => api.warning('Sin conexión', 'Tu avance se guarda en el dispositivo. Reconectate para enviar.', 8000)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [api])

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <div className="toasts" aria-live="polite" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`} role={t.type === 'error' ? 'alert' : 'status'} onClick={() => remove(t.id)}>
            <span className="toast-ico">{ICONS[t.type]}</span>
            <div className="toast-txt"><b>{t.title}</b>{t.message && <span>{t.message}</span>}</div>
            <button className="toast-x" aria-label="Cerrar notificación" onClick={(e) => { e.stopPropagation(); remove(t.id) }}>×</button>
            {t.ms > 0 && <i className="toast-bar" style={{ animationDuration: t.ms + 'ms' }} />}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
