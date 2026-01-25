// servidor.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { pool } from "./db.js"; // asegúrate que tienes un archivo db.js que exporte el pool
import path from "path";
import { fileURLToPath } from "url";
import { formatFecha, mapDateFields } from "./utils/fechas.js";
import session from "express-session";

import multer from "multer";
import fs from "fs";

// Carpeta donde se guardarán los archivos
const uploadDir = path.join(process.cwd(), "uploads");

// Si no existe, créala
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${Date.now()}-${file.fieldname}${ext}`;
    cb(null, fileName);
  },
});

// Filtro opcional (solo pdf o imagen)
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "application/pdf"];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Solo se permiten imágenes o PDF"));
};

export const upload = multer({ storage, fileFilter });

const app = express();

// CONFIGURAR SESION
app.use(session({
  secret: "clave_super_secreta", 
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 horas de sesión
}));

// middleware
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    // 🔁 Redirigir a login.html en vez de enviar JSON
    return res.sendFile(path.join(__dirname, "public","login.html"));
  }
  next();
}
// middleware/requireRole.js
export function requireRole(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.session?.user) {
      return res.redirect("/"); // no hay sesión, redirige al login
    }

    const rolUsuario = req.session.user.rol;

    // Si el rol está dentro de los permitidos o es admin, continúa
    if (rolUsuario === "administrador" || rolesPermitidos.includes(rolUsuario)) {
      return next();
    }

    // ❌ Si no tiene permisos
    console.warn(`Acceso denegado para el rol: ${rolUsuario} en ${req.originalUrl}`);
    return res.status(403).sendFile("public/no_autorizado.html", { root: "." });
  };
}


// Validar sesion al recargar pagina
app.get("/api/check-session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//Rutas a los html
// 🟩 Acceso para todos los roles (si están logueados)
// Ruta protegida para incluir el navbar
app.get("/config.js", (req,res)=>{
  const configPath = path.join(__dirname, "config.js");
  res.type("application/javascript");
  fs.createReadStream(configPath).pipe(res);
});
app.get("/get-nav", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "includes", "nav.html"));
});
app.get("/js/include-nav.js", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "js", "include-nav.js"));
});
app.get("/home", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Home.html"));
});

// 🟦 Solo roles específicos (y administrador)
app.get("/corte", requireLogin, requireRole(["corte","recepcion","fusionado"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "corte.html"));
});

app.get("/cortes_tiquete", requireLogin, requireRole(["corte","recepcion","fusionado"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Cortes a tiquetear.html"));
});

app.get("/recepcion", requireLogin, requireRole(["corte","recepcion","fusionado"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Recepción.html"));
});

app.get("/ticketeado", requireLogin, requireRole(["corte","recepcion","fusionado"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "ticketeado.html"));
});

// 🟪 Rutas exclusivas del admin
app.get("/crear_usuarios", requireLogin, requireRole(["administrador"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "crear_usuarios.html"));
});
app.get("/crear_clientes", requireLogin, requireRole(["administrador"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "crear_cliente.html"));
});

app.get("/reportes_cortes", requireLogin, requireRole(["administrador"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Reporte.html"));
});

app.get("/remision", requireLogin, requireRole(["administrador"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Remisión.html"));
});

app.get("/cortes_reporte", requireLogin, requireRole(["administrador"]), (req, res) => {
  res.sendFile(path.join(__dirname, "public", "cortes_reporte.html"));
});
app.get("/ordenes", requireLogin, requireRole(["administrador"]),(req, res) => {
  res.sendFile(path.join(__dirname, "public", "Ordenes.html"));
});
// Servir manifest.json
app.get("/manifest.json", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "manifest.json"));
});

// Servir service worker (requiere un header especial)
app.get("/service-worker.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.sendFile(path.join(__dirname, "public", "service-worker.js"));
});


app.get("/archivo/:nombre", requireLogin, (req, res) => {
  const nombreArchivo = req.params.nombre;
  const ruta = path.join(__dirname, "uploads", nombreArchivo);

  if (!fs.existsSync(ruta)) {
    return res.status(404).send("Archivo no encontrado");
  }

  res.sendFile(ruta);
});


dotenv.config();

app.use(cors({
  origin:[
    "http://192.168.2.4:3000",
    "http://localhost:3000"
  ],
  credentials: true
}));
app.use(express.json());

//Verificar sesion al recargar
app.get("/api/session", (req, res) => {
  if (req.session.user) {
    res.json({ logged: true, user: req.session.user });
  } else {
    res.json({ logged: false });
  }
});


// Redirigir la raíz "/" hacia login.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});


/* ==========================================================
   LOGIN y LOGOUT DE USUARIOS
========================================================== */
app.post("/api/login", async (req, res) => {
  const { usuario, contrasena } = req.body;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM usuarios WHERE usuario = ?",
      [usuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "El usuario ingresado no existe" });
    }

    const user = rows[0];
    const match = await bcrypt.compare(contrasena, user.contraseña);
    

    if (!match) {
      return res
        .status(401)
        .json({ mensaje: "Contraseña incorrecta, intente de nuevo" });
    }
    req.session.user = { id: user.id, nombre: user.nombre, rol: user.rol };
    return res.json({ ok: true, user: req.session.user });
  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

app.post("/logout", (req, res) => {
  try {
    // Si usas express-session:
    req.session.destroy(err => {
      if (err) {
        console.error("❌ Error al cerrar sesión:", err);
        return res.status(500).json({ error: "Error al cerrar sesión" });
      }
      res.clearCookie("connect.sid"); // Limpia la cookie de sesión
      res.json({ success: true });
    });
  } catch (err) {
    console.error("❌ Error general al cerrar sesión:", err);
    res.status(500).json({ error: "Error al cerrar sesión" });
  }
});

/* ==========================================================
   CREAR USUARIO
========================================================== */
app.post("/api/usuarios", async (req, res) => {
  const { nombre, cedula, telefono, cargo, usuario, contrasena } = req.body;

  try {
    const hash = await bcrypt.hash(contrasena, 10);

    await pool.query(
      `INSERT INTO usuarios (nombre, cedula, telefono, rol, usuario, contraseña)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, cedula, telefono, cargo, usuario, hash]
    );

    res.json({ mensaje: "Usuario creado exitosamente" });
  } catch (err) {
    console.error("❌ Error al crear usuario:", err);
    res.status(500).json({ mensaje: "Error al crear el usuario" });
  }
});

