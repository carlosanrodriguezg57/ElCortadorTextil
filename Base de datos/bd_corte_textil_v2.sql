USE corte_textil;

CREATE TABLE recepcion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    tipo_material VARCHAR(100) NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    unidad VARCHAR(20) NOT NULL,
    observaciones TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Definición de la Llave Foránea
    CONSTRAINT fk_cliente 
    FOREIGN KEY (cliente_id) 
    REFERENCES clientes(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

ALTER TABLE recepcion 
ADD COLUMN usuario_id INT NOT NULL,
ADD CONSTRAINT fk_usuario
    FOREIGN KEY (usuario_id) 
    REFERENCES usuarios(id) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;
    
SET FOREIGN_KEY_CHECKS = 0; -- Desactiva la protección
DROP TABLE IF EXISTS recepciones; 
SET FOREIGN_KEY_CHECKS = 1; -- Reactiva la protección