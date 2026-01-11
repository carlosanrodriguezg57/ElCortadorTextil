-- ==============================
-- USUARIOS
-- ==============================
CREATE TABLE USUARIOS (
    id VARCHAR(20) PRIMARY KEY,
    seq INT AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    cedula BIGINT UNIQUE,
    telefono BIGINT,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    rol VARCHAR(50) NOT NULL,
    UNIQUE (seq)
);

DELIMITER $$
CREATE TRIGGER before_insert_usuarios
BEFORE INSERT ON USUARIOS
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = CONCAT('USU-', LPAD(NEW.seq, 5, '0'));
    END IF;
END$$
DELIMITER ;

-- ==============================
-- CORTES
-- ==============================
CREATE TABLE CORTES (
    id VARCHAR(20) PRIMARY KEY,
    seq INT AUTO_INCREMENT,
    cliente_id VARCHAR(50),
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_programada DATE,
    cantidad_tallas INT,
    total_unidades INT,
    observaciones VARCHAR(255),
    ordenes_id VARCHAR(50),
    usuario_id VARCHAR(50),
    UNIQUE (seq),
    FOREIGN KEY (ordenes_id) REFERENCES ORDENES(id),
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id)
);

DELIMITER $$
CREATE TRIGGER before_insert_cortes
BEFORE INSERT ON CORTES
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = CONCAT('CORTE-', LPAD(NEW.seq, 5, '0'));
    END IF;
END$$
DELIMITER ;

-- ==============================
-- ORDENES
-- ==============================
CREATE TABLE ORDENES (
    id VARCHAR(20) PRIMARY KEY,
    seq INT AUTO_INCREMENT,
    cliente_id VARCHAR(50),
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
    usuario_id VARCHAR(50),
    UNIQUE (seq),
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id)
);

DELIMITER $$
CREATE TRIGGER before_insert_ordenes
BEFORE INSERT ON ORDENES
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = CONCAT('ORD-', LPAD(NEW.seq, 5, '0'));
    END IF;
END$$
DELIMITER ;

-- ==============================
-- DETALLES_ORDENES
-- ==============================
CREATE TABLE DETALLES_ORDENES (
    id VARCHAR(20) PRIMARY KEY,
    seq INT AUTO_INCREMENT,
    tallas VARCHAR(50),
    cantidad INT,
    material_id VARCHAR(50),
    color VARCHAR(50),
    unidireccional BOOLEAN DEFAULT FALSE,
    ordenes_id VARCHAR(20),
    UNIQUE (seq),
    FOREIGN KEY (material_id) REFERENCES MATERIALES(id),
    FOREIGN KEY (ordenes_id) REFERENCES ORDENES(id)
);

DELIMITER $$
CREATE TRIGGER before_insert_d_ordenes
BEFORE INSERT ON DETALLES_ORDENES
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = CONCAT('D_ORD-', LPAD(NEW.seq, 5, '0'));
    END IF;
END$$
DELIMITER ;

-- ==============================
-- DETALLES_CORTES
-- ==============================
CREATE TABLE DETALLES_CORTES (
    id VARCHAR(20) PRIMARY KEY,
    seq INT AUTO_INCREMENT,
    tallas VARCHAR(50),
    cantidad INT,
    material_id VARCHAR(50),
    color VARCHAR(50),
    cortes_id VARCHAR(20),
    UNIQUE (seq),
    FOREIGN KEY (material_id) REFERENCES MATERIALES(id),
    FOREIGN KEY (cortes_id) REFERENCES CORTES(id)
);

DELIMITER $$
CREATE TRIGGER before_insert_d_cortes
BEFORE INSERT ON DETALLES_CORTES
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = CONCAT('D_CORTE-', LPAD(NEW.seq, 5, '0'));
    END IF;
END$$
DELIMITER ;

-- ==============================
-- MATERIALES
-- ==============================
CREATE TABLE MATERIALES (
    id VARCHAR(20) PRIMARY KEY,
    seq INT AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(100),
    descripcion VARCHAR(255),
    UNIQUE (seq)
);

DELIMITER $$
CREATE TRIGGER before_insert_materiales
BEFORE INSERT ON MATERIALES
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = CONCAT('MAT-', LPAD(NEW.seq, 5, '0'));
    END IF;
END$$
DELIMITER ;

-- ==============================
-- RECEPCIONES
-- ==============================
CREATE TABLE RECEPCIONES (
    id VARCHAR(20) PRIMARY KEY,
    seq INT AUTO_INCREMENT,
    cliente_id VARCHAR(50),
    descripcion VARCHAR(255),
    usuario_id VARCHAR(50),
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    cantidad_materiales INT,
    UNIQUE (seq),
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id)
);

DELIMITER $$
CREATE TRIGGER before_insert_recepciones
BEFORE INSERT ON RECEPCIONES
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = CONCAT('RECP-', LPAD(NEW.seq, 5, '0'));
    END IF;
END$$
DELIMITER ;

-- ==============================
-- DETALLES_RECEPCIONES
-- ==============================
CREATE TABLE DETALLES_RECEPCIONES (
    id VARCHAR(20) PRIMARY KEY,
    seq INT AUTO_INCREMENT,
    material_id VARCHAR(50),
    descripcion VARCHAR(255),
    cantidad INT,
    usuario_id VARCHAR(50),
    recepcion_id VARCHAR(20),
    UNIQUE (seq),
    FOREIGN KEY (material_id) REFERENCES MATERIALES(id),
    FOREIGN KEY (usuario_id) REFERENCES USUARIOS(id),
    FOREIGN KEY (recepcion_id) REFERENCES RECEPCIONES(id)
);

DELIMITER $$
CREATE TRIGGER before_insert_d_recepciones
BEFORE INSERT ON DETALLES_RECEPCIONES
FOR EACH ROW
BEGIN
    IF NEW.id IS NULL OR NEW.id = '' THEN
        SET NEW.id = CONCAT('D_RECP-', LPAD(NEW.seq, 5, '0'));
    END IF;
END$$
DELIMITER ;
