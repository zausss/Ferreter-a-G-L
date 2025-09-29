-- Script para crear las tablas del sistema de ventas
-- Ferretería J&L

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id SERIAL PRIMARY KEY,
    documento VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    direccion TEXT,
    tipo_cliente VARCHAR(20) DEFAULT 'registrado' CHECK (tipo_cliente IN ('registrado', 'consumidor_final')),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id SERIAL PRIMARY KEY,
    numero_venta VARCHAR(50) UNIQUE NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id),
    cliente_documento VARCHAR(20),
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_tipo VARCHAR(20) DEFAULT 'consumidor_final' CHECK (cliente_tipo IN ('registrado', 'consumidor_final')),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    iva DECIMAL(12,2) NOT NULL DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    metodo_pago VARCHAR(20) NOT NULL CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
    monto_recibido DECIMAL(12,2),
    cambio DECIMAL(12,2),
    fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada', 'devuelta')),
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de detalle de ventas
CREATE TABLE IF NOT EXISTS detalle_ventas (
    id SERIAL PRIMARY KEY,
    venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_usuario ON ventas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ventas_numero ON ventas(numero_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_ventas(venta_id);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON detalle_ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_clientes_documento ON clientes(documento);

-- Trigger para actualizar updated_at en ventas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ventas_updated_at BEFORE UPDATE ON ventas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar algunos clientes de prueba
INSERT INTO clientes (documento, nombre, telefono, tipo_cliente) VALUES
('12345678', 'Juan Pérez', '3001234567', 'registrado'),
('87654321', 'María González', '3009876543', 'registrado'),
('11223344', 'Carlos Rodríguez', '3005555555', 'registrado')
ON CONFLICT (documento) DO NOTHING;

-- Comentarios en las tablas
COMMENT ON TABLE clientes IS 'Tabla de clientes registrados en el sistema';
COMMENT ON TABLE ventas IS 'Tabla principal de ventas realizadas';
COMMENT ON TABLE detalle_ventas IS 'Detalle de productos vendidos por cada venta';

COMMENT ON COLUMN ventas.numero_venta IS 'Número único de la venta (formato: YYYYMMDD-######)';
COMMENT ON COLUMN ventas.cliente_tipo IS 'Tipo de cliente: registrado o consumidor_final';
COMMENT ON COLUMN ventas.metodo_pago IS 'Método de pago utilizado: efectivo, tarjeta, transferencia';
COMMENT ON COLUMN ventas.monto_recibido IS 'Monto recibido en efectivo (solo para pagos en efectivo)';
COMMENT ON COLUMN ventas.cambio IS 'Cambio entregado al cliente (solo para pagos en efectivo)';

-- Verificar que las tablas se crearon correctamente
SELECT 'Tablas de ventas creadas exitosamente' as resultado;
