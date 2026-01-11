// Detecta si se está ejecutando localmente o en red
const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";

export const API_BASE_URL = isLocal
  ? "http://localhost:3000"      // Si estás en tu PC
  : "http://192.168.2.4:3000";   // Si accedes desde la red
