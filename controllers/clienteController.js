const { pool } = require('../config/database');

class ClienteController {
    
    // Listar todos los clientes con filtros y paginación
    static async listarClientes(req, res) {
        try {
            const { 
                documento, 
                nombre, 
                estado,
                page = 1, 
                limit = 50 
            } = req.query;

            console.log('📋 Listando clientes con filtros:', { documento, nombre, estado, page, limit });

            let query = `
                SELECT 
                    id,
                    codigo_cliente,
                    tipo_cliente,
                    tipo_documento,
                    numero_documento,
                    nombres,
                    apellidos,
                    razon_social,
                    telefono,
                    email,
                    direccion,
                    ciudad,
                    departamento,
                    fecha_nacimiento,
                    activo,
                    fecha_creacion,
                    fecha_actualizacion
                FROM clientes 
                WHERE 1=1
            `;
            
            const params = [];
            let paramCount = 0;

            // Filtros opcionales
            if (documento) {
                query += ` AND numero_documento ILIKE $${++paramCount}`;
                params.push(`%${documento}%`);
            }

            if (nombre) {
                query += ` AND (nombres ILIKE $${++paramCount} OR apellidos ILIKE $${paramCount} OR razon_social ILIKE $${paramCount})`;
                params.push(`%${nombre}%`);
            }

            if (estado && estado !== 'todos') {
                if (estado === 'activo') {
                    query += ` AND activo = $${++paramCount}`;
                    params.push(true);
                } else if (estado === 'inactivo') {
                    query += ` AND activo = $${++paramCount}`;
                    params.push(false);
                }
            }

            query += ` ORDER BY nombres, apellidos, razon_social`;
            
            // Paginación
            const offset = (page - 1) * limit;
            query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            // Contar total de registros para paginación
            let countQuery = `SELECT COUNT(*) FROM clientes WHERE 1=1`;
            const countParams = [];
            let countParamCount = 0;
            
            if (documento) {
                countQuery += ` AND numero_documento ILIKE $${++countParamCount}`;
                countParams.push(`%${documento}%`);
            }
            
            if (nombre) {
                countQuery += ` AND (nombres ILIKE $${++countParamCount} OR apellidos ILIKE $${countParamCount} OR razon_social ILIKE $${countParamCount})`;
                countParams.push(`%${nombre}%`);
            }
            
            if (estado && estado !== 'todos') {
                if (estado === 'activo') {
                    countQuery += ` AND activo = $${++countParamCount}`;
                    countParams.push(true);
                } else if (estado === 'inactivo') {
                    countQuery += ` AND activo = $${++countParamCount}`;
                    countParams.push(false);
                }
            }

            const countResult = await pool.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].count);

            // Mapear los campos de la BD a los que espera el frontend
            const clientesMapeados = result.rows.map(cliente => ({
                id: cliente.id,
                codigo_cliente: cliente.codigo_cliente,
                tipo_cliente: cliente.tipo_cliente,
                tipo_documento: cliente.tipo_documento,
                numero_documento: cliente.numero_documento,
                // Mapear nombres/apellidos para compatibilidad con frontend
                nombre: cliente.nombres,
                apellido: cliente.apellidos,
                razon_social: cliente.razon_social,
                telefono: cliente.telefono,
                email: cliente.email,
                direccion: cliente.direccion,
                ciudad: cliente.ciudad,
                departamento: cliente.departamento,
                fecha_nacimiento: cliente.fecha_nacimiento,
                // Mapear estado booleano a string para compatibilidad
                estado: cliente.activo ? 'activo' : 'inactivo',
                activo: cliente.activo,
                fecha_creacion: cliente.fecha_creacion,
                fecha_actualizacion: cliente.fecha_actualizacion
            }));

            console.log(`✅ ${clientesMapeados.length} clientes encontrados de ${total} total`);

