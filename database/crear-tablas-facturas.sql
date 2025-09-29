-- =============================================
-- SISTEMA DE FACTURAS - FERRETERÍA G&L
-- =============================================

-- 1. Tabla de información de empresa para facturas
CREATE TABLE IF NOT EXISTS empresa_info (
    id SERIAL PRIMARY KEY,
    nombre_empresa VARCHAR(255) NOT NULL DEFAULT 'Ferretería G&L',
    nit VARCHAR(50),
    direccion TEXT,
    telefono VARCHAR(50),
    email VARCHAR(100),
    ciudad VARCHAR(100),
    eslogan TEXT,
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla de facturas (separada de ventas para mejor organización)
CREATE TABLE IF NOT EXISTS facturas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    venta_id INTEGER REFERENCES ventas(id) ON DELETE CASCADE,
    
    -- Información del cliente en la factura
    cliente_tipo VARCHAR(20) DEFAULT 'consumidor_final',
    cliente_documento VARCHAR(50),
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_telefono VARCHAR(20),
    cliente_direccion TEXT,
    cliente_email VARCHAR(100),
    
    -- Información de la empresa al momento de la factura
    empresa_nombre VARCHAR(255) DEFAULT 'Ferretería G&L',
    empresa_nit VARCHAR(50),
    empresa_direccion TEXT,
    empresa_telefono VARCHAR(50),
    empresa_email VARCHAR(100),
    
    -- Totales y detalles financieros
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
    
    -- Control de estados
    estado VARCHAR(20) DEFAULT 'activa', -- activa, anulada, pagada, pendiente
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    fecha_vencimiento DATE,
    fecha_pago TIMESTAMP,
    
    -- Auditoria
    usuario_creador INTEGER REFERENCES usuarios(id),
    usuario_modificador INTEGER REFERENCES usuarios(id),
    fecha_modificacion TIMESTAMP DEFAULT NOW(),
    
    -- Control de versiones (para auditoría)
    version INTEGER DEFAULT 1,
    es_copia BOOLEAN DEFAULT FALSE,
    factura_original_id INTEGER REFERENCES facturas(id)
);

-- 3. Tabla de detalles de factura (líneas de productos)
CREATE TABLE IF NOT EXISTS factura_detalles (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER REFERENCES facturas(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    
    -- Información del producto al momento de la factura
    producto_codigo VARCHAR(100),
    producto_nombre VARCHAR(255) NOT NULL,
    producto_descripcion TEXT,
    
    -- Cantidades y precios
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento_linea DECIMAL(12,2) DEFAULT 0,
    subtotal_linea DECIMAL(12,2) NOT NULL,
    
    -- Información adicional
    unidad_medida VARCHAR(20) DEFAULT 'unidad',
    observaciones_linea TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Tabla de historial de cambios en facturas (auditoría)
CREATE TABLE IF NOT EXISTS facturas_historial (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER REFERENCES facturas(id) ON DELETE CASCADE,
    
    -- Qué cambió
    campo_modificado VARCHAR(100),
    valor_anterior TEXT,
    valor_nuevo TEXT,
    
    -- Quién y cuándo
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_cambio TIMESTAMP DEFAULT NOW(),
    razon_cambio TEXT,
    
    -- Contexto
    direccion_ip VARCHAR(45),
    user_agent TEXT
);

-- 5. Tabla de configuración de numeración
CREATE TABLE IF NOT EXISTS configuracion_numeracion (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL, -- factura, nota_credito, nota_debito
    prefijo VARCHAR(10),
    siguiente_numero INTEGER DEFAULT 1,
    longitud_numero INTEGER DEFAULT 6,
    reset_anual BOOLEAN DEFAULT TRUE,
    ultimo_reset DATE,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =============================================

CREATE INDEX IF NOT EXISTS idx_facturas_numero ON facturas(numero_factura);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_documento, cliente_nombre);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_venta ON facturas(venta_id);

CREATE INDEX IF NOT EXISTS idx_factura_detalles_factura ON factura_detalles(factura_id);
CREATE INDEX IF NOT EXISTS idx_factura_detalles_producto ON factura_detalles(producto_id);

CREATE INDEX IF NOT EXISTS idx_facturas_historial_factura ON facturas_historial(factura_id);
CREATE INDEX IF NOT EXISTS idx_facturas_historial_fecha ON facturas_historial(fecha_cambio);

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar información básica de la empresa
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

-- Configurar numeración de facturas
INSERT INTO configuracion_numeracion (
    tipo, prefijo, siguiente_numero, longitud_numero, reset_anual
) VALUES 
    ('factura', 'FAC-', 1, 6, TRUE),
    ('nota_credito', 'NC-', 1, 6, TRUE),
    ('nota_debito', 'ND-', 1, 6, TRUE)
ON CONFLICT DO NOTHING;

-- =============================================
-- FUNCIONES ÚTILES
-- =============================================

-- Función para obtener el siguiente número de factura
CREATE OR REPLACE FUNCTION obtener_siguiente_numero_factura()
RETURNS VARCHAR(50) AS $$
DECLARE
    config RECORD;
    nuevo_numero VARCHAR(50);
    año_actual INTEGER;
BEGIN
    SELECT * INTO config FROM configuracion_numeracion 
    WHERE tipo = 'factura' AND activo = TRUE 
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No hay configuración de numeración para facturas';
    END IF;
    
    año_actual := EXTRACT(YEAR FROM NOW());
    
    -- Reset anual si es necesario
    IF config.reset_anual AND (config.ultimo_reset IS NULL OR EXTRACT(YEAR FROM config.ultimo_reset) < año_actual) THEN
        UPDATE configuracion_numeracion 
        SET siguiente_numero = 1, ultimo_reset = NOW()
        WHERE tipo = 'factura' AND activo = TRUE;
        config.siguiente_numero := 1;
    END IF;
    
    -- Generar número con formato: AÑO + PREFIJO + NÚMERO
    nuevo_numero := año_actual::text || config.prefijo || LPAD(config.siguiente_numero::text, config.longitud_numero, '0');
    
    -- Incrementar contador
    UPDATE configuracion_numeracion 
    SET siguiente_numero = siguiente_numero + 1, updated_at = NOW()
    WHERE tipo = 'factura' AND activo = TRUE;
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Función para registrar cambios en facturas
CREATE OR REPLACE FUNCTION registrar_cambio_factura(
    p_factura_id INTEGER,
    p_campo VARCHAR(100),
    p_valor_anterior TEXT,
    p_valor_nuevo TEXT,
    p_usuario_id INTEGER,
    p_razon TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO facturas_historial (
        factura_id, campo_modificado, valor_anterior, valor_nuevo,
        usuario_id, razon_cambio
    ) VALUES (
        p_factura_id, p_campo, p_valor_anterior, p_valor_nuevo,
        p_usuario_id, p_razon
    );
END;
$$ LANGUAGE plpgsql;
