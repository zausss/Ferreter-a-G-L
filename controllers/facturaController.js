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
    
    // Obtener factura por ID (método limpio)
    static async obtenerFacturaPorId(req, res) {
        try {
            const { id } = req.params;
            console.log(`📋 Buscando factura ID: ${id}`);
            
            // Consulta SQL corregida con nombres de columnas exactos
            const facturaQuery = `
                SELECT 
                    f.*,
                    COALESCE(
                        json_agg(
                            CASE WHEN fd.id IS NOT NULL THEN
                                json_build_object(
                                    'id', fd.id,
                                    'codigo', fd.producto_codigo,
                                    'nombre', fd.producto_nombre,
                                    'cantidad', fd.cantidad,
                                    'precio', fd.precio_unitario,
                                    'subtotal', fd.subtotal_linea
                                )
                            END
                        ) FILTER (WHERE fd.id IS NOT NULL),
                        '[]'
                    ) as detalles
                FROM facturas f
                LEFT JOIN factura_detalles fd ON f.id = fd.factura_id
                WHERE f.id = $1
                GROUP BY f.id
            `;
            
            const result = await pool.query(facturaQuery, [id]);
            
            if (result.rows.length === 0) {
                console.log(`❌ Factura ${id} no encontrada`);
                return res.status(404).json({
                    success: false,
                    message: 'Factura no encontrada'
                });
            }
            
            console.log(`✅ Factura ${id} encontrada`);
            res.json({
                success: true,
                factura: result.rows[0]
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo factura:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener factura'
            });
        }
    }
    
    // Listar facturas (método limpio y simple)
    static async listarFacturas(req, res) {
        try {
            console.log('📋 Cargando lista de facturas...');
            const { 
                page = 1, 
                limit = 20, 
                cliente, 
                numeroFactura, 
                facturaId,
                estado,
                fechaDesde,
                fechaHasta 
            } = req.query;
            
            console.log('🔍 Filtros recibidos:', { cliente, numeroFactura, facturaId, estado, fechaDesde, fechaHasta });
            
            const offset = (page - 1) * limit;
            
            // Construir filtros dinámicos
            let whereClause = '';
            let queryParams = [];
            let paramCount = 0;
            
            if (cliente) {
                paramCount++;
                whereClause += `WHERE (f.cliente_nombre ILIKE $${paramCount} OR f.cliente_documento ILIKE $${paramCount})`;
                queryParams.push(`%${cliente}%`);
            }
            
            if (numeroFactura) {
                paramCount++;
                const whereWord = whereClause ? ' AND' : 'WHERE';
                whereClause += `${whereWord} f.numero_factura ILIKE $${paramCount}`;
                queryParams.push(`%${numeroFactura}%`);
            }

            if (facturaId) {
                paramCount++;
                const whereWord = whereClause ? ' AND' : 'WHERE';
                whereClause += `${whereWord} f.id = $${paramCount}`;
                queryParams.push(facturaId);
            }

            if (estado) {
                paramCount++;
                const whereWord = whereClause ? ' AND' : 'WHERE';
                whereClause += `${whereWord} f.estado = $${paramCount}`;
                queryParams.push(estado);
            }

            if (fechaDesde) {
                paramCount++;
                const whereWord = whereClause ? ' AND' : 'WHERE';
                whereClause += `${whereWord} DATE(f.fecha_creacion) >= $${paramCount}`;
                queryParams.push(fechaDesde);
            }

            if (fechaHasta) {
                paramCount++;
                const whereWord = whereClause ? ' AND' : 'WHERE';
                whereClause += `${whereWord} DATE(f.fecha_creacion) <= $${paramCount}`;
                queryParams.push(fechaHasta);
            }
            
            // Query principal simplificado
            const query = `
                SELECT 
                    f.id,
                    f.numero_factura,
                    f.cliente_nombre,
                    f.cliente_documento,
                    f.total,
                    f.metodo_pago,
                    f.estado,
                    f.fecha_creacion
                FROM facturas f
                ${whereClause}
                ORDER BY f.fecha_creacion DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;
            
            const facturas = await pool.query(query, [...queryParams, limit, offset]);
            
            // Contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM facturas f
                ${whereClause}
            `;
            
            const totalResult = await pool.query(countQuery, queryParams);
            const total = parseInt(totalResult.rows[0].total);
            
            console.log(`✅ ${facturas.rows.length} facturas cargadas de ${total} totales`);
            
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
            console.error('❌ Error listando facturas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al cargar facturas'
            });
        }
    }
    
    // Anular factura
    static async anularFactura(req, res) {
        let client = null;
        try {
            const { id } = req.params;
            const { razon } = req.body;
            
            console.log('🔍 Anulando factura:', { id, razon });
            
            client = await pool.connect();
            console.log('✅ Conexión obtenida');
            
            await client.query('BEGIN');
            console.log('✅ Transacción iniciada');
            
            // Verificar que la factura existe y está activa
            console.log('🔍 Verificando factura activa...');
            const facturaActual = await client.query(
                'SELECT * FROM facturas WHERE id = $1 AND estado = $2',
                [id, 'activa']
            );
            console.log('✅ Consulta ejecutada, resultados:', facturaActual.rows.length);
            
            if (facturaActual.rows.length === 0) {
                console.log('❌ Factura no encontrada o ya anulada');
                await client.query('ROLLBACK');
                return res.status(404).json({
                    success: false,
                    message: 'Factura no encontrada o ya anulada'
                });
            }
            
            // Anular factura
            console.log('📝 Actualizando estado de factura...');
            const notasActualizadas = `Anulada: ${razon} - ${new Date().toISOString()}`;
            await client.query(`
                UPDATE facturas 
                SET estado = 'anulada', 
                    fecha_modificacion = NOW(),
                    notas_internas = CASE 
                        WHEN notas_internas IS NULL THEN $2
                        ELSE notas_internas || ' | ' || $2
                    END
                WHERE id = $1
            `, [id, notasActualizadas]);
            console.log('✅ Factura actualizada');
            
            // Registrar cambio en historial (comentado temporalmente)
            // await client.query(`
            //     INSERT INTO facturas_historial (
            //         factura_id, campo_modificado, valor_anterior, valor_nuevo,
            //         usuario, razon_cambio
            //     ) VALUES ($1, 'estado', 'activa', 'anulada', $2, $3)
            // `, [id, 'Sistema', razon]);
            
            await client.query('COMMIT');
            console.log('✅ Transacción confirmada');
            
            res.json({
                success: true,
                message: 'Factura anulada exitosamente'
            });

        } catch (error) {
            console.error('❌ Error anulando factura:', error);
            
            if (client) {
                try {
                    await client.query('ROLLBACK');
                    console.log('🔄 Rollback ejecutado');
                } catch (rollbackError) {
                    console.error('❌ Error en rollback:', rollbackError);
                }
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor: ' + error.message
            });
        } finally {
            if (client) {
                client.release();
                console.log('🔄 Conexión liberada');
            }
        }
    }    // Actualizar información de empresa
    static async actualizarEmpresa(req, res) {
        try {
            console.log('🏢 Actualizando información de empresa...');
            const { 
                nombre_empresa, nit, direccion, telefono, 
                email, ciudad, eslogan 
            } = req.body;
            
            console.log('📋 Datos recibidos:', { nombre_empresa, nit, direccion, telefono, email, ciudad, eslogan });

            // Verificar si la tabla existe, si no crearla
            await pool.query(`
                CREATE TABLE IF NOT EXISTS empresa_info (
                    id SERIAL PRIMARY KEY,
                    nombre_empresa VARCHAR(100),
                    nit VARCHAR(20),
                    direccion TEXT,
                    telefono VARCHAR(20),
                    email VARCHAR(100),
                    ciudad VARCHAR(50),
                    eslogan TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabla empresa_info verificada/creada');

            // Intentar actualizar primero
            const result = await pool.query(`
                UPDATE empresa_info 
                SET nombre_empresa = $1, nit = $2, direccion = $3, 
                    telefono = $4, email = $5, ciudad = $6, 
                    eslogan = $7, updated_at = NOW()
                WHERE id = 1
                RETURNING *
            `, [nombre_empresa, nit, direccion, telefono, email, ciudad, eslogan]);
            
            let empresaData;
            
            if (result.rows.length === 0) {
                console.log('📝 No existe registro, insertando nuevo...');
                // Si no existe, crear
                const insertResult = await pool.query(`
                    INSERT INTO empresa_info (
                        nombre_empresa, nit, direccion, telefono, 
                        email, ciudad, eslogan
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING *
                `, [nombre_empresa, nit, direccion, telefono, email, ciudad, eslogan]);
                empresaData = insertResult.rows[0];
            } else {
                console.log('📝 Registro actualizado exitosamente');
                empresaData = result.rows[0];
            }
            
            res.json({
                success: true,
                message: 'Información de empresa actualizada exitosamente',
                empresa: empresaData
            });
            
        } catch (error) {
            console.error('❌ Error actualizando empresa:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor: ' + error.message
            });
        }
    }
    
    // Obtener información de empresa
    static async obtenerEmpresa(req, res) {
        try {
            console.log('🏢 Obteniendo información de empresa...');
            
            // Intentar obtener de la tabla empresa_info
            const result = await pool.query('SELECT * FROM empresa_info LIMIT 1');
            
            // Si no existe datos, crear datos por defecto
            let empresa = result.rows[0];
            if (!empresa) {
                console.log('ℹ️  No hay datos de empresa, usando valores por defecto');
                empresa = {
                    nombre_empresa: 'Ferretería G&L',
                    nit: '900.123.456-7',
                    direccion: 'Calle Principal #123',
                    telefono: '(57) 555-0123',
                    email: 'ventas@ferreteriagl.com'
                };
            }
            
            console.log('✅ Información de empresa obtenida');
            res.json({
                success: true,
                empresa: empresa
            });
            
        } catch (error) {
            console.error('❌ Error obteniendo empresa:', error);
            
            // Respuesta con datos por defecto en caso de error
            res.json({
                success: true,
                empresa: {
                    nombre_empresa: 'Ferretería G&L',
                    nit: '900.123.456-7',
                    direccion: 'Calle Principal #123',
                    telefono: '(57) 555-0123',
                    email: 'ventas@ferreteriagl.com'
                }
            });
        }
    }

    // Imprimir factura (generar HTML para impresión)
    static async imprimirFactura(req, res) {
        try {
            const { id } = req.params;
            
            // Obtener factura completa
            const facturaResult = await pool.query(`
                SELECT f.*, fd.producto_id, fd.producto_codigo, fd.producto_nombre, 
                       fd.cantidad, fd.precio_unitario, fd.subtotal as detalle_subtotal
                FROM facturas f
                LEFT JOIN factura_detalles fd ON f.id = fd.factura_id
                WHERE f.id = $1
                ORDER BY fd.id
            `, [id]);

            if (facturaResult.rows.length === 0) {
                return res.status(404).send('Factura no encontrada');
            }

            const factura = facturaResult.rows[0];
            const detalles = facturaResult.rows.map(row => ({
                codigo: row.producto_codigo,
                nombre: row.producto_nombre,
                cantidad: row.cantidad,
                precio: row.precio_unitario,
                subtotal: row.detalle_subtotal
            }));

            // Generar HTML para impresión
            const html = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Factura ${factura.numero_factura}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .factura-info { margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .totales { text-align: right; margin-top: 20px; }
                        @media print { body { margin: 0; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${factura.empresa_nombre}</h1>
                        <p>NIT: ${factura.empresa_nit}</p>
                        <p>${factura.empresa_direccion}</p>
                        <p>Tel: ${factura.empresa_telefono}</p>
                    </div>
                    
                    <div class="factura-info">
                        <h2>Factura: ${factura.numero_factura}</h2>
                        <p><strong>Fecha:</strong> ${new Date(factura.fecha_factura).toLocaleDateString()}</p>
                        <p><strong>Cliente:</strong> ${factura.cliente_nombre}</p>
                        <p><strong>Documento:</strong> ${factura.cliente_documento}</p>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${detalles.map(det => `
                                <tr>
                                    <td>${det.codigo}</td>
                                    <td>${det.nombre}</td>
                                    <td>${det.cantidad}</td>
                                    <td>$${det.precio}</td>
                                    <td>$${det.subtotal}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totales">
                        <p><strong>Subtotal: $${factura.subtotal}</strong></p>
                        <p><strong>IVA: $${factura.iva}</strong></p>
                        <p><strong>Total: $${factura.total}</strong></p>
                    </div>

                    <script>window.print();</script>
                </body>
                </html>
            `;

            res.setHeader('Content-Type', 'text/html');
            res.send(html);
            
        } catch (error) {
            console.error('Error imprimiendo factura:', error);
            res.status(500).send('Error al generar la factura');
        }
    }
}

module.exports = FacturaController;
