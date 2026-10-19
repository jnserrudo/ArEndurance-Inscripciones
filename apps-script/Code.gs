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
 * Pendiente / Confirmado / Pagó / Cancelado. La hoja "Resumen" cuenta todo sola.
 */
var HOJA = 'Inscripciones';
var COLUMNAS = [
  'id', 'fecha_registro', 'estado', 'nombre', 'apellido', 'edad', 'email', 'telefono', 'instagram',
  'nivel', 'disciplinas', 'antecedentes_deportivos', 'objetivo_corto', 'objetivo_mediano',
  'lesiones', 'detalle_lesiones', 'condiciones_medicas', 'alimentacion',
  'contacto_emergencia_nombre', 'contacto_emergencia_telefono',
  'talle_remera', 'alojamiento', 'comentarios', 'acepta_terminos', 'dispositivo'
];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(HOJA) || ss.insertSheet(HOJA);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNAS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold').setBackground('#0d3a38').setFontColor('#ffffff');
    var col = COLUMNAS.indexOf('estado') + 1;
    sheet.getRange(2, col, 1000, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(['Pendiente', 'Confirmado', 'Pagó', 'Cancelado'], true).build()
    );
    armarResumen_(ss);
  }
  return sheet;
}

function armarResumen_(ss) {
  var r = ss.getSheetByName('Resumen') || ss.insertSheet('Resumen');
  r.clear();
  var est = 'Inscripciones!' + String.fromCharCode(64 + COLUMNAS.indexOf('estado') + 1) + ':' + String.fromCharCode(64 + COLUMNAS.indexOf('estado') + 1);
  var niv = 'Inscripciones!' + String.fromCharCode(64 + COLUMNAS.indexOf('nivel') + 1) + ':' + String.fromCharCode(64 + COLUMNAS.indexOf('nivel') + 1);
  var les = 'Inscripciones!' + String.fromCharCode(64 + COLUMNAS.indexOf('lesiones') + 1) + ':' + String.fromCharCode(64 + COLUMNAS.indexOf('lesiones') + 1);
  var idc = 'Inscripciones!A:A';
  r.getRange('A1:B1').setValues([['Resumen TriCamp', '']]).setFontWeight('bold');
  r.getRange('A3:B12').setFormulas([
    ['Total de inscriptos', '=MAX(0,COUNTA(' + idc + ')-1)'],
    ['Pendientes', '=COUNTIF(' + est + ',"Pendiente")'],
    ['Confirmados', '=COUNTIF(' + est + ',"Confirmado")'],
    ['Pagaron', '=COUNTIF(' + est + ',"Pagó")'],
    ['Cancelados', '=COUNTIF(' + est + ',"Cancelado")'],
    ['Nivel: Principiante', '=COUNTIF(' + niv + ',"Principiante")'],
    ['Nivel: Intermedio', '=COUNTIF(' + niv + ',"Intermedio")'],
    ['Nivel: Avanzado', '=COUNTIF(' + niv + ',"Avanzado")'],
    ['Nivel: Competitivo', '=COUNTIF(' + niv + ',"Competitivo")'],
    ['Con lesión actual', '=COUNTIF(' + les + ',"Sí, actualmente")']
  ]);
  r.setColumnWidth(1, 220);
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
    var fila = COLUMNAS.map(function (c) {
      var v = data[c];
      if (Array.isArray(v)) v = v.join(', ');
      if (v === undefined || v === null) v = '';
      // Evita que se interprete como fórmula
      if (typeof v === 'string' && /^[=+\-@]/.test(v)) v = "'" + v;
      return v;
    });
    sheet.appendRow(fila);
    if (repetido) sheet.getRange(sheet.getLastRow(), 1, 1, COLUMNAS.length).setBackground('#fff3cd');
    return json_({ ok: true, id: data.id, duplicado: repetido });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput('TriCamp API OK');
}
