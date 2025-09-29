const { pool } = require('../config/database');

class FacturaController {
    
    // Crear factura completa desde una venta
    static async crearFacturaDesdeVenta(ventaData, ventaId = null) {
        console.log('📄 Creando factura completa...');
        let client = null;
        
        try {
            client = await pool.connect();
            await client.query('BEGIN');
            
            // Obtener información de la empresa
            const empresaInfo = await client.query('SELECT * FROM empresa_info LIMIT 1');
            const empresa = empresaInfo.rows[0] || {};
            
            // Generar número de factura único
            const numeroFactura = await this.generarNumeroFactura();
            
            // Crear registro principal de factura
            const facturaQuery = `
                INSERT INTO facturas (
                    numero_factura, venta_id, 
                    cliente_tipo, cliente_documento, cliente_nombre, cliente_telefono,
                    empresa_nombre, empresa_nit, empresa_direccion, empresa_telefono, empresa_email,
                    subtotal, iva, total,
                    metodo_pago, monto_recibido, cambio,
                    observaciones, estado, usuario_creador
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                RETURNING *
            `;
            
            const facturaValues = [
                numeroFactura,
                ventaId,
                ventaData.cliente.tipo,
                ventaData.cliente.documento,
                ventaData.cliente.nombre,
                ventaData.cliente.telefono,
                empresa.nombre_empresa || 'Ferretería G&L',
                empresa.nit || '900.123.456-7',
                empresa.direccion || 'Calle Principal #123',
                empresa.telefono || '(57) 555-0123',
                empresa.email || 'ventas@ferreteriagl.com',
                ventaData.subtotal,
                ventaData.iva,
                ventaData.total,
                ventaData.metodoPago,
                ventaData.montoRecibido,
                ventaData.metodoPago === 'efectivo' ? (ventaData.montoRecibido - ventaData.total) : null,
                JSON.stringify({
                    productos_cantidad: ventaData.productos.length,
                    fecha_venta: new Date().toISOString(),
                    sistema_version: '1.0'
                }),
                'activa',
                'Sistema' // Cambiar por usuario actual cuando esté disponible
            ];
            
            const facturaResult = await client.query(facturaQuery, facturaValues);
            const factura = facturaResult.rows[0];
            
            // Crear detalles de la factura
            for (const producto of ventaData.productos) {
                const detalleQuery = `
                    INSERT INTO factura_detalles (
                        factura_id, producto_id, producto_codigo, producto_nombre,
                        cantidad, precio_unitario, subtotal_linea
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `;
                
                await client.query(detalleQuery, [
                    factura.id,
                    producto.id,
                    producto.codigo || `PROD-${producto.id}`,
                    producto.nombre,
                    producto.cantidad,
                    producto.precio,
                    producto.cantidad * producto.precio
                ]);
            }
            
            await client.query('COMMIT');
            
            console.log(`✅ Factura ${numeroFactura} creada exitosamente`);
            return {
                success: true,
                factura: factura,
                numeroFactura: numeroFactura
            };
            
        } catch (error) {
            if (client) await client.query('ROLLBACK');
            console.error('❌ Error creando factura:', error.message);
            return {
                success: false,
                error: error.message
            };
        } finally {
            if (client) client.release();
        }
    }
    
    // Generar número de factura secuencial
    static async generarNumeroFactura() {
        try {
            const fecha = new Date();
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            
            // Buscar último número del día
            const query = `
                SELECT numero_factura 
                FROM facturas 
                WHERE numero_factura LIKE $1
                ORDER BY id DESC 
                LIMIT 1
            `;
            
            const prefijo = `FAC-${año}${mes}${dia}`;
            const result = await pool.query(query, [`${prefijo}%`]);
            
            let siguienteNumero = 1;
            
            if (result.rows.length > 0) {
                const ultimoNumero = result.rows[0].numero_factura;
                const match = ultimoNumero.match(/FAC-\d{8}-(\d+)$/);
                if (match) {
                    siguienteNumero = parseInt(match[1]) + 1;
                }
            }
            
            return `${prefijo}-${String(siguienteNumero).padStart(4, '0')}`;
            
        } catch (error) {
            console.error('Error generando número de factura:', error.message);
            return `FAC-${Date.now()}`;
        }
    }
    
    // Obtener factura por ID
    static async obtenerFacturaPorId(req, res) {
        try {
            const { id } = req.params;
            
            const facturaQuery = `
                SELECT f.*, 
                       json_agg(
                           json_build_object(
                               'id', fd.id,
                               'producto_codigo', fd.producto_codigo,
                               'producto_nombre', fd.producto_nombre,
                               'cantidad', fd.cantidad,
                               'precio_unitario', fd.precio_unitario,
                               'subtotal_linea', fd.subtotal_linea
                           )
                       ) as detalles
                FROM facturas f
                LEFT JOIN factura_detalles fd ON f.id = fd.factura_id
                WHERE f.id = $1
                GROUP BY f.id
            `;
            
            const result = await pool.query(facturaQuery, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Factura no encontrada'
                });
            }
            
