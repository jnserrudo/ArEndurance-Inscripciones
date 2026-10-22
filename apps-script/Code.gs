/**
 * TriCamp del Endurance - Receptor de inscripciones -> Google Sheets
 * 1) Creá una Google Sheet y abrí Extensiones > Apps Script.
 * 2) Pegá este código y guardá.
 * 3) Implementar > Nueva implementación > Tipo: Aplicación web
 *    Ejecutar como: Yo  |  Quién tiene acceso: Cualquier persona
 * 4) Copiá la URL /exec en tricamp-app/.env como VITE_SHEETS_URL y reiniciá el servidor.
 * 5) Si modificás este código, hay que crear una NUEVA implementación (o "Administrar implementaciones" > editar > nueva versión).
 *
 * Seguimiento: la columna "estado" (primera después del ID) la editás vos a mano:
 * Pendiente / Confirmado / Pagó / Cancelado.
 * La hoja "Resumen" usa fórmulas COUNTIF: se actualiza sola al editar o borrar filas.
 * Si querés regenerarla ya, ejecutá la función actualizarResumen() desde el editor.
 */
var HOJA = 'Inscripciones';
// Claves internas: coinciden con el payload que manda la app. NO cambiar el orden.
var COLUMNAS = [
  'id', 'fecha_registro', 'estado', 'campamento', 'nombre', 'apellido', 'edad', 'email', 'telefono', 'instagram',
  'nivel', 'disciplinas', 'antecedentes_deportivos', 'objetivo_corto', 'objetivo_mediano',
  'lesiones', 'detalle_lesiones', 'condiciones_medicas', 'alimentacion',
  'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
  'talle_remera', 'alojamiento', 'comentarios', 'acepta_terminos', 'dispositivo'
];
// Lo que se ve como encabezado en la hoja, en el mismo orden que COLUMNAS.
var ETIQUETAS = [
  'ID', 'Fecha de registro', 'Estado', 'Campamento', 'Nombre', 'Apellido', 'Edad', 'Correo electrónico',
  'Teléfono / WhatsApp', 'Instagram', 'Nivel', 'Disciplinas', 'Antecedentes deportivos',
  'Objetivo a corto plazo', 'Objetivo a mediano plazo', 'Lesiones', 'Detalle de lesiones',
  'Condiciones médicas / alergias / medicación', 'Restricciones alimentarias',
  'Contacto de emergencia', 'Tel. de emergencia', 'Talle de remera', 'Alojamiento',
  'Comentarios', 'Aceptó términos', 'Dispositivo'
];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  if (sheet.getLastRow() === 0) {
    escribirEncabezados_(sheet);
    sheet.setFrozenRows(1);
    var col = COLUMNAS.indexOf('estado') + 1;
    sheet.getRange(2, col, 1000, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['Pendiente', 'Confirmado', 'Pagó', 'Cancelado'], true).build()
    );
    actualizarResumen_(ss);
  } else {
    // Si la hoja ya existía con encabezados viejos, inserta las columnas que falten
    // en su posición correcta (los datos viejos quedan alineados con el nuevo orden).
    if (migrarEncabezados_(sheet)) {
      normalizarFilas_(sheet);
      actualizarResumen_(ss);
    }
  }
  return sheet;
}

// Acomoda valores de filas cargadas con el formato viejo:
// booleans -> "Sí"/"No" y fecha ISO -> dd/mm/yyyy hh:mm.
function normalizarFilas_(sheet) {
  var filas = sheet.getLastRow() - 1;
  if (filas < 1) return;
  var cols = sheet.getLastColumn();
  var rango = sheet.getRange(2, 1, filas, cols);
  var datos = rango.getValues();
  var iFecha = COLUMNAS.indexOf('fecha_registro');
  var iTerminos = COLUMNAS.indexOf('acepta_terminos');
  var tz = sheet.getParent().getSpreadsheetTimeZone();
  datos.forEach(function (f) {
    var v = f[iTerminos];
    if (v === true || v === 'true' || v === 'TRUE') f[iTerminos] = 'Sí';
    if (v === false || v === 'false' || v === 'FALSE') f[iTerminos] = 'No';
    var d = f[iFecha];
    // Detecta ISO 8601 y la formatea; si ya está en otro formato no la toca
    if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(d)) {
      f[iFecha] = Utilities.formatDate(new Date(d), tz, 'dd/MM/yyyy HH:mm');
    }
  });
  rango.setValues(datos);
}

function escribirEncabezados_(sheet) {
  sheet.getRange(1, 1, 1, ETIQUETAS.length)
    .setValues([ETIQUETAS])
    .setFontWeight('bold').setBackground('#0d3a38').setFontColor('#ffffff');
}

// Devuelve true si tuvo que insertar columnas nuevas.
function migrarEncabezados_(sheet) {
  var cambio = false;
  var actuales = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  COLUMNAS.forEach(function (name, idx) {
    if (actuales.indexOf(name) === -1 && actuales.indexOf(ETIQUETAS[idx]) === -1) {
      sheet.insertColumnBefore(idx + 1);
      actuales.splice(idx, 0, '');
      cambio = true;
    }
  });
  // Renombra todo a las etiquetas legibles (cubre encabezados viejos tipo snake_case)
  var renombrado = ETIQUETAS.some(function (et, i) { return actuales[i] !== et; });
  if (renombrado) escribirEncabezados_(sheet);
  return cambio || renombrado;
}

