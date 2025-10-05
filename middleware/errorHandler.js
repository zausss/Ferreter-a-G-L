// Middleware de manejo de errores global
const path = require('path');

// Clase personalizada para errores de la aplicación
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Middleware de manejo de errores 404
const manejar404 = (req, res, next) => {
    const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404);
    next(error);
};

// Middleware principal de manejo de errores
const manejarErrores = (error, req, res, next) => {
    let { statusCode = 500, message = 'Error interno del servidor' } = error;

    // Log del error
    console.error('🚨 ERROR:', {
        message: error.message,
        statusCode,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString(),
        body: req.body,
        query: req.query,
        params: req.params
    });

    // Errores específicos de base de datos
    if (error.code) {
        switch (error.code) {
            case '23505': // Violación de restricción única
                statusCode = 409;
                message = 'El registro ya existe';
                break;
            case '23503': // Violación de clave foránea
                statusCode = 400;
                message = 'Referencia inválida';
                break;
            case '23502': // Violación de restricción NOT NULL
                statusCode = 400;
                message = 'Campo requerido faltante';
                break;
            case '42P01': // Tabla no existe
                statusCode = 500;
                message = 'Error de configuración de base de datos';
                break;
            case 'ECONNREFUSED':
                statusCode = 503;
                message = 'Servicio de base de datos no disponible';
                break;
            default:
                if (error.code.startsWith('23')) {
                    statusCode = 400;
                    message = 'Error de validación de datos';
                }
        }
    }

    // Errores de JWT
    if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Token inválido';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expirado';
    }

    // Errores de validación
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Datos de entrada inválidos';
    }

    // Errores de límite de archivos
    if (error.code === 'LIMIT_FILE_SIZE') {
        statusCode = 413;
        message = 'Archivo demasiado grande';
    }

    // Errores de límite de requests
    if (error.type === 'entity.too.large') {
        statusCode = 413;
        message = 'Solicitud demasiado grande';
    }

    // En desarrollo, mostrar stack trace
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Estructura de respuesta de error
    const errorResponse = {
        success: false,
        error: message,
        statusCode,
        timestamp: new Date().toISOString()
    };

    // Agregar detalles adicionales en desarrollo
    if (isDevelopment) {
        errorResponse.stack = error.stack;
        errorResponse.originalError = error.message;
    }

    // Si es una request AJAX/API, devolver JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1 || req.path.startsWith('/api/')) {
        return res.status(statusCode).json(errorResponse);
    }

    // Para requests HTML, redirigir a página de error o login
    if (statusCode === 401) {
        return res.redirect('/auth/login?error=' + encodeURIComponent(message));
    }

    if (statusCode === 403) {
        return res.redirect('/dashboard?error=' + encodeURIComponent('Sin permisos suficientes'));
    }

    if (statusCode === 404) {
        return res.status(404).sendFile(path.join(__dirname, '../views/404.html'), (err) => {
            if (err) {
                res.status(404).send('<h1>404 - Página no encontrada</h1>');
            }
        });
    }

    // Error 500 genérico
    res.status(statusCode).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error ${statusCode}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .error-container { text-align: center; }
                .error-code { font-size: 3em; color: #dc3545; }
                .error-message { font-size: 1.2em; margin: 20px 0; }
                .back-link { color: #007bff; text-decoration: none; }
            </style>
        </head>
        <body>
            <div class="error-container">
                <div class="error-code">${statusCode}</div>
                <div class="error-message">${message}</div>
                <a href="/dashboard" class="back-link">← Volver al inicio</a>
            </div>
        </body>
        </html>
    `);
};

// Middleware para capturar promesas rechazadas
const manejarPromesasRechazadas = () => {
    process.on('unhandledRejection', (reason, promise) => {
        console.error('🚨 PROMESA RECHAZADA NO MANEJADA:', reason);
        // No cerrar el proceso en producción, solo logear
        if (process.env.NODE_ENV === 'development') {
            process.exit(1);
        }
    });

    process.on('uncaughtException', (error) => {
        console.error('🚨 EXCEPCIÓN NO CAPTURADA:', error);
        process.exit(1);
    });
};

// Wrapper para funciones async en rutas
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Función para validar y sanitizar errores antes de enviarlos al cliente
const sanitizarError = (error, isDevelopment = false) => {
    // Lista de mensajes de error que son seguros mostrar al usuario
    const mensajesSegurosMostrar = [
        'Credenciales incorrectas',
        'Usuario no encontrado',
        'Token expirado',
        'Sin permisos suficientes',
        'Datos requeridos faltantes',
        'Formato de datos inválido',
        'El registro ya existe',
        'Referencia inválida'
    ];

    // Si el error es operacional y está en la lista segura, mostrarlo
    if (error.isOperational && mensajesSegurosMostrar.some(msg => error.message.includes(msg))) {
        return error.message;
    }

    // En desarrollo, mostrar el mensaje original
    if (isDevelopment) {
        return error.message;
    }

    // En producción, mensaje genérico para errores no seguros
    return 'Ha ocurrido un error interno. Por favor, intente nuevamente.';
};

module.exports = {
    AppError,
    manejar404,
    manejarErrores,
    manejarPromesasRechazadas,
    asyncHandler,
    sanitizarError
};