            res.json({
                success: true,
                factura: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error obteniendo factura:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    
    // Listar facturas con filtros
    static async listarFacturas(req, res) {
        try {
            const { 
                page = 1, 
                limit = 20, 
                estado, 
                fechaDesde, 
                fechaHasta,
                cliente,
                numeroFactura,
                facturaId
            } = req.query;
            
            const offset = (page - 1) * limit;
            
            let whereConditions = [];
            let queryParams = [];
            let paramCount = 0;
            
            // Filtros dinámicos
            if (estado) {
                paramCount++;
                whereConditions.push(`f.estado = $${paramCount}`);
                queryParams.push(estado);
            }
            
            if (fechaDesde) {
                paramCount++;
                whereConditions.push(`f.fecha_creacion >= $${paramCount}`);
                queryParams.push(fechaDesde);
            }
            
            if (fechaHasta) {
                paramCount++;
                whereConditions.push(`f.fecha_creacion <= $${paramCount}`);
                queryParams.push(fechaHasta + ' 23:59:59');
            }
            
            if (cliente) {
                paramCount++;
                whereConditions.push(`(f.cliente_nombre ILIKE $${paramCount} OR f.cliente_documento ILIKE $${paramCount})`);
                queryParams.push(`%${cliente}%`);
            }
            
            if (numeroFactura) {
                paramCount++;
                whereConditions.push(`f.numero_factura ILIKE $${paramCount}`);
                queryParams.push(`%${numeroFactura}%`);
            }
            
            if (facturaId) {
                paramCount++;
                whereConditions.push(`f.id = $${paramCount}`);
                queryParams.push(facturaId);
            }
            
            const whereClause = whereConditions.length > 0 ? 
                `WHERE ${whereConditions.join(' AND ')}` : '';
            
            // Query principal usando tabla facturas
            const facturas = await pool.query(`
                SELECT 
                    f.id,
                    f.numero_factura,
                    f.cliente_nombre,
                    f.cliente_documento,
                    f.total,
                    f.metodo_pago,
                    f.estado,
                    f.fecha_creacion,
                    COUNT(fd.id) as total_items
                FROM facturas f
                LEFT JOIN factura_detalles fd ON f.id = fd.factura_id
                ${whereClause}
                GROUP BY f.id
                ORDER BY f.fecha_creacion DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `, [...queryParams, limit, offset]);
            
            // Count total
            const totalResult = await pool.query(`
                SELECT COUNT(*) as total
                FROM facturas f
                ${whereClause}
            `, queryParams);
            
            const total = parseInt(totalResult.rows[0].total);
            
            res.json({
                success: true,
                facturas: facturas.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('Error listando facturas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    
    // Anular factura
    static async anularFactura(req, res) {
        try {
            const { id } = req.params;
            const { razon } = req.body;
            
            let client = await pool.connect();
            await client.query('BEGIN');
            
            // Verificar que la factura existe y está activa
            const facturaActual = await client.query(
                'SELECT * FROM facturas WHERE id = $1 AND estado = $2',
                [id, 'activa']
            );
            
            if (facturaActual.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Factura no encontrada o ya anulada'
                });
            }
            
            // Anular factura
            await client.query(`
                UPDATE facturas 
                SET estado = 'anulada', 
                    fecha_modificacion = NOW(),
                    notas_internas = CONCAT(COALESCE(notas_internas, ''), 'Anulada: ', $2)
                WHERE id = $1
            `, [id, razon]);
            
            // Registrar cambio en historial
            await client.query(`
                INSERT INTO facturas_historial (
                    factura_id, campo_modificado, valor_anterior, valor_nuevo,
                    usuario, razon_cambio
                ) VALUES ($1, 'estado', 'activa', 'anulada', $2, $3)
            `, [id, 'Sistema', razon]);
            
            await client.query('COMMIT');
            
            res.json({
                success: true,
                message: 'Factura anulada exitosamente'
            });
            
        } catch (error) {
            console.error('Error anulando factura:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    
    // Actualizar información de empresa
    static async actualizarEmpresa(req, res) {
        try {
            const { 
                nombre_empresa, nit, direccion, telefono, 
                email, ciudad, eslogan 
            } = req.body;
            
            const result = await pool.query(`
                UPDATE empresa_info 
                SET nombre_empresa = $1, nit = $2, direccion = $3, 
                    telefono = $4, email = $5, ciudad = $6, 
                    eslogan = $7, updated_at = NOW()
                WHERE id = 1
                RETURNING *
            `, [nombre_empresa, nit, direccion, telefono, email, ciudad, eslogan]);
            
            if (result.rows.length === 0) {
                // Si no existe, crear
                await pool.query(`
                    INSERT INTO empresa_info (
                        nombre_empresa, nit, direccion, telefono, 
                        email, ciudad, eslogan
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                `, [nombre_empresa, nit, direccion, telefono, email, ciudad, eslogan]);
            }
            
            res.json({
                success: true,
                message: 'Información de empresa actualizada',
                empresa: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error actualizando empresa:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
    
    // Obtener información de empresa
    static async obtenerEmpresa(req, res) {
        try {
            const result = await pool.query('SELECT * FROM empresa_info LIMIT 1');
            
            res.json({
                success: true,
                empresa: result.rows[0] || {}
            });
            
        } catch (error) {
            console.error('Error obteniendo empresa:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = FacturaController;
