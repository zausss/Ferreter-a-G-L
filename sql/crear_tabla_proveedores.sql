-- Crear tabla proveedores
-- Ferretería J&L - Sistema de gestión de proveedores

CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    tipo_documento VARCHAR(20) NOT NULL DEFAULT 'NIT',
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    ciudad VARCHAR(100),
    direccion TEXT,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    nota TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_proveedores_numero_documento ON proveedores(numero_documento);
CREATE INDEX IF NOT EXISTS idx_proveedores_nombre ON proveedores(nombre);
CREATE INDEX IF NOT EXISTS idx_proveedores_estado ON proveedores(estado);
CREATE INDEX IF NOT EXISTS idx_proveedores_fecha_registro ON proveedores(fecha_registro);

-- Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_actualizar_fecha_proveedores
    BEFORE UPDATE ON proveedores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Insertar algunos datos de ejemplo
INSERT INTO proveedores (tipo_documento, numero_documento, nombre, telefono, email, ciudad, direccion, estado, nota) VALUES
('NIT', '900123456-7', 'Distribuidora El Tornillo S.A.S', '3201234567', 'ventas@eltornillo.com', 'Bogotá', 'Calle 123 #45-67', 'activo', 'Proveedor principal de tornillería'),
('NIT', '800987654-3', 'Ferretería Los Andes Ltda', '3109876543', 'compras@losandes.com', 'Medellín', 'Carrera 50 #30-20', 'activo', 'Especialista en herramientas eléctricas'),
('NIT', '700555444-1', 'Suministros Industriales del Norte', '3157890123', 'info@suminorte.com', 'Barranquilla', 'Avenida 45 #22-33', 'suspendido', 'Pagos pendientes'),
('CC', '1234567890', 'Juan Carlos Herrera', '3187654321', 'jc.herrera@email.com', 'Cali', 'Calle 25 #30-45', 'activo', 'Proveedor independiente de pinturas'),
('NIT', '600333222-8', 'Materiales de Construcción Sur', '3145678901', 'ventas@matsur.com', 'Cartagena', 'Transversal 40 #15-80', 'inactivo', 'Temporalmente inactivo'),
('NIT', '500111333-5', 'Ferretería Central', '3123456789', 'info@ferrecentral.com', 'Bucaramanga', 'Carrera 27 #34-56', 'activo', 'Gran variedad en stock'),
('CC', '9876543210', 'María Elena Rodríguez', '3001234567', 'maria.rodriguez@email.com', 'Pereira', 'Avenida 30 de Agosto #25-30', 'activo', 'Proveedora de materiales eléctricos'),
('NIT', '400777888-2', 'Distribuciones Técnicas Ltda', '3167890123', 'tecnicas@distec.com', 'Manizales', 'Calle 65 #23-45', 'activo', 'Especialista en herramientas técnicas'),
('NIT', '300555666-9', 'Mega Ferretería del Caribe', '3134567890', 'megaferre@caribe.com', 'Santa Marta', 'Carrera 5 #18-25', 'activo', 'Proveedor mayorista'),
('CC', '5555444333', 'Carlos Alberto Muñoz', '3198765432', 'carlos.munoz@email.com', 'Ibagué', 'Calle 42 #28-35', 'suspendido', 'Retraso en entregas')
ON CONFLICT (numero_documento) DO NOTHING;