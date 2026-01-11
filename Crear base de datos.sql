CREATE DATABASE IF NOT EXISTS corte_textil;
USE corte_textil;

-- ==============================
-- TABLA: USUARIOS
-- ==============================
CREATE TABLE USUARIOS (
    id INT(5) AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    cedula BIGINT UNIQUE,
    telefono BIGINT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    rol VARCHAR(50) NOT NULL,
    CONSTRAINT usuarios_id_pk PRIMARY KEY (id)
);

-- ==============================
-- TABLA: MATERIALES
-- ==============================
CREATE TABLE MATERIALES (
    id INT(5) AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(100),
    descripcion VARCHAR(255),
    CONSTRAINT materiales_id_pk PRIMARY KEY (id)
);

-- ==============================
-- TABLA: ORDENES
-- ==============================
CREATE TABLE ORDENES (
    id INT(5) AUTO_INCREMENT,
    cliente_id INT(5),
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_programada DATE,
    total_unidades INT,
    tipo_prenda VARCHAR(100),
    muestra_fisica BOOLEAN DEFAULT FALSE,
    fusionado BOOLEAN DEFAULT FALSE,
    tiqueteado BOOLEAN DEFAULT FALSE,
    separar_bordado_estampado BOOLEAN DEFAULT FALSE,
    perforaciones BOOLEAN DEFAULT FALSE,
    liquidar_tela BOOLEAN DEFAULT FALSE,
    cantidad_piezas INT,
    cantidad_materiales INT,
    observaciones VARCHAR(255),
    usuario_id INT(5),
	CONSTRAINT ordenes_id_pk PRIMARY KEY (id)
);

-- ==============================
-- TABLA: CORTES
-- ==============================
CREATE TABLE CORTES (
    id INT(5) AUTO_INCREMENT,
    cliente_id INT(5),
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_programada DATE,
    cantidad_tallas INT,
    total_unidades INT,
    observaciones VARCHAR(255),
    ordenes_id INT(5),
    usuario_id INT(5),
    CONSTRAINT cortes_id_pk PRIMARY KEY (id)
);

-- ==============================
-- TABLA: RECEPCIONES
-- ==============================
CREATE TABLE RECEPCIONES (
    id INT(5) AUTO_INCREMENT,
    cliente_id INT(5),
    descripcion VARCHAR(255),
    usuario_id INT(5),
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    cantidad_materiales INT,
    CONSTRAINT recepciones_id_pk PRIMARY KEY (id)
);

-- ==============================
-- TABLA: DETALLES_ORDENES
-- ==============================
CREATE TABLE DETALLES_ORDENES (
    id INT(5) AUTO_INCREMENT,
    tallas VARCHAR(50),
    cantidad INT,
    material_id INT(5),
    color VARCHAR(50),
    unidireccional BOOLEAN DEFAULT FALSE,
    ordenes_id INT(5),
    CONSTRAINT d_ordenes_id_pk PRIMARY KEY (id)
);

-- ==============================
-- TABLA: DETALLES_CORTES
-- ==============================
CREATE TABLE DETALLES_CORTES (
    id INT(5) AUTO_INCREMENT,
    tallas VARCHAR(50),
    cantidad INT,
    material_id INT(5),
    color VARCHAR(50),
    cortes_id INT(5),
    CONSTRAINT d_cortes_id_pk PRIMARY KEY (id)
);

-- ==============================
-- TABLA: DETALLES_RECEPCIONES
-- ==============================
CREATE TABLE DETALLES_RECEPCIONES (
    id INT(5) AUTO_INCREMENT,
    material_id INT(5),
    descripcion VARCHAR(255),
    cantidad INT,
    usuario_id INT(5),
    recepcion_id INT(5),
    CONSTRAINT d_recepciones_id_pk PRIMARY KEY (id)
);

-- ==============================
-- FOREIGN KEYS (agregadas al final)
-- ==============================

ALTER TABLE ORDENES
    ADD CONSTRAINT ordenes_usuario_id_fk FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id);

ALTER TABLE CORTES
    ADD CONSTRAINT cortes_ordenes_id_fk FOREIGN KEY (ordenes_id) REFERENCES ORDENES(id),
    ADD CONSTRAINT cortes_usuario_id_fk FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id);

ALTER TABLE DETALLES_ORDENES
    ADD CONSTRAINT d_ordenes_material_id_fk FOREIGN KEY (material_id) REFERENCES MATERIALES(id),
    ADD CONSTRAINT d_ordenes_ordenes_id_fk FOREIGN KEY (ordenes_id) REFERENCES ORDENES(id);