/* ==========================================================
   CREAR CLIENTES
========================================================== */
app.post("/api/crear-clientes", async (req, res) => {
  const { nombre, contacto, telefono, NIT} = req.body;

  try {
    await pool.query(
      `INSERT INTO clientes (nombre_empresa, nombre_contacto, numero, nit)
       VALUES (?, ?, ?, ?)`,
      [nombre, contacto, telefono, NIT]
    );

    res.json({ mensaje: "Cliente creado exitosamente" });
  } catch (err) {
    console.error("❌ Error al crear cliente:", err);
    res.status(500).json({ mensaje: "Error al crear el cliente" });
  }
});

/* ==========================================================
   CREAR ORDENES
========================================================== */
app.post("/api/ordenes", requireLogin, upload.single("fichaTecnica"), async (req, res) => {
  const usuario_id = req.session.user.id;
  const c = await pool.getConnection();
  try {
    const {
      cliente,
      categoria,
      fecha_programada,
      tipo_prenda,
      muestra_fisica = false,
      fusionado = false,
      tiqueteado = false,
      separar_bordado_estampado = false,
      perforaciones = false,
      liquidar_tela = false,
      cantidad_piezas = null,
      observaciones = "",
      referencia = "",
      N_piezas_TP,
      N_piezas_forro,
      N_piezas_fusionado
    } = req.body;

    // Si se subió archivo, lo tomamos
    const archivo = req.file ? req.file.filename : null;

    let matriz = [];
    try {
      matriz = JSON.parse(req.body.matriz || "[]");
    } catch (err) {
      return res.status(400).json({ error: "Error al interpretar matriz" });
    }


    if (!fecha_programada) {
      return res.status(400).json({ error: "fecha_programada es requerida" });
    }
    if (!referencia) {
      return res.status(400).json({ error: "Referencia es requerida" });
    }
    if (!Array.isArray(matriz) || matriz.length === 0) {
      return res
        .status(400)
        .json({ error: "matriz es requerida y no puede estar vacía" });
    }

    const total_unidades = matriz.reduce((acc, fila) => {
      const cantidades = Object.values(fila.tallas || {}).map(
        (n) => Number(n) || 0
      );
      return acc + cantidades.reduce((a, b) => a + b, 0);
    }, 0);
    const cantidad_materiales = matriz.length;

    function toBool(val) {
      return val === true || val === "true" || val === 1 || val === "1";
    }


    await c.beginTransaction();

    const insertOrdenSQL = `
      INSERT INTO ORDENES (
        cliente_id, categoria, fecha_programada, total_unidades, tipo_prenda,
        muestra_fisica, fusionado, tiqueteado, separar_bordado_estampado,
        perforaciones, liquidar_tela, cantidad_piezas, cantidad_materiales,
        observaciones, referencia, usuario_id, cantidad_piezas_telaprincipal, 
        cantidad_piezas_forro, cantidad_piezas_fusionado, archivo
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?,?
      );
    `;
    const [resultOrden] = await c.execute(insertOrdenSQL, [
      cliente || null,
      categoria || null,
      fecha_programada,
      total_unidades,
      tipo_prenda || null,
      toBool(muestra_fisica),
      toBool(fusionado),
      toBool(tiqueteado),
      toBool(separar_bordado_estampado),
      toBool(perforaciones),
      toBool(liquidar_tela),
      cantidad_piezas !== null ? Number(cantidad_piezas) : null,
      cantidad_materiales,
      observaciones || null,
      referencia || null,
      usuario_id || null,
      N_piezas_TP !== null ? Number(N_piezas_TP) : null,
      N_piezas_forro !== null ? Number(N_piezas_forro) : null,
      N_piezas_fusionado !== null ? Number(N_piezas_fusionado) : null,
      archivo
    ]);

    const [[rowId]] = await c.query(
      `SELECT id FROM ORDENES WHERE id = LAST_INSERT_ID();`
    );
    const ordenId = rowId?.id;
    if (!ordenId) throw new Error("No se pudo recuperar el ID de la orden");

    const insertDetalleSQL = `
      INSERT INTO DETALLES_ORDENES
      (tallas, cantidad, material_id, color, unidireccional, ordenes_id)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    for (const fila of matriz) {
      const color = (fila.tela_color || "").trim();
      for (const [talla, cant] of Object.entries(fila.tallas || {})) {
        const cantidad = Number(cant) || 0;
        if (cantidad <= 0) continue;
        await c.execute(insertDetalleSQL, [
          talla,
          cantidad,
          null,
          color,
          false,
          ordenId
        ]);
      }
    }

    await c.commit();
    return res.status(201).json({ ok: true, orden_id: ordenId });
  } catch (err) {
    await c.rollback();
    console.error(err);
    return res
      .status(500)
      .json({ error: "Error creando la orden", detail: err.message });
  } finally {
    c.release();
  }
});

/* ==========================================================
   BORRAR ORDENES
========================================================== */

app.delete("/api/ordenes/:id", requireLogin, async (req, res) => {
  const ordenId = req.params.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 🔹 Eliminar detalle_ordenes (hija)
    await conn.query("DELETE FROM detalles_ordenes WHERE ordenes_id = ?", [ordenId]);

    // 🔹 Eliminar cortes relacionados
    const [cortes] = await conn.query("SELECT id FROM cortes WHERE ordenes_id = ?", [ordenId]);
    const corteIds = cortes.map(c => c.id);
    if (corteIds.length) {
      // Borrar detalles de cortes
      await conn.query("DELETE FROM detalles_cortes WHERE cortes_id IN (?)", [corteIds]);
      // Borrar controles de calidad asociados a esos cortes
      const [cc] = await conn.query("SELECT id FROM control_calidad WHERE cortes_id IN (?)", [corteIds]);
      const ccIds = cc.map(c => c.id);
      if (ccIds.length) {
        await conn.query("DELETE FROM detalle_control_calidad WHERE control_calidad_id IN (?)", [ccIds]);
        await conn.query("DELETE FROM control_calidad WHERE id IN (?)", [ccIds]);
      }
      // Borrar los cortes mismos
      await conn.query("DELETE FROM cortes WHERE id IN (?)", [corteIds]);
    }

    // 🔹 Finalmente eliminar la orden
    await conn.query("DELETE FROM ordenes WHERE id = ?", [ordenId]);

    await conn.commit();
    res.json({ success: true, message: "Orden y registros asociados eliminados correctamente." });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error eliminando orden:", err);
    res.status(500).json({ error: "Error eliminando orden" });
  } finally {
    conn.release();
  }
});


/* ==========================================================
   MOSTRAR ORDENES
========================================================== */

app.get("/api/ordenes", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          o.id,
          o.categoria,
          o.created_date,
          o.fecha_programada,
          o.tipo_prenda,
          o.referencia,
          o.cantidad_piezas,
          o.cantidad_materiales,
          o.muestra_fisica,
          o.fusionado,
          o.tiqueteado,
          o.separar_bordado_estampado,
          o.perforaciones,
          o.liquidar_tela,
          o.observaciones,
          o.usuario_id,
          o.estado,
          o.archivo,
          c.nombre_empresa AS cliente_nombre
       FROM ORDENES o
       LEFT JOIN CLIENTES c ON o.cliente_id = c.id
       WHERE o.estado = 'Activo'
       ORDER BY o.created_date ASC`
    );
    const data = mapDateFields(rows, ["created_date", "fecha_programada"]);
    res.json(data);
  } catch (err) {
    console.error("❌ Error obteniendo órdenes:", err);
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});

