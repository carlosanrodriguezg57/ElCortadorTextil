document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("/get-nav");
    if (!response.ok) throw new Error("Error cargando navbar");
    const html = await response.text();
    document.getElementById("navbar").innerHTML = html;
  } catch (error) {
    console.error("Error al cargar el navbar:", error);
  }
});
// Escucha cualquier click en el documento, incluso si el botón se inyecta después
document.addEventListener("click", async (ev) => {
  if (ev.target && ev.target.id === "btnLogout") {
    ev.preventDefault();
    console.log("DEBUG: clic detectado en btnLogout (delegado)");

    try {
      const res = await fetch("/logout", {
        method: "POST",
        credentials: "include",
      });
      console.log("DEBUG: respuesta logout", res.status);

      if (res.ok) {
        window.location.href = "/";
      } else {
        alert("Error cerrando sesión.");
      }
    } catch (err) {
      console.error("DEBUG: error en fetch logout", err);
      alert("No se pudo conectar con el servidor.");
    }
  }
});