ALTER TABLE DETALLES_CORTES
    ADD CONSTRAINT d_cortes_material_id_fk FOREIGN KEY (material_id) REFERENCES MATERIALES(id),
    ADD CONSTRAINT d_cortes_cortes_id_fk FOREIGN KEY (cortes_id) REFERENCES CORTES(id);

ALTER TABLE RECEPCIONES
    ADD CONSTRAINT recepciones_usuario_id_fk FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id);

ALTER TABLE DETALLES_RECEPCIONES
    ADD CONSTRAINT d_recepciones_material_id_fk FOREIGN KEY (material_id) REFERENCES MATERIALES(id),
    ADD CONSTRAINT d_recepciones_usuario_id_fk FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id),
    ADD CONSTRAINT d_recepciones_recepcion_id_fk FOREIGN KEY (recepcion_id) REFERENCES RECEPCIONES(id);

-- 1. Crear tabla CLIENTES
CREATE TABLE CLIENTES (
    id INT(5) AUTO_INCREMENT,
    nombre_empresa VARCHAR(255) NOT NULL,
    numero VARCHAR(50),
    nombre_contacto VARCHAR(255),
    createdDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cli_id_pk PRIMARY KEY (id)
);

-- 3. Agregar las FOREIGN KEY en ORDENES y RECEPCIONES
ALTER TABLE ORDENES
ADD CONSTRAINT ORDENES_cliente_id_FK
FOREIGN KEY (cliente_id) REFERENCES CLIENTES(id);

ALTER TABLE RECEPCIONES
ADD CONSTRAINT RECEPCIONES_cliente_id_FK
FOREIGN KEY (cliente_id) REFERENCES CLIENTES(id);

USE
corte_textil;
INSERT INTO clientes (nombre_empresa,numero,nombre_contacto)
VALUES ('XUSS','3144108025','Sebastián');

ALTER TABLE ORDENES
ADD COLUMN estado VARCHAR(50);

DESCRIBE DETALLES_CORTES;
DESCRIBE CLIENTES;

ALTER TABLE usuarios
ADD COLUMN usuario VARCHAR(100);

ALTER TABLE usuarios
ADD COLUMN contraseña VARCHAR(100);

SELECT *
FROM corte_textil.cortes;

SELECT *
FROM corte_textil.detalles_cortes;

SELECT *
FROM corte_textil.ordenes;

UPDATE corte_textil.ordenes SET estado = 'Activo' WHERE id=6;

UPDATE corte_textil.ordenes 
SET estado = 'Cerrado'
WHERE id=3;

ALTER TABLE corte_textil.ordenes
ALTER COLUMN estado SET DEFAULT 'Activo';

USE
corte_textil;

ALTER TABLE ordenes
ADD COLUMN categoria VARCHAR(50);

SELECT *
FROM ordenes;

ALTER TABLE corte_textil.ordenes
ADD COLUMN cantidad_piezas_telaprincipal INT(3);

ALTER TABLE corte_textil.ordenes
ADD COLUMN cantidad_piezas_forro INT(3);

ALTER TABLE corte_textil.ordenes
ADD COLUMN cantidad_piezas_fusionado INT(3);

DESCRIBE corte_textil.ordenes;

ALTER TABLE corte_textil.cortes
ADD COLUMN cantidad_piezas_telaprincipal INT(3);

ALTER TABLE corte_textil.cortes
ADD COLUMN cantidad_piezas_forro INT(3);

ALTER TABLE corte_textil.cortes
ADD COLUMN cantidad_piezas_fusionado INT(3);

DESCRIBE corte_textil.cortes;

ALTER TABLE corte_textil.clientes
ADD COLUMN nit VARCHAR(50);

USE corte_textil;

CREATE TABLE CONTROL_CALIDAD (
  id INT AUTO_INCREMENT PRIMARY KEY,
  corte_id INT(5),
  chk_piezas BOOLEAN DEFAULT FALSE,
  chk_prendas BOOLEAN DEFAULT FALSE,
  chk_corte_limpio BOOLEAN DEFAULT FALSE,
  chk_esquinas BOOLEAN DEFAULT FALSE,
  chk_marras BOOLEAN DEFAULT FALSE,
  observaciones TEXT,
  created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT control_calidad_corte_id_FK FOREIGN KEY (corte_id) REFERENCES CORTES(id)
);

SELECT * FROM CONTROL_CALIDAD;

ALTER TABLE cortes
ADD COLUMN estado VARCHAR(50) DEFAULT 'Activo';

