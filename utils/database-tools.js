const bcrypt = require('bcrypt');
const { pool, conectarDB } = require('../config/database');

// Script para encriptar contraseñas existentes
const encriptarContrasenas = async () => {
    try {
        console.log('🔐 Iniciando encriptación de contraseñas...');
        
        // Conectar a la base de datos
        await conectarDB();
        
        // Obtener todos los usuarios con contraseñas en texto plano
        const query = `
            SELECT id, nombre_usuario, password_hash
            FROM usuarios_sistema 
            WHERE activo = true
        `;
        
        const result = await pool.query(query);
        console.log(`📊 Encontrados ${result.rows.length} usuarios`);
        
        for (const usuario of result.rows) {
            console.log(`\n👤 Usuario: ${usuario.nombre_usuario}`);
            console.log(`🔑 Contraseña actual: ${usuario.password_hash}`);
            
            // Verificar si ya está encriptada (los hashes de bcrypt empiezan con $2b$)
            if (usuario.password_hash.startsWith('$2b$')) {
                console.log('✅ Ya está encriptada');
                continue;
            }
            
            // Encriptar la contraseña
            console.log('🔄 Encriptando...');
            const saltRounds = 10;
            const hashEncriptado = await bcrypt.hash(usuario.password_hash, saltRounds);
            
            // Actualizar en base de datos
            const updateQuery = `
                UPDATE usuarios_sistema 
                SET password_hash = $1 
                WHERE id = $2
            `;
            
            await pool.query(updateQuery, [hashEncriptado, usuario.id]);
            console.log('✅ Contraseña encriptada exitosamente');
        }
        
        console.log('\n🎉 ¡Todas las contraseñas han sido encriptadas!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error encriptando contraseñas:', error);
        process.exit(1);
    }
};

// Función para verificar todos los usuarios del sistema
const verificarTodosLosUsuarios = async () => {
    try {
        console.log('� Verificando todos los usuarios del sistema...');
        
        await conectarDB();
        
        // Query completo con todas las relaciones
        const query = `
            SELECT 
                u.id,
                u.nombre_usuario,
                u.activo as usuario_activo,
                u.ultimo_acceso,
                LEFT(u.password_hash, 20) as password_preview,
                e.nombre_completo,
                e.correo_electronico,
                e.activo as empleado_activo,
                c.nombre_cargo,
                c.rol_sistema
            FROM usuarios_sistema u
            INNER JOIN empleados e ON u.empleado_id = e.id
            INNER JOIN cargos c ON e.cargo_id = c.id
            ORDER BY u.id
        `;
        
        const result = await pool.query(query);
        
        console.log(`\n📊 Encontrados ${result.rows.length} usuarios:`);
        console.log('─'.repeat(80));
        
        result.rows.forEach(user => {
            console.log(`👤 ${user.nombre_completo}`);
            console.log(`   🆔 ID: ${user.id} | Usuario: ${user.nombre_usuario}`);
            console.log(`   📧 Email: ${user.correo_electronico}`);
            console.log(`   💼 Cargo: ${user.nombre_cargo} (${user.rol_sistema})`);
            console.log(`   🔑 Password: ${user.password_preview}... ${user.password_preview.startsWith('$2b$') ? '✅ Encriptada' : '❌ Texto plano'}`);
            console.log(`   📅 Último acceso: ${user.ultimo_acceso || 'Nunca'}`);
            console.log(`   ✅ Estado: Usuario ${user.usuario_activo ? 'Activo' : 'Inactivo'} | Empleado ${user.empleado_activo ? 'Activo' : 'Inactivo'}`);
            console.log('─'.repeat(80));
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error verificando usuarios:', error);
        process.exit(1);
    }
};

// Función para verificar estructura de tablas
const verificarTablas = async () => {
    try {
        console.log('🔍 Verificando estructura de tablas...');
        
        await conectarDB();
        
        // Verificar tabla usuarios_sistema
        const queryUsuarios = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'usuarios_sistema'
            ORDER BY ordinal_position
        `;
        
        const resultUsuarios = await pool.query(queryUsuarios);
        console.log('\n📋 Tabla usuarios_sistema:');
        resultUsuarios.rows.forEach(col => {
            console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
        
        // Verificar datos existentes
        const queryDatos = `
            SELECT id, nombre_usuario, 
                   LEFT(password_hash, 20) as password_preview,
                   activo
            FROM usuarios_sistema 
            LIMIT 5
        `;
        
        const resultDatos = await pool.query(queryDatos);
        console.log('\n📊 Datos existentes:');
        resultDatos.rows.forEach(user => {
            console.log(`   ID: ${user.id}, Usuario: ${user.nombre_usuario}, Password: ${user.password_preview}..., Activo: ${user.activo}`);
        });
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error verificando tablas:', error);
        process.exit(1);
    }
};

// Leer argumentos de línea de comandos
const comando = process.argv[2];

switch (comando) {
    case 'encriptar':
        encriptarContrasenas();
        break;
    case 'usuarios':
        verificarTodosLosUsuarios();
        break;
    case 'verificar':
        verificarTablas();
        break;
    default:
        console.log('🛠️  Herramientas de base de datos - Sistema de Login');
        console.log('');
        console.log('Comandos disponibles:');
        console.log('  node utils/database-tools.js verificar   - Verificar estructura de tablas');
        console.log('  node utils/database-tools.js usuarios    - Ver todos los usuarios del sistema');
        console.log('  node utils/database-tools.js encriptar   - Encriptar contraseñas en texto plano');
        console.log('');
        console.log('💡 Para crear usuarios nuevos:');
        console.log('   1. Usar pgAdmin4 para insertar en empleados y usuarios_sistema');
        console.log('   2. Ejecutar "encriptar" para asegurar contraseñas');
        console.log('');
        break;
}