            res.json({
                success: true,
                clientes: clientesMapeados,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('❌ Error al listar clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener cliente por ID
    static async obtenerCliente(req, res) {
        try {
            const { id } = req.params;

            console.log(`🔍 Obteniendo cliente con ID: ${id}`);

            const query = `
                SELECT * FROM clientes 
                WHERE id = $1
            `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            const cliente = result.rows[0];
            
            // Mapear campos para compatibilidad con frontend
            const clienteMapeado = {
                id: cliente.id,
                codigo_cliente: cliente.codigo_cliente,
                tipo_cliente: cliente.tipo_cliente,
                tipo_documento: cliente.tipo_documento,
                numero_documento: cliente.numero_documento,
                nombre: cliente.nombres,
                apellido: cliente.apellidos,
                razon_social: cliente.razon_social,
                telefono: cliente.telefono,
                email: cliente.email,
                direccion: cliente.direccion,
                ciudad: cliente.ciudad,
                departamento: cliente.departamento,
                fecha_nacimiento: cliente.fecha_nacimiento,
                estado: cliente.activo ? 'activo' : 'inactivo',
                activo: cliente.activo,
                fecha_creacion: cliente.fecha_creacion,
                fecha_actualizacion: cliente.fecha_actualizacion
            };

            console.log('✅ Cliente encontrado:', clienteMapeado.nombre || clienteMapeado.razon_social);

            res.json({
                success: true,
                cliente: clienteMapeado
            });

        } catch (error) {
            console.error('❌ Error al obtener cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Crear nuevo cliente
    static async crearCliente(req, res) {
        try {
            const {
                codigo_cliente,
                tipo_cliente,
                tipo_documento,
                numero_documento,
                // Aceptar tanto 'nombres' como 'nombre' para compatibilidad
                nombres,
                nombre,
                apellidos,
                apellido,
                razon_social,
                telefono,
                email,
                direccion,
                ciudad,
                departamento,
                fecha_nacimiento
            } = req.body;

            // Usar los campos con compatibilidad frontend/backend
            const nombresFinales = nombres || nombre;
            const apellidosFinales = apellidos || apellido;

            console.log('➕ Creando nuevo cliente:', { nombresFinales, apellidosFinales, razon_social, numero_documento });

            // Validaciones básicas
            if (!numero_documento || (!nombresFinales && !razon_social)) {
                return res.status(400).json({
                    success: false,
                    message: 'El número de documento y nombre/razón social son requeridos'
                });
            }

            // Verificar si el documento ya existe
            const existeQuery = `
                SELECT id FROM clientes 
                WHERE numero_documento = $1
            `;
            const existeResult = await pool.query(existeQuery, [numero_documento]);

            if (existeResult.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un cliente con ese número de documento'
                });
            }

            const query = `
                INSERT INTO clientes (
                    codigo_cliente, tipo_cliente, tipo_documento, numero_documento, 
                    nombres, apellidos, razon_social, telefono, email, direccion, 
                    ciudad, departamento, fecha_nacimiento, activo, 
                    fecha_creacion, fecha_actualizacion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            `;

            const values = [
                codigo_cliente || null,
                tipo_cliente || 'Natural',
                tipo_documento || 'CC',
                numero_documento,
                nombresFinales || null,
                apellidosFinales || null,
                razon_social || null,
                telefono || null,
                email || null,
                direccion || null,
                ciudad || null,
                departamento || null,
                fecha_nacimiento || null,
                true
            ];

            const result = await pool.query(query, values);

            const cliente = result.rows[0];
            
            // Mapear campos para compatibilidad con frontend
            const clienteMapeado = {
                id: cliente.id,
                codigo_cliente: cliente.codigo_cliente,
                tipo_cliente: cliente.tipo_cliente,
                tipo_documento: cliente.tipo_documento,
                numero_documento: cliente.numero_documento,
                nombre: cliente.nombres,
                apellido: cliente.apellidos,
                razon_social: cliente.razon_social,
                telefono: cliente.telefono,
                email: cliente.email,
                direccion: cliente.direccion,
                ciudad: cliente.ciudad,
                departamento: cliente.departamento,
                fecha_nacimiento: cliente.fecha_nacimiento,
                estado: cliente.activo ? 'activo' : 'inactivo',
                activo: cliente.activo,
                fecha_creacion: cliente.fecha_creacion,
                fecha_actualizacion: cliente.fecha_actualizacion
            };

            console.log('✅ Cliente creado exitosamente:', clienteMapeado.id);

            res.status(201).json({
                success: true,
                message: 'Cliente creado exitosamente',
                cliente: clienteMapeado
            });

        } catch (error) {
            console.error('❌ Error al crear cliente:', error);
            
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un cliente con ese número de documento'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar cliente
    static async actualizarCliente(req, res) {
        try {
            const { id } = req.params;
            const {
                codigo_cliente,
                tipo_cliente,
                tipo_documento,
                numero_documento,
                // Aceptar tanto 'nombres' como 'nombre' para compatibilidad
                nombres,
                nombre,
                apellidos,
                apellido,
                razon_social,
                telefono,
                email,
                direccion,
                ciudad,
                departamento,
                fecha_nacimiento,
                activo,
                estado
            } = req.body;

            // Usar los campos con compatibilidad frontend/backend  
            const nombresFinales = nombres || nombre;
            const apellidosFinales = apellidos || apellido;
            const activoFinal = activo !== undefined ? activo : (estado === 'activo' ? true : estado === 'inactivo' ? false : undefined);

            console.log(`📝 Actualizando cliente ID: ${id}`);

            // Verificar si el cliente existe
            const existeQuery = `SELECT id FROM clientes WHERE id = $1`;
            const existeResult = await pool.query(existeQuery, [id]);

            if (existeResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            // Verificar documento duplicado (excluyendo el cliente actual)
            if (numero_documento) {
                const docQuery = `
                    SELECT id FROM clientes 
                    WHERE numero_documento = $1 AND id != $2
                `;
                const docResult = await pool.query(docQuery, [numero_documento, id]);

                if (docResult.rows.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe otro cliente con ese número de documento'
                    });
                }
            }

            const query = `
                UPDATE clientes SET
                    codigo_cliente = COALESCE($1, codigo_cliente),
                    tipo_cliente = COALESCE($2, tipo_cliente),
                    tipo_documento = COALESCE($3, tipo_documento),
                    numero_documento = COALESCE($4, numero_documento),
                    nombres = COALESCE($5, nombres),
                    apellidos = COALESCE($6, apellidos),
                    razon_social = COALESCE($7, razon_social),
                    telefono = COALESCE($8, telefono),
                    email = COALESCE($9, email),
                    direccion = COALESCE($10, direccion),
                    ciudad = COALESCE($11, ciudad),
                    departamento = COALESCE($12, departamento),
                    fecha_nacimiento = COALESCE($13, fecha_nacimiento),
                    activo = COALESCE($14, activo),
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $15
                RETURNING *
            `;

            const values = [
                codigo_cliente, tipo_cliente, tipo_documento, numero_documento,
                nombresFinales, apellidosFinales, razon_social, telefono, email, direccion, 
                ciudad, departamento, fecha_nacimiento, activoFinal, id
            ];

            const result = await pool.query(query, values);

            const cliente = result.rows[0];
            
            // Mapear campos para compatibilidad con frontend
            const clienteMapeado = {
                id: cliente.id,
                codigo_cliente: cliente.codigo_cliente,
                tipo_cliente: cliente.tipo_cliente,
                tipo_documento: cliente.tipo_documento,
                numero_documento: cliente.numero_documento,
                nombre: cliente.nombres,
                apellido: cliente.apellidos,
                razon_social: cliente.razon_social,
                telefono: cliente.telefono,
                email: cliente.email,
                direccion: cliente.direccion,
                ciudad: cliente.ciudad,
                departamento: cliente.departamento,
                fecha_nacimiento: cliente.fecha_nacimiento,
                estado: cliente.activo ? 'activo' : 'inactivo',
                activo: cliente.activo,
                fecha_creacion: cliente.fecha_creacion,
                fecha_actualizacion: cliente.fecha_actualizacion
            };

            console.log('✅ Cliente actualizado exitosamente');

            res.json({
                success: true,
                message: 'Cliente actualizado exitosamente',
                cliente: clienteMapeado
            });

        } catch (error) {
            console.error('❌ Error al actualizar cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Cambiar estado del cliente
    static async cambiarEstadoCliente(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            console.log(`🔄 Cambiando estado del cliente ID: ${id} a ${activo ? 'activo' : 'inactivo'}`);

            if (typeof activo !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'Estado no válido. Debe ser: true (activo) o false (inactivo)'
                });
            }

            const query = `
                UPDATE clientes 
                SET activo = $1, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
            `;

            const result = await pool.query(query, [activo, id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            const cliente = result.rows[0];
            
            // Mapear campos para compatibilidad con frontend
            const clienteMapeado = {
                id: cliente.id,
                codigo_cliente: cliente.codigo_cliente,
                tipo_cliente: cliente.tipo_cliente,
                tipo_documento: cliente.tipo_documento,
                numero_documento: cliente.numero_documento,
                nombre: cliente.nombres,
                apellido: cliente.apellidos,
                razon_social: cliente.razon_social,
                telefono: cliente.telefono,
                email: cliente.email,
                direccion: cliente.direccion,
                ciudad: cliente.ciudad,
                departamento: cliente.departamento,
                fecha_nacimiento: cliente.fecha_nacimiento,
                estado: cliente.activo ? 'activo' : 'inactivo',
                activo: cliente.activo,
                fecha_creacion: cliente.fecha_creacion,
                fecha_actualizacion: cliente.fecha_actualizacion
            };

            console.log(`✅ Estado cambiado a: ${activo ? 'activo' : 'inactivo'}`);

            res.json({
                success: true,
                message: `Cliente ${activo ? 'activado' : 'desactivado'} exitosamente`,
                cliente: clienteMapeado
            });

        } catch (error) {
            console.error('❌ Error al cambiar estado del cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Eliminar cliente (soft delete)
    static async eliminarCliente(req, res) {
        try {
            const { id } = req.params;

            console.log(`🗑️ Eliminando cliente ID: ${id}`);

            // Verificar si el cliente existe
            const existeQuery = `SELECT nombres, apellidos, razon_social FROM clientes WHERE id = $1`;
            const existeResult = await pool.query(existeQuery, [id]);

            if (existeResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            const cliente = existeResult.rows[0];

            // Soft delete - cambiar estado en lugar de eliminar
            const query = `
                UPDATE clientes 
                SET activo = false, fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *
            `;

            const result = await pool.query(query, [id]);

            const clienteEliminado = result.rows[0];
            
            // Mapear campos para compatibilidad con frontend
            const clienteMapeado = {
                id: clienteEliminado.id,
                codigo_cliente: clienteEliminado.codigo_cliente,
                tipo_cliente: clienteEliminado.tipo_cliente,
                tipo_documento: clienteEliminado.tipo_documento,
                numero_documento: clienteEliminado.numero_documento,
                nombre: clienteEliminado.nombres,
                apellido: clienteEliminado.apellidos,
                razon_social: clienteEliminado.razon_social,
                telefono: clienteEliminado.telefono,
                email: clienteEliminado.email,
                direccion: clienteEliminado.direccion,
                ciudad: clienteEliminado.ciudad,
                departamento: clienteEliminado.departamento,
                fecha_nacimiento: clienteEliminado.fecha_nacimiento,
                estado: clienteEliminado.activo ? 'activo' : 'inactivo',
                activo: clienteEliminado.activo,
                fecha_creacion: clienteEliminado.fecha_creacion,
                fecha_actualizacion: clienteEliminado.fecha_actualizacion
            };

            const nombreCompleto = cliente.razon_social || `${cliente.nombres} ${cliente.apellidos || ''}`;
            console.log(`✅ Cliente eliminado: ${nombreCompleto}`);

            res.json({
                success: true,
                message: 'Cliente eliminado exitosamente',
                cliente: clienteMapeado
            });

        } catch (error) {
            console.error('❌ Error al eliminar cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Buscar clientes (para autocompletar en ventas)
    static async buscarClientes(req, res) {
        try {
            const { q } = req.query;

            if (!q || q.length < 2) {
                return res.json({
                    success: true,
                    clientes: []
                });
            }

            console.log(`🔍 Buscando clientes con: "${q}"`);

            const query = `
                SELECT 
                    id,
                    numero_documento,
                    nombres,
                    apellidos,
                    razon_social,
                    telefono,
                    COALESCE(razon_social, CONCAT(nombres, ' ', COALESCE(apellidos, ''))) as nombre_completo
                FROM clientes 
                WHERE activo = true
                AND (
                    numero_documento ILIKE $1 OR
                    nombres ILIKE $1 OR
                    apellidos ILIKE $1 OR
                    razon_social ILIKE $1 OR
                    CONCAT(nombres, ' ', apellidos) ILIKE $1
                )
                ORDER BY nombres, apellidos, razon_social
                LIMIT 10
            `;

            const result = await pool.query(query, [`%${q}%`]);

            // Mapear campos para compatibilidad con frontend
            const clientesMapeados = result.rows.map(cliente => ({
                id: cliente.id,
                numero_documento: cliente.numero_documento,
                nombre: cliente.nombres,
                apellido: cliente.apellidos,
                razon_social: cliente.razon_social,
                telefono: cliente.telefono,
                nombre_completo: cliente.nombre_completo
            }));

            console.log(`✅ ${clientesMapeados.length} clientes encontrados`);

            res.json({
                success: true,
                clientes: clientesMapeados
            });

        } catch (error) {
            console.error('❌ Error al buscar clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = ClienteController;