/* ==========================================================
   MOSTRAR CLIENTES DESPLEGABLE
========================================================== */
app.get("/api/clientes", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, nombre_empresa FROM CLIENTES ORDER BY nombre_empresa"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error consultando clientes:", err);
    res.status(500).json({ mensaje: "Error obteniendo clientes" });
  }
});

/* ==========================================================
   MOSTRAR DETALLE POR ORDEN
========================================================== */

// GET /api/ordenes/:id/completo  -> { orden, columnasTallas, matriz }
app.get("/api/ordenes/:id/completo", async (req, res) => {
  const { id } = req.params;
  try {
    // Orden + nombre cliente
    const [[orden]] = await pool.query(
      `SELECT o.*, c.nombre_empresa AS cliente_nombre, usu.nombre AS usuario_nombre
       FROM ORDENES o
       LEFT JOIN CLIENTES c ON c.id = o.cliente_id
       LEFT JOIN USUARIOS usu ON o.usuario_id = usu.id
       WHERE o.id = ?`,
      [id]
    );
    if (!orden) return res.status(404).json({ error: "Orden no encontrada" });

    // Detalles (tal cual están planificados)
    const [det] = await pool.query(
      `SELECT color, tallas, cantidad
       FROM DETALLES_ORDENES
       WHERE ordenes_id = ?
       ORDER BY color, tallas`,
      [id]
    );

    // Columnas de tallas (todas las que existan en la orden)
    const columnasTallas = [...new Set(det.map(d => d.tallas))];

    // Matriz agrupada por color: { color, tallas: {T1:cant,...} }
    const porColor = {};
    det.forEach(d => {
      if (!porColor[d.color]) porColor[d.color] = {};
      porColor[d.color][d.tallas] = d.cantidad;
    });
    const matriz = Object.entries(porColor).map(([color, tallas]) => ({ color, tallas }));

    res.json({ orden, columnasTallas, matriz });
  } catch (err) {
    console.error("❌ /api/ordenes/:id/completo", err);
    res.status(500).json({ error: "Error obteniendo la orden" });
  }
});

