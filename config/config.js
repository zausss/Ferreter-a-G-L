require('dotenv').config();

const config = {
    // Configuración de Base de Datos
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'ferreteria_J&L',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '3218',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },
    
    // Configuración del Servidor
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    },
    
    // Configuración de JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'clave_por_defecto',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    
    // Configuración de Sesiones
    session: {
        secret: process.env.SESSION_SECRET || 'session_secret'
    }
};

module.exports = config;
