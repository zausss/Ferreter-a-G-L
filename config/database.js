const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
    ...config.database,
    // Configuraciones optimizadas para Supabase
    max: 10,                    // reducir número máximo de conexiones para Supabase
    min: 2,                     // mantener algunas conexiones mínimas
    idleTimeoutMillis: 60000,   // aumentar tiempo idle (1 minuto)
    connectionTimeoutMillis: 15000, // aumentar timeout de conexión
    acquireTimeoutMillis: 20000,    // tiempo límite para adquirir conexión del pool
    // Configuraciones para estabilidad
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
});

const conectarDB = async () => {
    try {
        const client = await pool.connect();
        console.log(' PostgreSQL conectado exitosamente');
        console.log(` Base de datos: ${config.database.database}`);
        client.release();
        return true;
    } catch (error) {
        console.error(' Error conectando a PostgreSQL:', error.message);
        return false;
    }
};

// Manejo de errores del pool
pool.on('error', (err, client) => {
    console.error('Error inesperado en el cliente de BD:', err);
    // Reconectar automáticamente
    setTimeout(() => {
        console.log('🔄 Intentando reconectar...');
        conectarDB();
    }, 2000);
});

pool.on('connect', (client) => {
    console.log('✅ Nueva conexión establecida');
});

pool.on('acquire', (client) => {
    console.log('🔗 Cliente adquirido del pool');
});

pool.on('remove', (client) => {
    console.log('❌ Cliente removido del pool');
});

// Función helper para ejecutar consultas con manejo de errores mejorado
const ejecutarConsulta = async (query, params = []) => {
    const client = await pool.connect();
    try {
        const result = await client.query(query, params);
        return result;
    } catch (error) {
        console.error('Error en consulta SQL:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

// Función para cerrar el pool
const cerrarDB = async () => {
    try {
        await pool.end();
        console.log(' Pool de conexiones cerrado');
    } catch (error) {
        console.error(' Error cerrando conexiones:', error);
    }
};

module.exports = { pool, conectarDB, cerrarDB, ejecutarConsulta };