/* ==========================================================
   CREAR CORTES
========================================================== */
app.post("/api/cortes", requireLogin, async (req, res) => {
  const usuario_id = req.session.user.id;
  const c = await pool.getConnection();
  try {
    const {
      ordenes_id,
      observaciones = "",
      matriz = [],
      N_piezas_TP,
      N_piezas_forro,
      N_piezas_fusionado // [{ color:"Azul", tallas:{S:10, M:5}}, ...]
    } = req.body;

    // 1) Obtener datos de la orden relacionada
    const [[orden]] = await c.query(
      "SELECT cliente_id, fecha_programada FROM ORDENES WHERE id = ?",
      [ordenes_id]
    );
    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    // 2) Calcular totales
    const total_unidades = matriz.reduce((acc, fila) => {
      return acc + Object.values(fila.tallas || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    }, 0);
    const cantidad_tallas = matriz.reduce((acc, fila) => {
      return acc + Object.keys(fila.tallas || {}).length;
    }, 0);

    await c.beginTransaction();

    // 3) Insertar en CORTES
    const insertCorteSQL = `
      INSERT INTO CORTES (
        cliente_id, fecha_programada, cantidad_tallas,
        total_unidades, observaciones, ordenes_id, usuario_id, cantidad_piezas_telaprincipal, cantidad_piezas_forro, cantidad_piezas_fusionado
      ) VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?)
    `;

    const [resultCorte] = await c.execute(insertCorteSQL,[
      orden.cliente_id,
      orden.fecha_programada,
      cantidad_tallas,
      total_unidades,
      observaciones,
      ordenes_id,
      usuario_id,
      N_piezas_TP,
      N_piezas_forro,
      N_piezas_fusionado
    ]);

    const corteId = resultCorte.insertId; // o usa tu trigger/PK según tengas

    // 4) Insertar detalles en DETALLES_CORTES
    const insertDetalleSQL = `
      INSERT INTO DETALLES_CORTES
      (tallas, cantidad, material_id, color, cortes_id)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const fila of matriz) {
      const color = (fila.color || "").trim();
      for (const [talla, cant] of Object.entries(fila.tallas || {})) {
        const cantidad = Number(cant) || 0;
        if (cantidad <= 0) continue;

        await c.execute(insertDetalleSQL, [
          talla,
          cantidad,
          null, // material_id (lo llenas luego si lo usas)
          color,
          corteId
        ]);
      }
    }

    // 5) Insertar detalles de liquidación (si existen)
    if (Array.isArray(req.body.matrizLiquidacion) && req.body.matrizLiquidacion.length > 0) {
      const insertLiqSQL = `
        INSERT INTO LIQUIDACION 
        (numero_rollo, tipo_tela, metros_ticket, color, largo_capa, cantidad_capas, 
        n_retazos, metraje_retazos, sesgo, corte_id )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      for (const fila of req.body.matrizLiquidacion) {
        await c.execute(insertLiqSQL, [
          fila.numero_rollo,
          fila.tipo_tela,
          fila.metros_ticket,
          fila.color,
          fila.largo_capa,
          fila.cantidad_capas,
          fila.n_retazos,
          fila.metraje_retazos,
          fila.sesgo,
          corteId
        ]);
      }
    }

    await c.query(`UPDATE ORDENES SET estado = 'Cerrado' WHERE id = ?`, [ordenes_id])

    await c.commit();
    return res.status(201).json({ ok: true, corte_id: corteId });

  } catch (err) {
    await c.rollback();
    console.error("❌ Error creando corte:", err);
    return res.status(500).json({ error: "Error creando corte", detail: err.message });
  } finally {
    c.release();
  }
});

/* ==========================================================
   MOSTRAR CORTES
========================================================== */

