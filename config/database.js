const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool(config.database);

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

// Función para cerrar el pool
const cerrarDB = async () => {
    try {
        await pool.end();
        console.log(' Pool de conexiones cerrado');
    } catch (error) {
        console.error(' Error cerrando conexiones:', error);
    }
};

module.exports = { pool, conectarDB, cerrarDB };