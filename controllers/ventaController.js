const { pool } = require('../config/database');
const FacturaController = require('./facturaController');

class VentaController {
    // Buscar productos para la venta
    static async buscarProductos(req, res) {
        try {
            const { q } = req.query;
            
            if (!q || q.length < 2) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'El término de búsqueda debe tener al menos 2 caracteres' 
                });
            }
            
            console.log(`🔍 Buscando productos con término: "${q}"`);
            
            const query = `
                SELECT 
                    id,
                    codigo_producto,
                    nombre,
                    precio_venta,
                    stock_actual
                FROM productos 
                WHERE nombre ILIKE $1
                AND stock_actual > 0 
                AND activo = true
                ORDER BY nombre
                LIMIT 10
            `;
            
            const result = await pool.query(query, [`%${q}%`]);
            
            const productos = result.rows.map(p => ({
                id: p.id,
                codigo: p.codigo_producto,
                nombre: p.nombre,
                precio: parseFloat(p.precio_venta),
                stock: p.stock_actual
            }));
            
            console.log(`✅ Encontrados ${productos.length} productos`);
            res.json(productos);
            
        } catch (error) {
            console.error('Error buscando productos:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error al buscar productos' 
            });
        }
    }
    
    // Procesar una nueva venta (versión robusta)
    static async crearVenta(req, res) {
        console.log('🛒 Iniciando proceso de venta...');
        let client = null;
        
        try {
            const { cliente, productos, metodoPago, montoRecibido, subtotal, iva, total } = req.body;
            const usuarioId = req.usuario?.id || 1; // Fallback si no hay usuario
            
            console.log('📋 Datos recibidos:', {
                cliente: cliente?.nombre,
                productos: productos?.length,
                metodoPago,
                total
            });
            
            // Validaciones básicas
            if (!productos || productos.length === 0) {
                console.log('❌ No hay productos');
                return res.status(400).json({ 
                    success: false, 
                    message: 'Debe agregar al menos un producto a la venta' 
                });
            }
            
            if (!cliente || !cliente.nombre) {
                console.log('❌ Falta información del cliente');
                return res.status(400).json({ 
                    success: false, 
                    message: 'Información del cliente requerida' 
                });
            }
            
            if (!total || total <= 0) {
                console.log('❌ Total inválido');
                return res.status(400).json({ 
                    success: false, 
                    message: 'Total de venta inválido' 
                });
            }
            
            // Obtener conexión del pool
            client = await pool.connect();
            console.log('✅ Conexión a base de datos obtenida');
            
            // Iniciar transacción
            await client.query('BEGIN');
            console.log('🔄 Transacción iniciada');
            
            // Verificar stock de productos de forma más segura
            console.log('📦 Verificando stock...');
            for (const item of productos) {
                try {
                    const stockQuery = 'SELECT stock_actual FROM productos WHERE id = $1';
                    const stockResult = await client.query(stockQuery, [item.id]);
                    
                    if (stockResult.rows.length === 0) {
                        throw new Error(`Producto con ID ${item.id} no encontrado`);
                    }
                    
                    const stockDisponible = parseInt(stockResult.rows[0].stock_actual);
                    const cantidadSolicitada = parseInt(item.cantidad);
                    
                    if (stockDisponible < cantidadSolicitada) {
                        throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${stockDisponible}, solicitado: ${cantidadSolicitada}`);
                    }
                    
                    console.log(`✅ Stock verificado para ${item.nombre}: ${stockDisponible} >= ${cantidadSolicitada}`);
                } catch (stockError) {
                    await client.query('ROLLBACK');
                    console.error('❌ Error verificando stock:', stockError.message);
                    return res.status(400).json({ 
                        success: false, 
                        message: stockError.message
                    });
                }
            }
            
            // Generar número de factura simple y seguro
            const numeroFactura = await VentaController.generarNumeroFacturaSeguro();
            console.log(`📄 Número de factura generado: ${numeroFactura}`);
            
            // Preparar observaciones con todos los datos del cliente y productos
            const observaciones = JSON.stringify({
                cliente: {
                    documento: cliente.documento || null,
                    nombre: cliente.nombre,
                    telefono: cliente.telefono || null,
                    tipo: cliente.tipo || 'consumidor_final'
                },
                pago: {
                    metodo: metodoPago,
                    monto_recibido: montoRecibido || total,
                    cambio: metodoPago === 'efectivo' ? ((montoRecibido || total) - total) : 0
                },
                productos: productos.map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    cantidad: p.cantidad,
                    precio: p.precio,
                    subtotal: p.cantidad * p.precio
                }))
            });
            
            // Insertar venta principal - solo campos que sabemos que existen
            console.log('💾 Creando registro de venta...');
            const ventaQuery = `
                INSERT INTO ventas (
                    numero_factura, 
                    usuario_id, 
                    subtotal, 
                    iva, 
                    total, 
                    metodo_pago, 
                    estado, 
                    observaciones, 
                    fecha_venta
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                RETURNING *
            `;
            
            const ventaResult = await client.query(ventaQuery, [
                numeroFactura,
                usuarioId,
                subtotal || (total - (iva || 0)),
                iva || 0,
                total,
                metodoPago || 'efectivo',
                'completada',
                observaciones
            ]);
            
            const venta = ventaResult.rows[0];
            console.log(`✅ Venta creada con ID: ${venta.id}`);
            
            // Actualizar stock de productos
            console.log('📦 Actualizando stock...');
            for (const item of productos) {
                try {
                    const updateStockQuery = `
                        UPDATE productos 
                        SET stock_actual = stock_actual - $1 
                        WHERE id = $2 AND stock_actual >= $1
                        RETURNING stock_actual
                    `;
                    
                    const updateResult = await client.query(updateStockQuery, [item.cantidad, item.id]);
                    
                    if (updateResult.rows.length === 0) {
                        throw new Error(`No se pudo actualizar stock para producto ID ${item.id}`);
                    }
                    
                    const nuevoStock = updateResult.rows[0].stock_actual;
                    console.log(`✅ Stock actualizado para producto ${item.id}: nuevo stock = ${nuevoStock}`);
                    
                } catch (updateError) {
                    await client.query('ROLLBACK');
                    console.error('❌ Error actualizando stock:', updateError.message);
                    return res.status(500).json({ 
                        success: false, 
                        message: `Error actualizando inventario: ${updateError.message}`
                    });
                }
            }
            
            // Confirmar transacción
            await client.query('COMMIT');
            console.log('✅ Transacción confirmada');
            
            // Crear factura completa
            console.log('📄 Creando factura para la venta...');
            const facturaResult = await FacturaController.crearFacturaDesdeVenta({
                cliente: cliente,
                productos: productos,
                metodoPago: metodoPago,
                montoRecibido: montoRecibido,
                subtotal: subtotal || (total - (iva || 0)),
                iva: iva || 0,
                total: total
            }, venta.id);
            
            // Respuesta exitosa
            const respuesta = {
                success: true,
                message: 'Venta procesada exitosamente',
                venta: {
                    id: venta.id,
                    numero_factura: venta.numero_factura,
                    fecha_venta: venta.fecha_venta,
                    total: venta.total,
                    metodo_pago: venta.metodo_pago,
                    estado: venta.estado
                },
                numeroFactura: numeroFactura,
                factura: facturaResult.success ? {
                    id: facturaResult.factura?.id,
                    numero: facturaResult.numeroFactura
                } : null
            };
            
            if (facturaResult.success) {
                console.log(`📄 Factura ${facturaResult.numeroFactura} creada exitosamente`);
            } else {
                console.log(`⚠️ Venta exitosa pero error creando factura: ${facturaResult.error}`);
            }
            
            console.log('🎉 Venta procesada exitosamente');
            res.status(201).json(respuesta);
            
        } catch (error) {
            // Manejar cualquier error
            if (client) {
                try {
                    await client.query('ROLLBACK');
                    console.log('🔄 Transacción revertida');
                } catch (rollbackError) {
                    console.error('❌ Error en rollback:', rollbackError.message);
                }
            }
            
            console.error('❌ Error en crearVenta:', error.message);
            console.error('Stack:', error.stack);
            
            res.status(500).json({ 
                success: false, 
                message: 'Error procesando la venta. Intente nuevamente.' 
            });
            
        } finally {
            // Liberar conexión
            if (client) {
                try {
                    client.release();
                    console.log('🔌 Conexión liberada');
                } catch (releaseError) {
                    console.error('❌ Error liberando conexión:', releaseError.message);
                }
            }
        }
    }
    
    // Método auxiliar para generar números de factura seguros
    static async generarNumeroFacturaSeguro() {
        try {
            const fecha = new Date();
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            
            // Buscar el último número del día
            const query = `
                SELECT numero_factura 
                FROM ventas 
                WHERE numero_factura LIKE $1
                ORDER BY id DESC 
                LIMIT 1
            `;
            
            const prefijo = `${año}${mes}${dia}`;
            const result = await pool.query(query, [`${prefijo}%`]);
            
            let siguienteNumero = 1;
            
            if (result.rows.length > 0) {
                const ultimoNumero = result.rows[0].numero_factura;
                const match = ultimoNumero.match(/\d{8}-(\d+)$/);
                if (match) {
                    siguienteNumero = parseInt(match[1]) + 1;
                }
            }
            
            return `${prefijo}-${String(siguienteNumero).padStart(6, '0')}`;
            
        } catch (error) {
            console.error('Error generando número de factura:', error.message);
            // Fallback: usar timestamp
            return `F-${Date.now()}`;
        }
    }

    // Método original (respaldo)
    static async crearVentaOriginal(req, res) {
        const client = await pool.connect();
        
        try {
            const { cliente, productos, metodoPago, montoRecibido, subtotal, iva, total } = req.body;
            const usuarioId = req.usuario.id;
            
            // Validaciones
            if (!productos || productos.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Debe agregar al menos un producto a la venta' 
                });
            }
            
            if (!cliente || !cliente.nombre) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Información del cliente requerida' 
                });
            }
            
            // Iniciar transacción
            await client.query('BEGIN');
            
            // Verificar stock de productos
            for (const item of productos) {
                const stockQuery = 'SELECT stock_actual as stock FROM productos WHERE id = $1';
                const stockResult = await client.query(stockQuery, [item.id]);
                
                if (stockResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ 
                        success: false, 
                        message: `Producto con ID ${item.id} no encontrado` 
                    });
                }
                
                if (stockResult.rows[0].stock < item.cantidad) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ 
                        success: false, 
                        message: `Stock insuficiente para el producto con ID ${item.id}` 
                    });
                }
            }
            
            // Generar número de venta
            const numeroVenta = await this.generarNumeroVenta();
            
            // Buscar o crear cliente si se proporciona documento
            let clienteId = null;
            
            if (cliente.documento && cliente.tipo === 'registrado') {
                try {
                    // Buscar cliente existente
                    const buscarClienteQuery = 'SELECT id FROM clientes WHERE documento = $1';
                    const clienteExistente = await client.query(buscarClienteQuery, [cliente.documento]);
                    
                    if (clienteExistente.rows.length > 0) {
                        clienteId = clienteExistente.rows[0].id;
                    } else {
                        // Crear nuevo cliente
                        const crearClienteQuery = `
                            INSERT INTO clientes (documento, nombre, telefono, tipo_cliente)
                            VALUES ($1, $2, $3, $4)
                        RETURNING id
                    `;
                    const nuevoCliente = await client.query(crearClienteQuery, [
                        cliente.documento,
                        cliente.nombre,
                        cliente.telefono || null,
                        'registrado'
                    ]);
                    clienteId = nuevoCliente.rows[0].id;
                }
                } catch (clienteError) {
                    // La tabla clientes no existe, continuar sin cliente_id
                    console.log('Tabla clientes no existe, continuando sin registro de cliente');
                    clienteId = null;
                }
            }
            
            // Crear la venta usando tu estructura existente
            const ventaQuery = `
                INSERT INTO ventas (
                    numero_factura, usuario_id, cliente_id, subtotal, iva, total, 
                    metodo_pago, estado, observaciones, fecha_venta
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                RETURNING *
            `;
            
            const observaciones = JSON.stringify({
                cliente_documento: cliente.documento || null,
                cliente_nombre: cliente.nombre,
                cliente_telefono: cliente.telefono || null,
                cliente_tipo: cliente.tipo || 'consumidor_final',
                monto_recibido: montoRecibido,
                cambio: metodoPago === 'efectivo' ? (montoRecibido - total) : null
            });
            
            const ventaValues = [
                numeroVenta, // Usar numero_factura
                usuarioId,
                clienteId, // null para consumidor final
                subtotal,
                iva,
                total,
                metodoPago,
                'Completada', // Tu tabla usa 'Completada'
                observaciones // Guardar info del cliente en observaciones
            ];
            
            const ventaResult = await client.query(ventaQuery, ventaValues);
            const venta = ventaResult.rows[0];
            
            // Crear los detalles de venta y actualizar stock
            const detallesVenta = [];
            
            for (const item of productos) {
                // Insertar detalle de venta (si la tabla existe)
                try {
                    const detalleQuery = `
                        INSERT INTO detalle_ventas (
                            venta_id, producto_id, cantidad, precio_unitario, subtotal
                        ) VALUES ($1, $2, $3, $4, $5)
                        RETURNING *, (SELECT codigo_producto FROM productos WHERE id = $2) as codigo,
                                     (SELECT nombre FROM productos WHERE id = $2) as nombre
                    `;
                    
                    const detalleResult = await client.query(detalleQuery, [
                        venta.id,
                        item.id,
                        item.cantidad,
                        item.precio,
                        item.cantidad * item.precio
                    ]);
                    
                    detallesVenta.push(detalleResult.rows[0]);
                } catch (detalleError) {
                    console.log('Tabla detalle_ventas no existe, guardando en JSON de venta');
                }
                
                // Actualizar stock del producto
                const stockUpdateQuery = 'UPDATE productos SET stock_actual = stock_actual - $1 WHERE id = $2';
                await client.query(stockUpdateQuery, [item.cantidad, item.id]);
                
                // Registrar movimiento de inventario
                try {
                    const movimientoQuery = `
                        INSERT INTO movimientos (
                            producto_id, tipo_movimiento, cantidad, motivo, usuario_id, fecha_movimiento
                        ) VALUES ($1, $2, $3, $4, $5, NOW())
                    `;
                    
                    await client.query(movimientoQuery, [
                        item.id,
                        'salida',
                        item.cantidad,
                        `Venta ${numeroVenta}`,
                        usuarioId
                    ]);
                } catch (movError) {
                    console.error('Error al registrar movimiento:', movError);
                }
            }
            
            // Confirmar transacción
            await client.query('COMMIT');
            
            res.status(201).json({
                success: true,
                message: 'Venta procesada exitosamente',
                venta: {
                    ...venta,
                    detalles: detallesVenta
                },
                numeroVenta: numeroVenta
            });
            
        } catch (error) {
            // Revertir transacción en caso de error
            await client.query('ROLLBACK');
            console.error('Error en crearVenta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        } finally {
            client.release();
        }
    }
    
    // Obtener historial de ventas
    static async obtenerVentas(req, res) {
        try {
            const { page = 1, limit = 20, desde, hasta } = req.query;
            const offset = (page - 1) * limit;
            
            let whereConditions = [];
            let queryParams = [];
            let paramCount = 0;
            
            // Filtros de fecha
            if (desde) {
                paramCount++;
                whereConditions.push(`fecha_venta >= $${paramCount}`);
                queryParams.push(desde);
            }
            if (hasta) {
                paramCount++;
                whereConditions.push(`fecha_venta <= $${paramCount}`);
                queryParams.push(hasta);
            }
            
            const whereClause = whereConditions.length > 0 ? 
                `WHERE ${whereConditions.join(' AND ')}` : '';
            
            // Query para obtener ventas con información del usuario y cliente
            const ventasQuery = `
                SELECT v.*, u.nombre as usuario_nombre, u.email as usuario_email,
                       c.documento as cliente_documento, c.nombre as cliente_nombre,
                       c.telefono as cliente_telefono
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                LEFT JOIN clientes c ON v.cliente_id = c.id
                ${whereClause}
                ORDER BY v.fecha_venta DESC
                LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
            `;
            
            queryParams.push(limit, offset);
            
            // Query para contar total
            const countQuery = `
                SELECT COUNT(*) as total
                FROM ventas v
                ${whereClause}
            `;
            
            const [ventasResult, countResult] = await Promise.all([
                pool.query(ventasQuery, queryParams),
                pool.query(countQuery, queryParams.slice(0, paramCount))
            ]);
            
            const ventas = ventasResult.rows;
            const total = parseInt(countResult.rows[0].total);
            
            // Procesar datos de cliente desde observaciones si no hay cliente_id
            for (const venta of ventas) {
                // Si no hay cliente registrado, extraer de observaciones
                if (!venta.cliente_id && venta.observaciones) {
                    try {
                        const observaciones = JSON.parse(venta.observaciones);
                        venta.cliente_documento = observaciones.cliente_documento;
                        venta.cliente_nombre = observaciones.cliente_nombre;
                        venta.cliente_telefono = observaciones.cliente_telefono;
                        venta.monto_recibido = observaciones.monto_recibido;
                        venta.cambio = observaciones.cambio;
                    } catch (e) {
                        // Observaciones no está en formato JSON
                    }
                }
                
                // Obtener detalles de la venta
                try {
                    const detalleQuery = `
                        SELECT dv.*, p.codigo_producto as codigo, p.nombre
                        FROM detalle_ventas dv
                        JOIN productos p ON dv.producto_id = p.id
                        WHERE dv.venta_id = $1
                    `;
                    const detalleResult = await pool.query(detalleQuery, [venta.id]);
                    venta.detalle_ventas = detalleResult.rows;
                } catch (error) {
                    venta.detalle_ventas = [];
                }
            }
            
            res.json({
                success: true,
                ventas: ventas,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            });
            
        } catch (error) {
            console.error('Error en obtenerVentas:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }
    }
    
    // Obtener detalles de una venta específica
    static async obtenerVentaPorId(req, res) {
        try {
            const { id } = req.params;
            
            // Obtener información de la venta con cliente
            const ventaQuery = `
                SELECT v.*, u.nombre as usuario_nombre, u.email as usuario_email,
                       c.documento as cliente_documento, c.nombre as cliente_nombre,
                       c.telefono as cliente_telefono
                FROM ventas v
                LEFT JOIN usuarios u ON v.usuario_id = u.id
                LEFT JOIN clientes c ON v.cliente_id = c.id
                WHERE v.id = $1
            `;
            
            const ventaResult = await pool.query(ventaQuery, [id]);
            
            if (ventaResult.rows.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Venta no encontrada' 
                });
            }
            
            const venta = ventaResult.rows[0];
            
            // Procesar observaciones si no hay cliente registrado
            if (!venta.cliente_id && venta.observaciones) {
                try {
                    const observaciones = JSON.parse(venta.observaciones);
                    venta.cliente_documento = observaciones.cliente_documento;
                    venta.cliente_nombre = observaciones.cliente_nombre;
                    venta.cliente_telefono = observaciones.cliente_telefono;
                    venta.monto_recibido = observaciones.monto_recibido;
                    venta.cambio = observaciones.cambio;
                } catch (e) {
                    // Observaciones no está en formato JSON
                }
            }
            
            // Obtener detalles de la venta
            try {
                const detalleQuery = `
                    SELECT dv.*, p.codigo_producto as codigo, p.nombre, 'unidad' as unidad_medida
                    FROM detalle_ventas dv
                    JOIN productos p ON dv.producto_id = p.id
                    WHERE dv.venta_id = $1
                `;
                const detalleResult = await pool.query(detalleQuery, [id]);
                venta.detalle_ventas = detalleResult.rows;
            } catch (error) {
                venta.detalle_ventas = [];
            }
            
            res.json({
                success: true,
                venta
            });
            
        } catch (error) {
            console.error('Error en obtenerVentaPorId:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }
    }
    
    // Buscar cliente por documento
    static async buscarCliente(req, res) {
        try {
            const { documento } = req.params;
            
            // Intentar buscar en tabla clientes si existe
            try {
                const clienteQuery = 'SELECT * FROM clientes WHERE documento = $1';
                const clienteResult = await pool.query(clienteQuery, [documento]);
                
                if (clienteResult.rows.length > 0) {
                    return res.json(clienteResult.rows[0]);
                }
            } catch (error) {
                // La tabla clientes no existe, buscar en ventas previas
                console.log('Tabla clientes no existe, buscando en historial de ventas');
            }
            
            // Como la tabla clientes no existe, buscar solo en el historial de ventas (observaciones)
            const ventaQuery = `
                SELECT observaciones
                FROM ventas
                WHERE observaciones LIKE $1
                ORDER BY fecha_venta DESC 
                LIMIT 1
            `;
            
            const ventaResult = await pool.query(ventaQuery, [`%"cliente_documento":"${documento}"%`]);
                
            if (ventaResult.rows.length > 0) {
                const venta = ventaResult.rows[0];
                
                if (venta.observaciones) {
                    // Cliente guardado en observaciones de ventas anteriores
                    try {
                        const observaciones = JSON.parse(venta.observaciones);
                        if (observaciones.cliente_documento === documento) {
                            return res.json({
                                documento: observaciones.cliente_documento,
                                nombre: observaciones.cliente_nombre || 'Cliente',
                                telefono: observaciones.cliente_telefono || ''
                            });
                        }
                    } catch (e) {
                        // Error parseando observaciones, continuar
                        console.log('Error parseando observaciones:', e.message);
                    }
                }
            }
            
            // Cliente no encontrado
            return res.status(404).json({ 
                success: false, 
                message: 'Cliente no encontrado' 
            });
            
        } catch (error) {
            console.error('Error en buscarCliente:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }
    }
    
    // Reportes de ventas
    static async reporteVentas(req, res) {
        try {
            const { desde, hasta, agrupado_por = 'dia' } = req.query;
            
            let whereConditions = ["estado = 'completada'"];
            let queryParams = [];
            let paramCount = 0;
            
            if (desde) {
                paramCount++;
                whereConditions.push(`fecha_venta >= $${paramCount}`);
                queryParams.push(desde);
            }
            if (hasta) {
                paramCount++;
                whereConditions.push(`fecha_venta <= $${paramCount}`);
                queryParams.push(hasta);
            }
            
            const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
            
            const query = `
                SELECT fecha_venta, total, metodo_pago, estado
                FROM ventas 
                ${whereClause}
                ORDER BY fecha_venta
            `;
            
            const result = await pool.query(query, queryParams);
            
            // Procesar datos para el reporte
            const reporte = this.procesarReporteVentas(result.rows, agrupado_por);
            
            res.json({
                success: true,
                reporte
            });
            
        } catch (error) {
            console.error('Error en reporteVentas:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor' 
            });
        }
    }
    
    // Generar número de venta único
    static async generarNumeroVenta() {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        
        // Buscar el último número del día en numero_factura
        const query = `
            SELECT numero_factura 
            FROM ventas 
            WHERE numero_factura LIKE $1
            ORDER BY numero_factura DESC 
            LIMIT 1
        `;
        
        const result = await pool.query(query, [`${año}${mes}${dia}-%`]);
        
        let siguienteNumero = 1;
        
        if (result.rows.length > 0) {
            const ultimoNumero = result.rows[0].numero_factura;
            const partes = ultimoNumero.split('-');
            if (partes.length === 2) {
                siguienteNumero = parseInt(partes[1]) + 1;
            }
        }
        
        return `${año}${mes}${dia}-${String(siguienteNumero).padStart(6, '0')}`;
    }
    
    // Procesar datos para reportes
    static procesarReporteVentas(ventas, agrupado_por) {
        const agrupado = {};
        const resumen = {
            total_ventas: 0,
            total_monto: 0,
            promedio_venta: 0,
            ventas_por_metodo: {}
        };
        
        ventas.forEach(venta => {
            const fecha = new Date(venta.fecha_venta);
            let clave;
            
            switch (agrupado_por) {
                case 'dia':
                    clave = fecha.toISOString().split('T')[0];
                    break;
                case 'semana':
                    const inicioSemana = new Date(fecha);
                    inicioSemana.setDate(fecha.getDate() - fecha.getDay());
                    clave = inicioSemana.toISOString().split('T')[0];
                    break;
                case 'mes':
                    clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                    break;
                default:
                    clave = fecha.toISOString().split('T')[0];
            }
            
            if (!agrupado[clave]) {
                agrupado[clave] = {
                    fecha: clave,
                    cantidad_ventas: 0,
                    monto_total: 0,
                    promedio: 0
                };
            }
            
            agrupado[clave].cantidad_ventas++;
            agrupado[clave].monto_total += parseFloat(venta.total);
            agrupado[clave].promedio = agrupado[clave].monto_total / agrupado[clave].cantidad_ventas;
            
            // Resumen general
            resumen.total_ventas++;
            resumen.total_monto += parseFloat(venta.total);
            
            if (!resumen.ventas_por_metodo[venta.metodo_pago]) {
                resumen.ventas_por_metodo[venta.metodo_pago] = 0;
            }
            resumen.ventas_por_metodo[venta.metodo_pago]++;
        });
        
        resumen.promedio_venta = resumen.total_ventas > 0 ? resumen.total_monto / resumen.total_ventas : 0;
        
        return {
            datos: Object.values(agrupado),
            resumen
        };
    }

    // Método auxiliar para generar números de factura seguros
    static async generarNumeroFacturaSeguro() {
        try {
            const fecha = new Date();
            const año = fecha.getFullYear();
            const mes = String(fecha.getMonth() + 1).padStart(2, '0');
            const dia = String(fecha.getDate()).padStart(2, '0');
            
            // Buscar el último número del día
            const query = `
                SELECT numero_factura 
                FROM ventas 
                WHERE numero_factura LIKE $1
                ORDER BY id DESC 
                LIMIT 1
            `;
            
            const prefijo = `${año}${mes}${dia}`;
            const result = await pool.query(query, [`${prefijo}%`]);
            
            let siguienteNumero = 1;
            
            if (result.rows.length > 0) {
                const ultimoNumero = result.rows[0].numero_factura;
                const match = ultimoNumero.match(/\d{8}-(\d+)$/);
                if (match) {
                    siguienteNumero = parseInt(match[1]) + 1;
                }
            }
            
            return `${prefijo}-${String(siguienteNumero).padStart(6, '0')}`;
            
        } catch (error) {
            console.error('Error generando número de factura:', error.message);
            // Fallback: usar timestamp
            return `F-${Date.now()}`;
        }
    }
}

module.exports = VentaController;