app.get("/api/cortes", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
          c.id,
          c.created_date,
          c.fecha_programada,
          c.cantidad_tallas,
          c.total_unidades,
          c.observaciones,
          c.usuario_id,
          c.ordenes_id,
          c.cliente_id,
          cli.nombre_empresa AS cliente_nombre,
          ord.referencia as referencia,
          ord.tipo_prenda as tipo_prenda
       FROM CORTES c
       LEFT JOIN CLIENTES cli ON c.cliente_id = cli.id
       LEFT JOIN ORDENES ord ON c.ordenes_id = ord.id
       WHERE c.estado = 'Activo'
       ORDER BY c.created_date ASC`
    );

    const data = mapDateFields(rows, ["created_date", "fecha_programada"]);
    res.json(data);
  } catch (err) {
    console.error("❌ Error obteniendo cortes:", err);
    res.status(500).json({ error: "Error obteniendo cortes" });
  }
});


/* ==========================================================
   MOSTRAR DETALLE CORTES
========================================================== */

app.get("/api/cortes/:id", async (req, res) => {
  const corteId = req.params.id;
  console.log("🧠 ID recibido:", corteId);

  try {
    const [rows] = await pool.query(
      `SELECT 
          c.id,
          c.created_date,
          c.fecha_programada,
          c.cantidad_tallas,
          c.total_unidades,
          c.observaciones,
          c.ordenes_id,
          c.cliente_id,
          c.usuario_id,
          c.ordenes_id,
          cli.nombre_empresa AS cliente_nombre,
          usu.nombre AS usuario_nombre,
          ord.referencia AS referencia,
          ord.observaciones AS observacionesOrden
       FROM CORTES c
       LEFT JOIN CLIENTES cli ON c.cliente_id = cli.id
       LEFT JOIN USUARIOS usu ON c.usuario_id = usu.id
       LEFT JOIN ORDENES ord ON c.ordenes_id = ord.id
       WHERE c.id = ?`,
      [corteId]
    );

    console.log("📦 Corte encontrado:", rows);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Corte no encontrado" });
    }

    const corte = rows[0];

    const [det] = await pool.query(
      `SELECT color, tallas, cantidad
       FROM DETALLES_CORTES
       WHERE cortes_id = ?
       ORDER BY color, tallas`,
      [corteId]
    );

    console.log("📊 Detalles encontrados:", det);

    const columnasTallas = [...new Set(det.map(d => d.tallas))];
    const porColor = {};
    det.forEach(d => {
      if (!porColor[d.color]) porColor[d.color] = {};
      porColor[d.color][d.tallas] = d.cantidad;
    });
    const matriz = Object.entries(porColor).map(([color, tallas]) => ({ color, tallas }));

    res.json({ corte, columnasTallas, matriz });

  } catch (err) {
    console.error("❌ Error al obtener corte:", err);
    res.status(500).json({ error: "Error al obtener los datos del corte" });
  }
});

/* ==========================================================
   CREAR TICKETEADO CON DETALLE
========================================================== */
app.post("/api/control_calidad", requireLogin, async (req, res) => {
  const usuario_id = req.session.user.id;
  const {
    corte_id,
    chkPiezas,
    chkPrendas,
    chkCorteLimpio,
    chkEsquinas,
    chkMarras,
    observaciones,
    matriz // 🧩 matriz editable enviada desde el front
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1️⃣ Insertar registro principal
    const [result] = await conn.query(
      `INSERT INTO CONTROL_CALIDAD
       (corte_id, chk_piezas, chk_prendas, chk_corte_limpio, chk_esquinas, chk_marras, observaciones, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?,?)`,
      [corte_id, chkPiezas, chkPrendas, chkCorteLimpio, chkEsquinas, chkMarras, observaciones,usuario_id]
    );

    const controlId = result.insertId; // id generado del control principal

    // 2️⃣ Insertar detalles
    if (Array.isArray(matriz)) {
      for (const fila of matriz) {
        const { color, tallas } = fila;
        for (const [talla, cantidad] of Object.entries(tallas)) {
          await conn.query(
            `INSERT INTO DETALLE_CONTROL_CALIDAD
             (control_calidad_id, color, talla, cantidad)
             VALUES (?, ?, ?, ?)`,
            [controlId, color, talla, cantidad ?? 0]
          );
        }
      }
    }

    // 3️⃣ Actualizar estado del corte
    await conn.query(`UPDATE CORTES SET estado = 'Cerrado' WHERE id = ?`, [corte_id]);

    await conn.commit();
    res.json({ mensaje: "Control de calidad guardado correctamente con detalles" });
  } catch (err) {
    await conn.rollback();
    console.error("❌ Error guardando control de calidad:", err);
    res.status(500).json({ error: "Error al guardar el control de calidad y sus detalles" });
  } finally {
    conn.release();
  }
});

/* ==========================================================
   MOSTRAR CORTES EN REMISION
========================================================== */

app.get("/api/cortes_reporte", async (req, res) => {
   try {
    const [rows] = await pool.query(
      `SELECT 
          o.id,
          o.categoria,
          o.created_date,
          o.fecha_programada,
          o.tipo_prenda,
          o.referencia,
          o.cantidad_piezas,
          o.cantidad_materiales,
          o.muestra_fisica,
          o.fusionado,
          o.tiqueteado,
          o.separar_bordado_estampado,
          o.perforaciones,
          o.liquidar_tela,
          o.observaciones,
          o.usuario_id,
          o.estado,
          o.archivo,
          c.nombre_empresa AS cliente_nombre,
          cort.cantidad_tallas AS cantidad_tallas,
          cort.total_unidades AS total_unidades
       FROM ORDENES o
       LEFT JOIN CLIENTES c ON o.cliente_id = c.id
       LEFT JOIN CORTES cort ON cort.ordenes_id = o.id
       ORDER BY o.created_date ASC`
    );
    const data = mapDateFields(rows, ["created_date", "fecha_programada"]);
    res.json(data);
  } catch (err) {
    console.error("❌ Error obteniendo órdenes:", err);
    res.status(500).json({ error: "Error obteniendo órdenes" });
  }
});

/* ==========================================================
   MOSTRAR DETALLE CORTE EN REMISION
========================================================== */
  
 // GET /api/reporte_corte/:ordenId
app.get("/api/reporte_corte/:ordenId", requireLogin, async (req, res) => {
  const ordenId = req.params.ordenId;
  try {
    // 1) Orden (incluye cliente nombre)
    const [[orden]] = await pool.query(
      `SELECT 
         o.id, o.cliente_id, o.created_date, o.fecha_programada, o.total_unidades,
         o.tipo_prenda, o.muestra_fisica, o.fusionado, o.tiqueteado,
         o.separar_bordado_estampado, o.perforaciones, o.liquidar_tela,
         o.cantidad_piezas, o.cantidad_materiales, o.observaciones, o.usuario_id,
         o.estado, o.categoria, o.cantidad_piezas_telaprincipal, o.cantidad_piezas_forro,
         o.cantidad_piezas_fusionado, o.referencia, o.archivo, o.TP, o.forro, o.entretela,
         c.nombre_empresa AS cliente_nombre, u.nombre AS usuario_nombre
       FROM ORDENES o
       LEFT JOIN CLIENTES c ON o.cliente_id = c.id
       LEFT JOIN USUARIOS u ON o.usuario_id = u.id
       WHERE o.id = ?`,
      [ordenId]
    );

    if (!orden) return res.status(404).json({ ok: false, error: "Orden no encontrada" });

    // 2) Corte (1 corte por orden según confirmaste)
    const [[corte]] = await pool.query(
      `SELECT * FROM CORTES WHERE ordenes_id = ? LIMIT 1`,
      [ordenId]
    );

    // 3) Detalles de la orden (DETALLES_ORDENES)
    const [detOrdenRows] = await pool.query(
      `SELECT color, tallas, cantidad FROM DETALLES_ORDENES WHERE ordenes_id = ? ORDER BY color, tallas`,
      [ordenId]
    );

    // 4) Agrupar por color / columnas de tallas (orden)
    const columnasTallasOrden = [...new Set(detOrdenRows.map(r => r.tallas))].filter(Boolean);
    const porColorOrden = {};
    detOrdenRows.forEach(r => {
      if (!porColorOrden[r.color]) porColorOrden[r.color] = {};
      porColorOrden[r.color][r.tallas] = r.cantidad;
    });
    const matrizOrden = Object.entries(porColorOrden).map(([color, tallas]) => ({ color, tallas }));

    // 5) Detalles de corte (si existe corte)
    let columnasTallasCorte = [], matrizCorte = [];
    if (corte) {
      const [detCorteRows] = await pool.query(
        `SELECT color, tallas, cantidad FROM DETALLES_CORTES WHERE cortes_id = ? ORDER BY color, tallas`,
        [corte.id]
      );
      columnasTallasCorte = [...new Set(detCorteRows.map(r => r.tallas))].filter(Boolean);
      const porColorCorte = {};
      detCorteRows.forEach(r => {
        if (!porColorCorte[r.color]) porColorCorte[r.color] = {};
        porColorCorte[r.color][r.tallas] = r.cantidad;
      });
      matrizCorte = Object.entries(porColorCorte).map(([color, tallas]) => ({ color, tallas }));
    }

    // 6) Control de calidad (más reciente) y su detalle
    let control = null;
    let detalleControlMatriz = [];
    if (corte) {
      const [ccRows] = await pool.query(
        `SELECT * FROM CONTROL_CALIDAD WHERE corte_id = ? ORDER BY created_date DESC LIMIT 1`,
        [corte.id]
      );
      control = ccRows[0] || null;

      if (control) {
        const [detCCRows] = await pool.query(
          `SELECT color, talla, cantidad FROM DETALLE_CONTROL_CALIDAD WHERE control_calidad_id = ? ORDER BY color, talla`,
          [control.id]
        );
        // convertir filas (color,talla,cantidad) a matriz agrupada por color
        const cols = [...new Set(detCCRows.map(r => r.talla))].filter(Boolean);
        const byColor = {};
        detCCRows.forEach(r => {
          if (!byColor[r.color]) byColor[r.color] = {};
          byColor[r.color][r.talla] = r.cantidad;
        });
        detalleControlMatriz = Object.entries(byColor).map(([color, tallas]) => ({ color, tallas }));
      }
    }

    // 7) Liquidacion (si existe corte)
    let liquidacion = [];
    if (corte) {
      const [liqRows] = await pool.query(
        `SELECT numero_rollo, tipo_tela, metros_ticket, color, largo_capa, cantidad_capas, n_retazos, metraje_retazos, sesgo
         FROM LIQUIDACION WHERE corte_id = ? ORDER BY numero_rollo`,
        [corte.id]
      );
      liquidacion = liqRows;
    }

    // 8) Responder
    return res.json({
      ok: true,
      orden,
      detallesOrden: { columnasTallas: columnasTallasOrden, matriz: matrizOrden },
      corte: corte || null,
      detallesCorte: { columnasTallas: columnasTallasCorte, matriz: matrizCorte },
      control,
      detalleControl: detalleControlMatriz,
      liquidacion
    });
  } catch (err) {
    console.error("❌ /api/reporte_corte error:", err);
    return res.status(500).json({ ok: false, error: "Error obteniendo reporte" });
  }
});


/* ==========================================================
   REGISTRAR RECEPCION
========================================================== */
app.post('/api/recepcion', (req, res) => {
    // 1. Verificar si hay sesión activa
    if (!req.session.logged) {
        return res.status(401).json({ mensaje: "No autorizado. Inicie sesión." });
    }

    const { cliente_id, tipo_material, cantidad, unidad, observaciones } = req.body;
    const usuario_id = req.session.usuarioId; // Extraído de la sesión

    // 2. Validaciones básicas
    if (!cliente_id || !tipo_material || !cantidad || !unidad) {
        return res.status(400).json({ mensaje: "Faltan campos obligatorios." });
    }

    const query = `
        INSERT INTO recepcion (cliente_id, usuario_id, tipo_material, cantidad, unidad, observaciones) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [cliente_id, usuario_id, tipo_material, cantidad, unidad, observaciones], (err, result) => {
        if (err) {
            console.error("Error al insertar recepción:", err);
            return res.status(500).json({ mensaje: "Error en el servidor al guardar." });
        }
        res.status(200).json({ mensaje: "Recepción registrada correctamente.", id: result.insertId });
    });
});

