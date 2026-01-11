
-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS corte_textil;
USE corte_textil;

-- Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  nit VARCHAR(20),
  contacto VARCHAR(100)
);

-- Tabla: materiales
CREATE TABLE IF NOT EXISTS materiales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  unidad_base ENUM('metros', 'rollos', 'bolsas', 'unidades') NOT NULL
);

-- Tabla: recepciones
CREATE TABLE IF NOT EXISTS recepciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  observaciones TEXT,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabla: detalle_recepcion
CREATE TABLE IF NOT EXISTS detalle_recepcion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recepcion_id INT NOT NULL,
  material_id INT NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  unidad VARCHAR(20),
  observaciones TEXT,
  FOREIGN KEY (recepcion_id) REFERENCES recepciones(id),
  FOREIGN KEY (material_id) REFERENCES materiales(id)
);

-- Tabla: rollos
CREATE TABLE IF NOT EXISTS rollos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  detalle_id INT NOT NULL,
  numero_rollo INT NOT NULL,
  metros DECIMAL(10,2),
  observaciones TEXT,
  FOREIGN KEY (detalle_id) REFERENCES detalle_recepcion(id)
);

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  cedula VARCHAR(20) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  cargo VARCHAR(50), -- Puede ser "administrador", "corte", "recepcion", etc.
  usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

