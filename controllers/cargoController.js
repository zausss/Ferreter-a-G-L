const { pool } = require('../config/database');

class CargoController {
    
    // Obtener todos los cargos activos
    static async obtenerCargos(req, res) {
        try {
            const query = `
                SELECT 
                    id,
                    nombre_cargo,
                    rol_sistema,
                    descripcion
                FROM cargos 
                WHERE activo = true
                ORDER BY nombre_cargo ASC
            `;
            
            const result = await pool.query(query);
            
            res.json(result.rows);
            
        } catch (error) {
            console.error('Error obteniendo cargos:', error);
            res.status(500).json({
                error: 'Error interno del servidor'
            });
        }
    }
}

module.exports = CargoController;
