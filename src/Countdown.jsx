import { useEffect, useState } from 'react'

const TARGET = new Date('2026-11-13T00:00:00-03:00').getTime()

export default function Countdown() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(i) }, [])
  const dias = Math.ceil((TARGET - now) / 864e5)
  if (dias <= 0) return <p className="countdown">Ya empezó</p>
  return <p className="countdown">{dias === 1 ? 'Falta 1 día' : `Faltan ${dias} días`}</p>
}
