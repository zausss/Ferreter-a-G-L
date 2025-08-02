const { pool, conectarDB } = require('../config/database');

const verificarCargo = async () => {
    try {
        await conectarDB();
        
        // Verificar el cargo del empleado Daniel
        const query = `
            SELECT 
                c.id,
                c.nombre_cargo,
                c.rol_sistema,
                c.activo
            FROM cargos c
            WHERE c.id = 1
        `;
        
        const result = await pool.query(query);
        
        if (result.rows.length > 0) {
            const cargo = result.rows[0];
            console.log('💼 Cargo encontrado:');
            console.log(`   ID: ${cargo.id}`);
            console.log(`   Nombre: ${cargo.nombre_cargo}`);
            console.log(`   Rol Sistema: ${cargo.rol_sistema}`);
            console.log(`   Activo: ${cargo.activo}`);
        } else {
            console.log('❌ No se encontró cargo con ID 1');
            console.log('🔧 Creando cargo de Administrador...');
            
            const insertQuery = `
                INSERT INTO cargos (nombre_cargo, descripcion, rol_sistema, activo)
                VALUES ('Administrador', 'Administrador del sistema', 'Administrador', true)
                RETURNING *
            `;
            
            const insertResult = await pool.query(insertQuery);
            console.log('✅ Cargo creado:', insertResult.rows[0]);
        }
        
        process.exit(0);
        
    } catch (error) {
        if (error.code === '42P01') {
            console.log('❌ La tabla "cargos" no existe. Creándola...');
            
            const createTableQuery = `
                CREATE TABLE cargos (
                    id SERIAL PRIMARY KEY,
                    nombre_cargo VARCHAR(50) NOT NULL UNIQUE,
                    descripcion TEXT,
                    rol_sistema VARCHAR(20) CHECK (rol_sistema IN ('Administrador', 'Cajero', 'Sin_Acceso')),
                    activo BOOLEAN DEFAULT true,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `;
            
            try {
                await pool.query(createTableQuery);
                console.log('✅ Tabla "cargos" creada exitosamente');
                
                // Insertar cargo de administrador
                const insertQuery = `
                    INSERT INTO cargos (nombre_cargo, descripcion, rol_sistema, activo)
                    VALUES ('Administrador', 'Administrador del sistema', 'Administrador', true)
                    RETURNING *
                `;
                
                const insertResult = await pool.query(insertQuery);
                console.log('✅ Cargo de Administrador creado:', insertResult.rows[0]);
                
                process.exit(0);
            } catch (createError) {
                console.error('❌ Error creando tabla cargos:', createError);
                process.exit(1);
            }
        } else {
            console.error('❌ Error:', error);
            process.exit(1);
        }
    }
};

verificarCargo();
