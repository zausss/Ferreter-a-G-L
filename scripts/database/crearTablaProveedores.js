const { pool } = require('../../config/database');
const fs = require('fs');
const path = require('path');

async function crearTablaProveedores() {
    try {
        console.log('🔧 Iniciando creación de tabla proveedores...');
        
        // Leer el archivo SQL
        const sqlFile = path.join(__dirname, '../../sql/crear_tabla_proveedores.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Ejecutar el script SQL
        await pool.query(sql);
        
        console.log('✅ Tabla proveedores creada exitosamente');
        console.log('📊 Datos de ejemplo insertados');
        
    } catch (error) {
        console.error('❌ Error al crear tabla proveedores:', error);
        throw error;
    }
}

// Función para verificar si la tabla existe
async function verificarTablaProveedores() {
    try {
        const result = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'proveedores'
            )
        `);
        
        const existe = result.rows[0].exists;
        console.log(`📋 Tabla proveedores existe: ${existe ? 'SÍ' : 'NO'}`);
        
        if (existe) {
            const count = await pool.query('SELECT COUNT(*) FROM proveedores');
            console.log(`📊 Total de proveedores: ${count.rows[0].count}`);
        }
        
        return existe;
    } catch (error) {
        console.error('❌ Error al verificar tabla proveedores:', error);
        return false;
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    (async () => {
        try {
            const existe = await verificarTablaProveedores();
            
            if (!existe) {
                await crearTablaProveedores();
            } else {
                console.log('ℹ️ La tabla proveedores ya existe');
            }
            
            await verificarTablaProveedores();
            process.exit(0);
        } catch (error) {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        }
    })();
}

module.exports = {
    crearTablaProveedores,
    verificarTablaProveedores
};