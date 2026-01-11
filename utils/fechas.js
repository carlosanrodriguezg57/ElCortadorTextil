// utils/fechas.js
// Formatea a "dd/mm/yyyy hh:mm:ss" usando la zona horaria indicada (por defecto, America/Bogota)

export function formatFecha(value, tz = "America/Bogota") {
  if (!value) return null;

  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  const fmt = new Intl.DateTimeFormat("es-CO", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  // Ensamblar exactamente dd/mm/yyyy hh:mm:ss
  const parts = fmt.formatToParts(d);
  const get = (t) => parts.find(p => p.type === t)?.value ?? "";

  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`;
}

// Aplica formatFecha a un conjunto de filas y campos de fecha específicos
export function mapDateFields(rows, fields, tz = "America/Bogota") {
  return rows.map(row => {
    const out = { ...row };
    for (const f of fields) {
      if (f in out) out[f] = formatFecha(out[f], tz);
    }
    return out;
  });
}
