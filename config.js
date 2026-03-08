// Detecta la IP o Hostname actual desde la barra de direcciones del navegador
const currentHost = window.location.hostname;

// Construye la URL base usando el mismo host y el puerto 3000
export const API_BASE_URL = `http://${currentHost}:3000`;

console.log("Conectado a la API en:", API_BASE_URL);