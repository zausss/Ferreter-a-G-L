require('dotenv').config();

const config = {
    // Configuración de Base de Datos
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'ferreteria_db',
        user: process.env.DB_USER || 'user',
        password: process.env.DB_PASSWORD || 'password',
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
        secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    },
    
    // Configuración de Sesiones
    session: {
        secret: process.env.SESSION_SECRET || 'default_session_secret_change_in_production'
    }
};

module.exports = config;
