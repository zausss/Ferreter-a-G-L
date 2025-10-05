// Configuración global para pruebas de integración
const { pool } = require('../../config/database');

// Configurar timeout más largo para pruebas de integración
jest.setTimeout(30000);

// Configuración antes de todas las pruebas
beforeAll(async () => {
    // Configurar variables de entorno para pruebas
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = process.env.DB_NAME || 'ferreteria_test';
});

// Configuración después de todas las pruebas
afterAll(async () => {
    // Cerrar conexiones de base de datos
    if (pool) {
        await pool.end();
    }
});

// Manejar advertencias y errores
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Configuración para pruebas de integración con base de datos real
global.testConfig = {
    database: {
        useRealDb: true,
        cleanup: true
    },
    api: {
        timeout: 10000,
        retries: 3
    }
};