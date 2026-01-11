const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function encriptarUsuarios() {
  const db = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'R4y0C0lS4S*', // pon tu contraseña de MySQL si tienes una
    database: 'corte_textil' // asegúrate que este nombre sea el correcto
  });

  try {
    const [usuarios] = await db.query('SELECT id, contrasena FROM usuarios');

    for (const usuario of usuarios) {
      // Saltamos si ya parece ser un hash bcrypt (comienza con $2b$ o $2a$)
      if (usuario.contrasena.startsWith('$2')) {
        console.log(`Usuario ID ${usuario.id} ya tiene contraseña encriptada.`);
        continue;
      }

      const hash = await bcrypt.hash(usuario.contrasena, 10);
      await db.query('UPDATE usuarios SET contrasena = ? WHERE id = ?', [hash, usuario.id]);
      console.log(`Contraseña encriptada para usuario ID ${usuario.id}`);
    }

    console.log('✅ Contraseñas encriptadas correctamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error al encriptar:', error);
    process.exit(1);
  }
}

encriptarUsuarios();
