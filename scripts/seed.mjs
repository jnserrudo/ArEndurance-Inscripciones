/**
 * Carga inscripciones de prueba en la Google Sheet (2 TriCamp + 2 TrailCamp).
 * Uso:  node scripts/seed.mjs
 * Requiere VITE_SHEETS_URL en .env y el Code.gs actualizado (con columna 'campamento').
 * Re-ejecutarlo no duplica: el servidor descarta IDs ya existentes (dedup por id).
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim()))
)

const ENDPOINT = env.VITE_SHEETS_URL
if (!ENDPOINT) {
  console.error('Falta VITE_SHEETS_URL en .env')
  process.exit(1)
}

const TEST_PROFILES = [
  {
    campamento: 'TriCamp', nombre: 'Martina', apellido: 'Paredes', edad: '29',
    email: 'martina.paredes@test.com', telefono: '3874123456', instagram: 'martitri',
    nivel: 'Intermedio', disciplinas: ['Natación', 'Running'],
    antecedentes_deportivos: '2 años en triatlón, sprint completado en Córdoba',
    objetivo_corto: 'Mejorar transición bici-carrera y técnica de aguas abiertas',
    objetivo_mediano: 'Completar un olímpico en 2027',
    lesiones: 'No', detalle_lesiones: '', condiciones_medicas: '', alimentacion: 'Vegetariana',
    contacto_emergencia_nombre: 'Laura Paredes (hermana)', contacto_emergencia_telefono: '3874987654',
    talle_remera: 'M', alojamiento: 'Sí', comentarios: 'Primera vez en Salta', acepta_terminos: true,
  },
  {
    campamento: 'TriCamp', nombre: 'Julián', apellido: 'Soto', edad: '41',
    email: 'julian.soto@test.com', telefono: '3874555666', instagram: '',
    nivel: 'Avanzado', disciplinas: ['Ciclismo', 'Running'],
    antecedentes_deportivos: 'Ironman 70.3 en 2024, maratón Bs As',
    objetivo_corto: 'Sumar volumen de ciclismo de montaña',
    objetivo_mediano: 'Ironman completo',
    lesiones: 'Sí, ya recuperada', detalle_lesiones: 'Fascitis plantar 2025, tratada',
    condiciones_medicas: 'Asma leve', alimentacion: '',
    contacto_emergencia_nombre: 'Pedro Soto (padre)', contacto_emergencia_telefono: '3874111222',
    talle_remera: 'L', alojamiento: 'Ya tengo', comentarios: '', acepta_terminos: true,
  },
  {
    campamento: 'TrailCamp', nombre: 'Camila', apellido: 'Ruiz', edad: '33',
    email: 'cami.ruiz@test.com', telefono: '3875333444', instagram: 'camitrail',
    nivel: 'Principiante', disciplinas: ['Senderismo', 'Trail Running'],
    antecedentes_deportivos: 'Trekking ocasional en los cerros',
    objetivo_corto: 'Correr 10K en montaña sin parar',
    objetivo_mediano: 'Hacer un 21K de trail',
    lesiones: 'No', detalle_lesiones: '', condiciones_medicas: '', alimentacion: '',
    contacto_emergencia_nombre: 'Diego Ruiz (pareja)', contacto_emergencia_telefono: '3875777888',
    talle_remera: 'S', alojamiento: 'Sí', comentarios: '¿Hay equipos para prestar?', acepta_terminos: true,
  },
  {
    campamento: 'TrailCamp', nombre: 'Nicolás', apellido: 'Vega', edad: '27',
    email: 'nico.vega@test.com', telefono: '3875999000', instagram: '',
    nivel: 'Competitivo', disciplinas: ['Trail Running', 'Orientación'],
    antecedentes_deportivos: 'K42 Aniversario 2025, VK Salta',
    objetivo_corto: 'Técnica de bajada en terreno suelto',
    objetivo_mediano: 'Correr un 60K de montaña',
    lesiones: 'Sí, actualmente', detalle_lesiones: 'Esguince grado 1 tobillo derecho, en rehabilitación',
    condiciones_medicas: '', alimentacion: 'Sin gluten',
    contacto_emergencia_nombre: 'Ana Vega (madre)', contacto_emergencia_telefono: '3875444555',
    talle_remera: 'M', alojamiento: 'No', comentarios: '', acepta_terminos: true,
  },
  {
    campamento: 'TriCamp', nombre: 'Sofía', apellido: 'Aguirre', edad: '24',
    email: 'sofia.aguirre@test.com', telefono: '3874666777', instagram: 'sofiaguirre_ok',
    nivel: 'Principiante', disciplinas: ['Natación'],
    antecedentes_deportivos: 'Nado de pileta 1 año, sin competencias',
    objetivo_corto: 'Animarme a aguas abiertas por primera vez',
    objetivo_mediano: 'Sprint de triatlón 2027',
    lesiones: 'No', detalle_lesiones: '', condiciones_medicas: '', alimentacion: '',
    contacto_emergencia_nombre: 'Rosa Aguirre (madre)', contacto_emergencia_telefono: '3874666888',
    talle_remera: 'XS', alojamiento: 'Sí', comentarios: 'Viajo con una amiga', acepta_terminos: true,
  },
  {
    campamento: 'TriCamp', nombre: 'Federico', apellido: 'Luna', edad: '36',
    email: 'fede.luna@test.com', telefono: '3874777999', instagram: '',
    nivel: 'Intermedio', disciplinas: ['Ciclismo', 'Natación', 'Running'],
    antecedentes_deportivos: 'Gran fondo 100K, medio maratón',
    objetivo_corto: 'Constancia en las 3 disciplinas',
    objetivo_mediano: '70.3 en 2028',
    lesiones: 'No', detalle_lesiones: '', condiciones_medicas: 'Alergia al polen', alimentacion: '',
    contacto_emergencia_nombre: 'Marcela Luna (esposa)', contacto_emergencia_telefono: '3874000111',
    talle_remera: 'XL', alojamiento: 'Sí', comentarios: '', acepta_terminos: true,
  },
  {
    campamento: 'TrailCamp', nombre: 'Valentina', apellido: 'Morales', edad: '30',
    email: 'vale.morales@test.com', telefono: '3875888000', instagram: 'vale_enmontana',
    nivel: 'Intermedio', disciplinas: ['Trail Running', 'Senderismo', 'Escalada'],
    antecedentes_deportivos: 'Varios 15K de trail en Jujuy y Salta',
    objetivo_corto: 'Subir mi ritmo en ascensos',
    objetivo_mediano: 'K33 en 2027',
    lesiones: 'No', detalle_lesiones: '', condiciones_medicas: '', alimentacion: 'Vegana',
    contacto_emergencia_nombre: 'Tomás Morales (hermano)', contacto_emergencia_telefono: '3875555666',
    talle_remera: 'S', alojamiento: 'Sí', comentarios: '¿Los bastones son obligatorios?', acepta_terminos: true,
  },
  {
    campamento: 'TrailCamp', nombre: 'Gonzalo', apellido: 'Ibarra', edad: '45',
    email: 'gonza.ibarra@test.com', telefono: '3875222111', instagram: '',
    nivel: 'Avanzado', disciplinas: ['Trail Running', 'Orientación'],
    antecedentes_deportivos: 'Ultramaratón 80K Calilegua',
    objetivo_corto: 'Mejorar gestión de energía en carreras largas',
    objetivo_mediano: '100K en montaña',
    lesiones: 'Sí, ya recuperada', detalle_lesiones: 'Rodilla, menisco 2023',
    condiciones_medicas: '', alimentacion: '',
    contacto_emergencia_nombre: 'Lucía Ibarra (hermana)', contacto_emergencia_telefono: '3875111333',
    talle_remera: 'XXL', alojamiento: 'Ya tengo', comentarios: '', acepta_terminos: true,
  },
]

for (const [i, p] of TEST_PROFILES.entries()) {
  const payload = {
    ...p,
    instagram: p.instagram.replace(/^@/, ''),
    // ID determinista: re-ejecutar el seed no crea duplicados.
    // Prefijo TC-T2: distinto del primer seed (TC-TEST) que se cargó sin 'campamento'.
    id: `TC-T2-${String(i + 1).padStart(2, '0')}`,
    fecha_registro: new Date().toISOString(),
    dispositivo: 'desktop',
  }
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    const tag = json.duplicado ? 'ya existía (mismo ID o email)' : 'insertada'
    console.log(`${json.ok ? 'OK ' : 'ERR'}  ${payload.id} · ${payload.campamento} · ${payload.nombre} ${payload.apellido} → ${tag}`)
    if (!json.ok) console.error('  detalle:', json.error)
  } catch (err) {
    console.error(`FAIL ${payload.id} · ${payload.campamento}:`, err.message)
  }
}
console.log('Listo.')
