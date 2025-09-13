const { pool } = require('../config/database');

class CategoriaController {
    
    // Obtener todas las categorías
    static async obtenerTodas(req, res) {
        try {
            const query = `
                SELECT 
                    id,
                    codigo_categoria,
                    nombre_categoria,
                    descripcion,
                    activo,
                    fecha_creacion,
                    fecha_actualizacion
                FROM categorias 
                WHERE activo = true
                ORDER BY nombre_categoria ASC
            `;
            
            const result = await pool.query(query);
            
            // Siempre devolver JSON para la API
            return res.json({
                success: true,
                categorias: result.rows
            });
            
        } catch (error) {
            console.error('Error obteniendo categorías:', error);
            
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(500).json({
                    success: false,
                    message: 'Error al obtener las categorías'
                });
            }
            
            res.status(500).send('Error del servidor');
        }
    }
    
    // Obtener una categoría por ID
    static async obtenerPorId(req, res) {
        try {
            const { id } = req.params;
            
            const query = `
                SELECT 
                    id,
                    codigo_categoria,
                    nombre_categoria,
                    descripcion,
                    activo,
                    fecha_creacion,
                    fecha_actualizacion
                FROM categorias 
                WHERE id = $1 AND activo = true
            `;
            
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }
            
            res.json({
                success: true,
                categoria: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error obteniendo categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la categoría'
            });
        }
    }
    
    // Crear nueva categoría
    static async crear(req, res) {
        try {
            const { codigo_categoria, nombre_categoria, descripcion } = req.body;
            
            // Validaciones
            if (!codigo_categoria || !nombre_categoria) {
                return res.status(400).json({
                    success: false,
                    message: 'El código y nombre de la categoría son obligatorios'
                });
            }
            
            // Verificar que no exista el código
            const queryExiste = `
                SELECT id FROM categorias 
                WHERE codigo_categoria = $1 AND activo = true
            `;
            
            const existeResult = await pool.query(queryExiste, [codigo_categoria]);
            
            if (existeResult.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una categoría con ese código'
                });
            }
            
            // Insertar nueva categoría
            const queryInsertar = `
                INSERT INTO categorias (codigo_categoria, nombre_categoria, descripcion)
                VALUES ($1, $2, $3)
                RETURNING id, codigo_categoria, nombre_categoria, descripcion, activo, fecha_creacion
            `;
            
            const result = await pool.query(queryInsertar, [
                codigo_categoria.toUpperCase(),
                nombre_categoria,
                descripcion || null
            ]);
            
            res.status(201).json({
                success: true,
                message: 'Categoría creada exitosamente',
                categoria: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error creando categoría:', error);
            
            // Si es error de duplicado
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una categoría con ese código o nombre'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al crear la categoría'
            });
        }
    }
    
    // Actualizar categoría
    static async actualizar(req, res) {
        try {
            const { id } = req.params;
            const { codigo_categoria, nombre_categoria, descripcion } = req.body;
            
            // Validaciones
            if (!codigo_categoria || !nombre_categoria) {
                return res.status(400).json({
                    success: false,
                    message: 'El código y nombre de la categoría son obligatorios'
                });
            }
            
            // Verificar que la categoría existe
            const queryExiste = `
                SELECT id FROM categorias 
                WHERE id = $1 AND activo = true
            `;
            
            const existeResult = await pool.query(queryExiste, [id]);
            
            if (existeResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }
            
            // Verificar que no exista otro código igual (excepto el actual)
            const queryDuplicado = `
                SELECT id FROM categorias 
                WHERE codigo_categoria = $1 AND id != $2 AND activo = true
            `;
            
            const duplicadoResult = await pool.query(queryDuplicado, [codigo_categoria, id]);
            
            if (duplicadoResult.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otra categoría con ese código'
                });
            }
            
            // Actualizar categoría
            const queryActualizar = `
                UPDATE categorias 
                SET 
                    codigo_categoria = $1,
                    nombre_categoria = $2,
                    descripcion = $3,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING id, codigo_categoria, nombre_categoria, descripcion, activo, fecha_creacion, fecha_actualizacion
            `;
            
            const result = await pool.query(queryActualizar, [
                codigo_categoria.toUpperCase(),
                nombre_categoria,
                descripcion || null,
                id
            ]);
            
            res.json({
                success: true,
                message: 'Categoría actualizada exitosamente',
                categoria: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error actualizando categoría:', error);
            
            if (error.code === '23505') {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una categoría con ese código o nombre'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la categoría'
            });
        }
    }
    
    // Eliminar categoría (soft delete)
    static async eliminar(req, res) {
        try {
            const { id } = req.params;
            
            console.log('🗑️ Intentando eliminar categoría ID:', id);
            
            // Verificar que la categoría existe
            const queryExiste = `
                SELECT id, nombre_categoria FROM categorias 
                WHERE id = $1 AND activo = true
            `;
            
            const existeResult = await pool.query(queryExiste, [id]);
            
            console.log('📋 Resultado búsqueda categoría:', existeResult.rows);
            
            if (existeResult.rows.length === 0) {
                console.log('❌ Categoría no encontrada con ID:', id);
                return res.status(404).json({
                    success: false,
                    message: 'Categoría no encontrada'
                });
            }
            
            // Verificar si tiene productos asociados
            const queryProductos = `
                SELECT COUNT(*) as total
                FROM productos 
                WHERE categoria_id = $1 AND activo = true
            `;
            
            const productosResult = await pool.query(queryProductos, [id]);
            
            console.log('📦 Productos asociados:', productosResult.rows[0].total);
            
            if (parseInt(productosResult.rows[0].total) > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede eliminar la categoría porque tiene productos asociados'
                });
            }
            
            // Realizar soft delete
            const queryEliminar = `
                UPDATE categorias 
                SET 
                    activo = false,
                    fecha_actualizacion = CURRENT_TIMESTAMP
                WHERE id = $1
            `;
            
            const result = await pool.query(queryEliminar, [id]);
            
            console.log('✅ Categoría eliminada, filas afectadas:', result.rowCount);
            
            res.json({
                success: true,
                message: 'Categoría eliminada exitosamente'
            });
            
        } catch (error) {
            console.error('❌ Error eliminando categoría:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar la categoría'
            });
        }
    }
    
    // Buscar categorías
    static async buscar(req, res) {
        try {
            const { q } = req.query; // query parameter
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    message: 'Parámetro de búsqueda requerido'
                });
            }
            
            const query = `
                SELECT 
                    id,
                    codigo_categoria,
                    nombre_categoria,
                    descripcion,
                    activo,
                    fecha_creacion
                FROM categorias 
                WHERE activo = true
                AND (
                    LOWER(codigo_categoria) LIKE LOWER($1) 
                    OR LOWER(nombre_categoria) LIKE LOWER($1)
                    OR LOWER(descripcion) LIKE LOWER($1)
                )
                ORDER BY nombre_categoria ASC
                LIMIT 50
            `;
            
            const searchTerm = `%${q}%`;
            const result = await pool.query(query, [searchTerm]);
            
            res.json({
                success: true,
                categorias: result.rows,
                total: result.rows.length
            });
            
        } catch (error) {
            console.error('Error buscando categorías:', error);
            res.status(500).json({
                success: false,
                message: 'Error al buscar categorías'
            });
        }
    }
}

module.exports = CategoriaController;