// Devuelve la letra A1 de una columna 1-based (1 -> A, 27 -> AA).
function colLetter_(c) {
  var s = '';
  while (c > 0) { var m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); }
  return s;
}

// El resumen usa FÓRMULAS en vivo (COUNTA / SUMPRODUCT): se actualizan solas al editar
// o BORRAR filas. Borrar una fila no dispara el trigger onEdit, así que con
// valores calculados por el script el resumen quedaba desactualizado.
function actualizarResumen_(ss) {
  var r = ss.getSheetByName('Resumen') || ss.insertSheet('Resumen');
  var ref = function (colName) {
    var letra = colLetter_(COLUMNAS.indexOf(colName) + 1);
    return "'" + HOJA + "'!" + letra + '2:' + letra;
  };
  // SUMPRODUCT con UN solo argumento: no usa separador , ni ;, así funciona
  // igual en hojas con locale español (donde COUNTIF con "," da #ERROR!).
  var cuenta = function (colName, val) { return '=SUMPRODUCT(--(' + ref(colName) + '="' + val + '"))'; };
  r.clear();
  r.getRange('A1:B1').setValues([['Resumen AR Endurance Camps', '']]).setFontWeight('bold');
  r.getRange('A2').setValue('Conteos en vivo: se actualiza solo al editar o borrar filas.')
    .setFontSize(9).setFontColor('#5c6563');
  r.getRange('A4:A15').setValues([
    ['Total de inscriptos'], ['TriCamp'], ['TrailCamp'],
    ['Pendientes'], ['Confirmados'], ['Pagaron'], ['Cancelados'],
    ['Nivel: Principiante'], ['Nivel: Intermedio'], ['Nivel: Avanzado'], ['Nivel: Competitivo'],
    ['Con lesión actual']
  ]).setFontWeight('bold');
  r.getRange('B4:B15').setFormulas([
    ['=COUNTA(' + ref('id') + ')'],
    [cuenta('campamento', 'TriCamp')],
    [cuenta('campamento', 'TrailCamp')],
    [cuenta('estado', 'Pendiente')],
    [cuenta('estado', 'Confirmado')],
    [cuenta('estado', 'Pagó')],
    [cuenta('estado', 'Cancelado')],
    [cuenta('nivel', 'Principiante')],
    [cuenta('nivel', 'Intermedio')],
    [cuenta('nivel', 'Avanzado')],
    [cuenta('nivel', 'Competitivo')],
    [cuenta('lesiones', 'Sí, actualmente')]
  ]);
  r.setColumnWidth(1, 220);
}

// Ejecutable a mano desde el editor para regenerar el resumen ahora mismo.
function actualizarResumen() {
  actualizarResumen_(SpreadsheetApp.getActiveSpreadsheet());
}

// Al editar "Inscripciones" reescribe las fórmulas del Resumen por si alguien
// las borró. Los conteos igual se actualizan solos (son fórmulas en vivo).
function onEdit(e) {
  if (!e) return;
  var sh = e.range.getSheet();
  if (sh.getName() === HOJA) actualizarResumen_(sh.getParent());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet_();
    var ids = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat() : [];

    // Si el mismo envío llega dos veces (reintento), no se duplica
    if (ids.indexOf(data.id) !== -1) return json_({ ok: true, id: data.id, duplicado: true });

    // Aviso si el mismo correo ya estaba inscripto (se guarda igual, para que decidas vos)
    var colEmail = COLUMNAS.indexOf('email') + 1;
    var emails = sheet.getLastRow() > 1 ? sheet.getRange(2, colEmail, sheet.getLastRow() - 1, 1).getValues().flat() : [];
    var repetido = emails.some(function (m) { return String(m).toLowerCase() === String(data.email).toLowerCase(); });

    data.estado = 'Pendiente';
    var tz = sheet.getParent().getSpreadsheetTimeZone();
    var fila = COLUMNAS.map(function (c) {
      var v = data[c];
      if (Array.isArray(v)) v = v.join(', ');
      if (typeof v === 'boolean') v = v ? 'Sí' : 'No';
      if (v === undefined || v === null) v = '';
      // Evita que se interprete como fórmula
      if (typeof v === 'string' && /^[=+\-@]/.test(v)) v = "'" + v;
      return v;
    });
    // Fecha legible: dd/mm/yyyy hh:mm según la zona horaria de la hoja
    var iFecha = COLUMNAS.indexOf('fecha_registro');
    if (data.fecha_registro) {
      fila[iFecha] = Utilities.formatDate(new Date(data.fecha_registro), tz, 'dd/MM/yyyy HH:mm');
    }
    sheet.appendRow(fila);
    if (repetido) sheet.getRange(sheet.getLastRow(), 1, 1, COLUMNAS.length).setBackground('#fff3cd');
    actualizarResumen_(sheet.getParent());
    return json_({ ok: true, id: data.id, duplicado: repetido });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('AR Endurance Camps API v3');
}
