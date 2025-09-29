-- =============================================
-- SISTEMA DE FACTURAS SIMPLIFICADO - FERRETERÍA G&L
-- =============================================

-- 1. Tabla de información de empresa para facturas
CREATE TABLE IF NOT EXISTS empresa_info (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(255) NOT NULL DEFAULT 'Ferretería G&L',
    nit VARCHAR(50) DEFAULT '900.123.456-7',
    direccion TEXT DEFAULT 'Calle Principal #123, Barrio Centro',
    telefono VARCHAR(50) DEFAULT '(57) 555-0123',
    email VARCHAR(100) DEFAULT 'ventas@ferreteriagl.com',
    ciudad VARCHAR(100) DEFAULT 'Bogotá, Colombia',
    eslogan TEXT DEFAULT 'Tu aliado en construcción y hogar',
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla de facturas principales
CREATE TABLE IF NOT EXISTS facturas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    venta_id INTEGER, -- Sin referencia externa por ahora
    
    -- Información del cliente
    cliente_tipo VARCHAR(20) DEFAULT 'consumidor_final',
    cliente_documento VARCHAR(50),
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_direccion TEXT,
    cliente_email VARCHAR(100),
    
    -- Información de la empresa al momento de la factura
    empresa_nombre VARCHAR(255) DEFAULT 'Ferretería G&L',
    empresa_nit VARCHAR(50) DEFAULT '900.123.456-7',
    empresa_direccion TEXT DEFAULT 'Calle Principal #123',
    empresa_telefono VARCHAR(50) DEFAULT '(57) 555-0123',
    empresa_email VARCHAR(100) DEFAULT 'ventas@ferreteriagl.com',
    
    -- Totales
    subtotal DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    iva DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    
    -- Información de pago
    metodo_pago VARCHAR(50) NOT NULL,
    monto_recibido DECIMAL(12,2),
    cambio DECIMAL(12,2),
    
    -- Información adicional
    observaciones TEXT,
    notas_internas TEXT,
    
    -- Estados
    estado VARCHAR(20) DEFAULT 'activa',
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_vencimiento DATE,
    fecha_pago TIMESTAMP,
    
    -- Auditoria básica
    usuario_creador VARCHAR(100),
    usuario_modificador VARCHAR(100),
    fecha_modificacion TIMESTAMP DEFAULT NOW()
);

-- 3. Detalles de factura
CREATE TABLE IF NOT EXISTS factura_detalles (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER REFERENCES facturas(id) ON DELETE CASCADE,
    producto_id INTEGER,
    
    -- Información del producto
    producto_codigo VARCHAR(100),
    producto_nombre VARCHAR(255) NOT NULL,
    producto_descripcion TEXT,
    
    -- Cantidades y precios
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento_linea DECIMAL(12,2) DEFAULT 0,
    subtotal_linea DECIMAL(12,2) NOT NULL,
    
    -- Info adicional
    unidad_medida VARCHAR(20) DEFAULT 'unidad',
    observaciones_linea TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Historial de cambios
CREATE TABLE IF NOT EXISTS facturas_historial (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER REFERENCES facturas(id) ON DELETE CASCADE,
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    usuario VARCHAR(100),
    fecha_cambio TIMESTAMP DEFAULT NOW(),
    razon_cambio TEXT,
    direccion_ip VARCHAR(45)
);

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_documento, cliente_nombre);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);

-- Datos iniciales de empresa
INSERT INTO empresa_info (
    nombre_empresa, nit, direccion, telefono, email, ciudad, eslogan
) VALUES (
    'Ferretería G&L',
    '900.123.456-7',
    'Calle Principal #123, Barrio Centro',
    '(57) 555-0123',
    'ventas@ferreteriagl.com',
    'Bogotá, Colombia',
    'Tu aliado en construcción y hogar'
) ON CONFLICT DO NOTHING;
