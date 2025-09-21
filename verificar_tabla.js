const { pool } = require('./config/database');

async function verTablaUsuarios() {
    const client = await pool.connect();
    try {
        const existe = await client.query(`
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables 
                WHERE table_name = 'usuarios_sistema'
            );
        `);
        
        if (!existe.rows[0].exists) {
            console.log('❌ La tabla usuarios_sistema NO existe');
            console.log('📋 Creando la tabla...');
            
            await client.query(`
                CREATE TABLE usuarios_sistema (
                    id SERIAL PRIMARY KEY,
                    empleado_id INTEGER NOT NULL,
                    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ultimo_acceso TIMESTAMP,
                    activo BOOLEAN DEFAULT true,
                    FOREIGN KEY (empleado_id) REFERENCES empleados(id)
                );
            `);
            
            console.log('✅ Tabla usuarios_sistema creada');
        } else {
            console.log('✅ La tabla usuarios_sistema existe');
            
            const estructura = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'usuarios_sistema'
                ORDER BY ordinal_position;
            `);
            
            console.table(estructura.rows);
        }
    } catch(error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        process.exit(0);
    }
}

verTablaUsuarios();
