const { pool } = require('../config/database');

class ProveedorController {
    
    // Listar todos los proveedores con filtros y paginación
    static async listarProveedores(req, res) {
        try {
            const { 
                documento, 
                nombre, 
                estado,
                page = 1, 
                limit = 10 
            } = req.query;

            console.log('📋 Listando proveedores - página:', page, 'filtros activos:', Object.keys(req.query).length);

            let query = `
                SELECT 
                    id,
                    codigo_proveedor as tipo_documento,
                    nit as numero_documento,
                    razon_social as nombre,
                    telefono,
                    email,
                    ciudad,
                    direccion,
                    CASE WHEN activo = true THEN 'activo' ELSE 'inactivo' END as estado,
                    '' as nota,
                    fecha_creacion as fecha_registro,
                    fecha_actualizacion
                FROM proveedores 
                WHERE 1=1
            `;
            
            const params = [];
            let paramCount = 0;

            // Filtros opcionales
            if (documento) {
                query += ` AND nit ILIKE $${++paramCount}`;
                params.push(`%${documento}%`);
            }

            if (nombre) {
                query += ` AND razon_social ILIKE $${++paramCount}`;
                params.push(`%${nombre}%`);
            }

            if (estado && estado !== 'todos') {
                if (estado === 'activo') {
                    query += ` AND activo = true`;
                } else {
                    query += ` AND activo = false`;
                }
            }

            // Contar total de registros para paginación
            const countQuery = query.replace(
                /SELECT[\s\S]*?FROM/i, 
                'SELECT COUNT(*) as total FROM'
            );
            
            const countResult = await pool.query(countQuery, params);
            const total = parseInt(countResult.rows[0].total);

            // Agregar paginación
            const offset = (page - 1) * limit;
            query += ` ORDER BY fecha_creacion DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
            params.push(limit, offset);

            const result = await pool.query(query, params);

            console.log('✅ Proveedores encontrados:', result.rows.length);
            
            res.json({
                exito: true,
                proveedores: result.rows,
                paginacion: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('❌ Error al listar proveedores:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Obtener un proveedor por ID
    static async obtenerProveedor(req, res) {
        try {
            const { id } = req.params;

            console.log('🔍 Buscando proveedor con ID:', id);

            const query = `
                SELECT 
                    id,
                    codigo_proveedor as tipo_documento,
                    nit as numero_documento,
                    razon_social as nombre,
                    telefono,
                    email,
                    ciudad,
                    direccion,
                    CASE WHEN activo = true THEN 'activo' ELSE 'inactivo' END as estado,
                    '' as nota,
                    fecha_creacion as fecha_registro,
                    fecha_actualizacion
                FROM proveedores 
                WHERE id = $1
            `;

            const result = await pool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'Proveedor no encontrado'
                });
            }

            console.log('✅ Proveedor encontrado:', result.rows[0].nombre);
            
            res.json({
                exito: true,
                proveedor: result.rows[0]
            });

        } catch (error) {
            console.error('❌ Error al obtener proveedor:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Crear nuevo proveedor
    static async crearProveedor(req, res) {
        try {
            const {
                tipo_documento,
                numero_documento,
                nombre,
                telefono,
                email,
                ciudad,
                direccion,
                estado = 'activo',
                nota
            } = req.body;

            console.log('➕ Creando proveedor:', nombre);

            // Validaciones básicas
            if (!nombre || !telefono || !email || !ciudad || !direccion) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Todos los campos obligatorios son requeridos'
                });
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El formato del email no es válido'
                });
            }



            const query = `
                INSERT INTO proveedores (
                    codigo_proveedor,
                    nit,
                    razon_social,
                    telefono,
                    email,
                    ciudad,
                    direccion,
                    activo,
                    fecha_creacion
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                RETURNING *
            `;

            // Generar código único para el proveedor
            const tiempoActual = Date.now();
            const codigoUnico = `PROV_${tiempoActual}`;

            const values = [
                codigoUnico,          // codigo_proveedor único
                numero_documento || null,    // nit (puede ser null)
                nombre,
                telefono,
                email,
                ciudad,
                direccion,
                estado === 'activo'
            ];

            const result = await pool.query(query, values);

            console.log('✅ Proveedor creado exitosamente:', result.rows[0].id);

            res.status(201).json({
                exito: true,
                mensaje: 'Proveedor creado exitosamente',
                proveedor: result.rows[0]
            });

        } catch (error) {
            console.error('❌ Error al crear proveedor:', error);
            
            if (error.code === '23505') { // Violación de clave única
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Ya existe un proveedor con este número de documento'
                });
            }

            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Actualizar proveedor
    static async actualizarProveedor(req, res) {
        try {
            const { id } = req.params;
            const {
                tipo_documento,
                numero_documento,
                nombre,
                telefono,
                email,
                ciudad,
                direccion,
                estado,
                nota
            } = req.body;

            console.log('✏️ Actualizando proveedor ID:', id);

            // Validaciones
            if (!numero_documento || !nombre || !telefono || !email || !ciudad || !direccion) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Todos los campos obligatorios son requeridos'
                });
            }

            // Verificar si el proveedor existe
            const existeQuery = 'SELECT id FROM proveedores WHERE id = $1';
            const existeResult = await pool.query(existeQuery, [id]);

            if (existeResult.rows.length === 0) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'Proveedor no encontrado'
                });
            }

            // Validaciones básicas
            if (!nombre || !telefono || !email || !ciudad || !direccion) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Todos los campos obligatorios son requeridos'
                });
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El formato del email no es válido'
                });
            }

            const query = `
                UPDATE proveedores SET 
                    nit = $1,
                    razon_social = $2,
                    telefono = $3,
                    email = $4,
                    ciudad = $5,
                    direccion = $6,
                    activo = $7,
                    fecha_actualizacion = NOW()
                WHERE id = $8
                RETURNING *
            `;

            const values = [
                numero_documento || null,
                nombre,
                telefono,
                email,
                ciudad,
                direccion,
                estado === 'activo',
                id
            ];

            const result = await pool.query(query, values);

            console.log('✅ Proveedor actualizado exitosamente:', result.rows[0].nombre);

            res.json({
                exito: true,
                mensaje: 'Proveedor actualizado exitosamente',
                proveedor: result.rows[0]
            });

        } catch (error) {
            console.error('❌ Error al actualizar proveedor:', error);
            
            if (error.code === '23505') { // Violación de clave única
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Ya existe un proveedor con este número de documento'
                });
            }

            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Eliminar proveedor (soft delete)
    static async eliminarProveedor(req, res) {
        try {
            const { id } = req.params;

            console.log('🗑️ Eliminando proveedor ID:', id);

            // Verificar si el proveedor existe
            const existeQuery = 'SELECT id, razon_social FROM proveedores WHERE id = $1';
            const existeResult = await pool.query(existeQuery, [id]);

            if (existeResult.rows.length === 0) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'Proveedor no encontrado'
                });
            }

            // Cambiar estado a inactivo (soft delete)
            const query = `
                UPDATE proveedores SET 
                    activo = false,
                    fecha_actualizacion = NOW()
                WHERE id = $1
                RETURNING razon_social
            `;

            const result = await pool.query(query, [id]);

            console.log('✅ Proveedor eliminado exitosamente:', result.rows[0].razon_social);

            res.json({
                exito: true,
                mensaje: 'Proveedor eliminado exitosamente'
            });

        } catch (error) {
            console.error('❌ Error al eliminar proveedor:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Cambiar estado del proveedor
    static async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            console.log('🔄 Cambiando estado del proveedor ID:', id, 'a:', estado);

            const estadosValidos = ['activo', 'inactivo'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Estado no válido. Debe ser: activo o inactivo'
                });
            }

            const query = `
                UPDATE proveedores SET 
                    activo = $1,
                    fecha_actualizacion = NOW()
                WHERE id = $2
                RETURNING razon_social, activo
            `;

            const result = await pool.query(query, [estado === 'activo', id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'Proveedor no encontrado'
                });
            }

            console.log('✅ Estado cambiado exitosamente:', result.rows[0]);

            res.json({
                exito: true,
                mensaje: `Estado cambiado a ${estado} exitosamente`,
                proveedor: result.rows[0]
            });

        } catch (error) {
            console.error('❌ Error al cambiar estado:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = ProveedorController;