CREATE TABLE DETALLE_CONTROL_CALIDAD (
  id INT AUTO_INCREMENT PRIMARY KEY,
  control_calidad_id INT NOT NULL,
  color VARCHAR(100) NOT NULL,
  talla VARCHAR(50) NOT NULL,
  cantidad INT DEFAULT 0,
  CONSTRAINT fk_detalle_control
    FOREIGN KEY (control_calidad_id)
    REFERENCES control_calidad(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

CREATE TABLE LIQUIDACION (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_rollo INT NOT NULL,
  tipo_tela VARCHAR(100) NOT NULL,
  largo_capa DECIMAL(10,2) DEFAULT 0,
  cantidad_capas INT DEFAULT 0,
  n_retazos INT DEFAULT 0,
  metraje_retazos DECIMAL(10,2) DEFAULT 0,
  sesgo DECIMAL(10,2) DEFAULT 0,
  corte_id INT NOT NULL,
  FOREIGN KEY (corte_id) REFERENCES CORTES(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
USE corte_textil;
ALTER TABLE control_calidad
ADD COLUMN usuario_id INT(5);

ALTER TABLE control_calidad
ADD CONSTRAINT control_calidad_usuario_id_fk FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
;

USE  corte_textil;
ALTER TABLE ordenes
ADD COLUMN referencia VARCHAR(200) NOT NULL;

INSERT INTO corte_textil.clientes (nombre_empresa, numero, nombre_contacto, nit) VALUES 
('LIZETH MONTOYA','3007142740','LIZETH MONTOYA',NULL),
('INVERSIONES BLO SAS - XUSS','3144108025','SEBASTIAN','901166382'),
('COSCI SAS','3168254327','DIEGO','901516388'),
('DYD DOTACIONES Y DEPORTES SAS','3168765470','TURI','830144669'),
('DANNA BALACAS','3114976333','DANNA',NULL),
('SILVIA','3123683009','SILVIA',NULL),
('CINDY GUEVARA','3013190467','CYNDI',NULL),
('NOVAC MARKETING SAS - memento','3017879981','JOEL','901052418'),
('DIANA FRANCO ODA','3165334908','DIANA',NULL),
('LYDA GAVIRIA','3123206347','LIYDA',NULL),
('ANDREA RODRIGUEZ','3182258235','ANDREA','700071449-6'),
('COMPLEMENTO CREATIVO SAS','3113093293','VICTORIA','901315611'),
('PILAR FRANCO','3175277164','PILAR FRANCO',NULL),
('FABERPOL SAS','3011684785','JULIANA TORRES','900156609'),
('SAVAGE TEX SAS','3143527986','JUAN','901856188'),
('BENDITA SEAS','3184486596','NICOL',NULL),
('ZAFIROTREND SAS','3022995523','JULIO','901514336'),
('MARIO POVEDA','3118337911','MARIO',NULL),
('HARMONY ALEXANDRA','3133826450','ALEXANDRA',NULL),
('IRONHORSE COLOMBIA SAS','3223507778','JUAN VEGA','900754087-0'),
('MAYS STORE MAICOL','3009418151','MAICOL',NULL),
('B&B DISEÑO SAS BOGOTA CHIRRIADA','3507310254','MANUELA','90166901'),
('JAGUARA','3112529821','ANGELICA',NULL),
('JUAN SOUL','3183960965','JUAN SOUL',NULL),
('GOTAMOR','3216616023','XIMENA',NULL),
('DAVID GARCIA GEES','3144868447','DAVID GARCIA GEES',NULL),
('BACK TO BASICS SAS BTB','3102996141','MARIANA','900782969'),
('ERGONOMUS','3132463845','LUZ YARINE','900642173'),
('MIGUEL VILLALOBOS','3214881438','MIGUEL',NULL),
('TU MODA CREATIVA','3015529272','EIDER JEREZ',NULL),
('DANIELA CANCHALA','3006789588','DANIELA CANCHALA',NULL),
('DAVID MARRUGI','3017095480','DAVID MARRUGI',NULL),
('ALEXANDRA POSSO','3138484835','ALEXANDRA POSSO',NULL),
('LAURA NIÑO','3102520636','LAURA NIÑO',NULL),
('JACKSON','3116542310','JACKSON',NULL),
('LA TEXTILERA SAS','3125029549','VALENTINA','900461230'),
('SALAMANDRA SAS','3117020476','ESTEFANNY','900152743'),
('RAINWORKS SAS','3134563971','JHONNY GONZALEZ','901384748'),
('MANUFACTURA PROMODA SAS','3138239248','FREDDY','901359575'),
('DECIMO DOTACIONES SAS','3153677807','GUSTAVO AGUILAR','900350138');