/* ==========================================================
   REPORTE
========================================================== */
// GET /api/reportes/cortes?fecha_inicio=2025-01-01&fecha_fin=2025-12-31&cliente_id=5&page=1&pageSize=25
app.get("/api/reportes/cortes", requireLogin, async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, cliente_id, page = 1, pageSize = 25, search } = req.query;
    const offset = (Math.max(1, Number(page)) - 1) * Number(pageSize);

    const where = [];
    const params = [];

    if (fecha_inicio) {
      where.push("c.created_date >= ?");
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      where.push("c.created_date <= ?");
      params.push(fecha_fin);
    }
    if (cliente_id) {
      where.push("c.cliente_id = ?");
      params.push(cliente_id);
    }
    if (search) {
      // busca por cliente nombre, id de corte o usuario
      where.push("(cli.nombre_empresa LIKE ? OR c.id LIKE ? OR u.nombre LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Query principal: resumen por corte (una fila por corte) — ajusta columnas según necesitas
    const sql = `
      SELECT
        c.id AS corte_id,
        c.created_date,
        c.fecha_programada,
        c.total_unidades,
        c.cantidad_tallas,
        c.observaciones,
        c.ordenes_id,
        c.estado,
        cli.nombre_empresa AS cliente,
        u.nombre AS usuario
      FROM CORTES c
      LEFT JOIN CLIENTES cli ON c.cliente_id = cli.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      ${whereSQL}
      ORDER BY c.created_date DESC
      LIMIT ? OFFSET ?;
    `;

    // contar total para paginación
    const countSQL = `
      SELECT COUNT(*) AS total
      FROM CORTES c
      LEFT JOIN CLIENTES cli ON c.cliente_id = cli.id
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      ${whereSQL};
    `;

    const [rows] = await pool.query(sql, [...params, Number(pageSize), offset]);
    const [countRes] = await pool.query(countSQL, params);
    const total = countRes[0]?.total ?? 0;

    res.json({ ok: true, data: rows, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error("Error en /api/reportes/cortes", err);
    res.status(500).json({ ok: false, error: "Error generando reporte" });
  }
});

/* ==========================================================
   REPORTE POR CORTE
========================================================== */
import PDFDocument from "pdfkit";

app.get("/api/reporte_corte/:ordenId/pdf", requireLogin, async (req, res) => {
  const ordenId = req.params.ordenId;

  try {
    // === DATOS PRINCIPALES ===
    const [[corteRow]] = await pool.query("SELECT * FROM cortes WHERE ordenes_id = ?", [ordenId]);
    if (!corteRow) return res.status(404).json({ error: "Corte no encontrado para esta orden" });

    const [[ordenRow]] = await pool.query(
      `SELECT o.*, cl.nombre_empresa AS cliente_nombre
       FROM ordenes o
       LEFT JOIN clientes cl ON o.cliente_id = cl.id
       WHERE o.id = ?`,
      [ordenId]
    );

    const [ccRows] = await pool.query(
      `SELECT cc.*
        FROM control_calidad cc
        JOIN cortes c ON cc.corte_id = c.id
        WHERE c.ordenes_id = ?
        ORDER BY cc.created_date DESC
        LIMIT 1;
      `,
      [ordenId]
    );
    const control = ccRows[0] || null;

    const [detalle] = control
      ? await pool.query(
          `SELECT color, talla, cantidad FROM detalle_control_calidad WHERE control_calidad_id = ? ORDER BY color, talla`,
          [control.id]
        )
      : [[]];

    const [liqRows] = await pool.query(
      `SELECT l.numero_rollo, l.tipo_tela, l.largo_capa, l.cantidad_capas, 
          l.n_retazos, l.metraje_retazos, l.sesgo
        FROM liquidacion l
        JOIN cortes c ON l.corte_id = c.id
        WHERE c.ordenes_id = ?
        ORDER BY l.numero_rollo`,
      [ordenId]
    );

    // === CREAR PDF ===
    const doc = new PDFDocument({ size: "A3", margin: 40 }); // margen aumentado
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=reporte_corte_${ordenId}.pdf`);
    doc.pipe(res);

    // === ENCABEZADO ===
    const logoPath = "./public/logo.png";
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 70, 30, { width: 80 });
    }
    doc.fontSize(18).fillColor("#051258").text("REPORTE DE CORTE", 0, 40, { align: "center" });
    doc.moveDown(1.5);

    doc.fontSize(10).fillColor("gray").text(`Generado: ${new Date().toLocaleString()}`, { align: "right" });
    doc.moveDown(0.8);
    drawLine(doc);

    // === DATOS DE ORDEN Y CLIENTE ===
    sectionTitle(doc, "Datos de Orden / Cliente");
    doc.font("Helvetica").fontSize(11).fillColor("black");
    doc.text(`Nombre cliente: ${ordenRow?.cliente_nombre ?? "N/D"}`);
    doc.text(`Id orden: ${ordenRow?.id ?? "N/D"}`);
    doc.text(`Referencia: ${ordenRow?.referencia ?? "N/D"}`);
    doc.text(`Tipo prenda: ${ordenRow?.tipo_prenda ?? "N/D"}`);
    doc.moveDown(0.8);
    drawLine(doc);

    // === CONTROL DE CALIDAD ===
    sectionTitle(doc, "Control de Calidad");
    if (control) {
      const yes = v => (v ? "Si" : "No");
      doc.text(`Piezas: ${yes(control.chk_piezas)}   Prendas: ${yes(control.chk_prendas)}   Corte limpio: ${yes(control.chk_corte_limpio)}`);
      doc.text(`Esquinas: ${yes(control.chk_esquinas)}   Marras: ${yes(control.chk_marras)}`);
      doc.moveDown(0.5);
      doc.font("Helvetica-Oblique").text(`Observaciones: ${control.observaciones || "Sin observaciones."}`);
    } else {
      doc.text("No existe registro de control de calidad para este corte.");
    }
    doc.moveDown(0.8);
    drawLine(doc);

    // === TABLA DETALLE DE CONTROL DE CALIDAD ===
    sectionTitle(doc, "Detalle de Control de Calidad");
    if (detalle.length > 0) {
      drawTable(doc, detalle, [
        { key: "color", label: "Color", width: 180 },
        { key: "talla", label: "Talla", width: 100 },
        { key: "cantidad", label: "Cantidad", width: 100 },
      ]);
    } else {
      doc.text("Sin detalle registrado.");
    }
    doc.moveDown(1);
    drawLine(doc);

    // === TABLA LIQUIDACIÓN ===
    sectionTitle(doc, "Liquidación de Tela");
    if (liqRows.length > 0) {
      drawTable(doc, liqRows, [
        { key: "numero_rollo", label: "N° Rollo", width: 60 },
        { key: "tipo_tela", label: "Tipo Tela", width: 90 },
        { key: "largo_capa", label: "Largo Capa", width: 80 },
        { key: "cantidad_capas", label: "Capas", width: 60 },
        { key: "n_retazos", label: "N Retazos", width: 60 },
        { key: "metraje_retazos", label: "Metraje Retazos", width: 90 },
        { key: "sesgo", label: "Sesgo", width: 70 },
      ]);
    } else {
      doc.text("Sin registros de liquidación.");
    }

    // === PIE DE PÁGINA ===
    doc.moveDown(1.5);
    doc.fontSize(9).fillColor("gray").text(`Generado por: ${req.session?.user?.nombre ?? "Sistema"}`, { align: "left" });
    doc.text(`Corte ID: ${ordenId}`, { align: "left" });
    doc.end();

  } catch (err) {
    console.error("❌ Error generando reporte PDF:", err);
    res.status(500).json({ error: "Error generando reporte PDF" });
  }
});

// =============================
// 🔧 FUNCIONES AUXILIARES
// =============================
function sectionTitle(doc, text) {
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#051258").text(text, 70); // alineado con margen
  doc.moveDown(0.4);
  doc.font("Helvetica").fillColor("black");
}

function drawLine(doc) {
  const y = doc.y + 5;
  doc.strokeColor("#ccc").lineWidth(1).moveTo(70, y).lineTo(525, y).stroke(); // ajustado al nuevo margen
  doc.moveDown(0.8);
}

function drawTable(doc, rows, columns) {
  const startX = 70; // margen izquierdo aumentado
  let y = doc.y;
  const rowHeight = 20;

  // HEADER
  doc.font("Helvetica-Bold").fontSize(10);
  columns.forEach(col => {
    doc.text(col.label, startX + getXOffset(columns, col), y, { width: col.width, align: "center" });
  });
  y += rowHeight;
  doc.strokeColor("#aaa").moveTo(startX, y - 4).lineTo(525, y - 4).stroke();

  // BODY
  doc.font("Helvetica").fontSize(10);
  rows.forEach((row, i) => {
    if (y > 740) {
      doc.addPage();
      y = 70; // reinicia más abajo en nueva página
    }
    if (i % 2 === 0) {
      doc.rect(startX, y - 3, 530, rowHeight).fillOpacity(0.05).fillAndStroke("#e9eefb", "#e9eefb");
      doc.fillOpacity(1).fillColor("black");
    }
    columns.forEach(col => {
      const value = row[col.key] ?? "";
      doc.text(String(value), startX + getXOffset(columns, col), y, {
        width: col.width,
        align: "center",
      });
    });
    y += rowHeight;
  });

  doc.moveDown(1);
}

function getXOffset(columns, current) {
  const index = columns.findIndex(c => c.key === current.key);
  return columns.slice(0, index).reduce((sum, c) => sum + c.width, 0);
}


/* ==========================================================
   INICIO SERVIDOR
========================================================== */
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () =>
  console.log(`🚀 API corriendo en http://0.0.0.0:${port}`)
);