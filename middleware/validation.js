// Middleware de validación y sanitización
const validator = require('validator');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');

// Función para manejar errores de validación
const manejarErroresValidacion = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Datos de entrada inválidos',
            details: errors.array().map(err => ({
                campo: err.path,
                mensaje: err.msg,
                valor: err.value
            }))
        });
    }
    next();
};

// Configuración de rate limiting
const createRateLimit = (windowMs, max, message) => rateLimit({
    windowMs,
    max,
    message: { success: false, error: message },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiters específicos
const authLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutos
    5, // 5 intentos
    'Demasiados intentos de login. Inténtelo en 15 minutos.'
);

const generalLimiter = createRateLimit(
    15 * 60 * 1000, // 15 minutos
    1000, // 1000 requests (más permisivo para uso normal)
    'Demasiadas requests. Inténtelo más tarde.'
);

// Rate limiter más permisivo para APIs de datos
const apiLimiter = createRateLimit(
    10 * 60 * 1000, // 10 minutos
    2000, // 2000 requests para operaciones normales de la app
    'Límite de API alcanzado. Espere unos minutos.'
);

// Rate limiter muy permisivo para desarrollo/testing
const developmentLimiter = createRateLimit(
    5 * 60 * 1000, // 5 minutos
    10000, // 10000 requests - muy permisivo
    'Límite de desarrollo alcanzado.'
);

// Middleware de validación de entrada
const validarEntrada = {
    // Validar y sanitizar datos de login
    login: (req, res, next) => {
        const { email_usuario, password } = req.body;

        // Validaciones básicas
        if (!email_usuario || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email/usuario y contraseña son requeridos'
            });
        }

        // Sanitizar email/usuario
        req.body.email_usuario = validator.escape(email_usuario.trim());
        
        // Validar longitud de contraseña
        if (password.length < 6 || password.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Contraseña debe tener entre 6 y 100 caracteres'
            });
        }

        next();
    },

    // Validar datos de producto
    producto: (req, res, next) => {
        const { nombre, codigo, precioVenta, precioCompra, stock } = req.body;

        // Validaciones requeridas
        if (!nombre || !codigo || precioVenta === undefined || precioCompra === undefined || stock === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Campos requeridos: nombre, código, precioVenta, precioCompra, stock'
            });
        }

        // Sanitizar strings
        req.body.nombre = validator.escape(nombre.trim());
        req.body.codigo = validator.escape(codigo.trim().toUpperCase());
        
        if (req.body.descripcion) {
            req.body.descripcion = validator.escape(req.body.descripcion.trim());
        }

        // Validar números
        if (!validator.isFloat(precioVenta.toString(), { min: 0 }) ||
            !validator.isFloat(precioCompra.toString(), { min: 0 }) ||
            !validator.isInt(stock.toString(), { min: 0 })) {
            return res.status(400).json({
                success: false,
                error: 'Precios deben ser números positivos y stock debe ser entero positivo'
            });
        }

        next();
    },

    // Validación de venta
    venta: [
        body('productos').isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
        body('productos.*.id').isInt({ min: 1 }).withMessage('ID de producto inválido'),
        body('productos.*.cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
        body('productos.*.precio').isFloat({ min: 0 }).withMessage('Precio inválido'),
        body('total').isFloat({ min: 0 }).withMessage('Total inválido'),
        body('tipo_pago').isIn(['efectivo', 'tarjeta', 'transferencia']).withMessage('Tipo de pago inválido'),
        manejarErroresValidacion
    ],

    // Validación de categoría
    categoria: [
        body('nombre_categoria').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre debe tener entre 2 y 100 caracteres'),
        body('codigo_categoria').trim().isLength({ min: 1, max: 20 }).withMessage('Código debe tener entre 1 y 20 caracteres'),
        body('descripcion').optional().trim().isLength({ max: 500 }).withMessage('Descripción máximo 500 caracteres'),
        manejarErroresValidacion
    ],

    // Validación de movimiento
    movimiento: [
        body('producto_id').isInt({ min: 1 }).withMessage('ID de producto inválido'),
        body('tipo_movimiento').isIn(['entrada', 'salida']).withMessage('Tipo de movimiento inválido'),
        body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
        body('motivo').trim().isLength({ min: 5, max: 200 }).withMessage('Motivo debe tener entre 5 y 200 caracteres'),
        manejarErroresValidacion
    ],

    // Validación de empresa
    empresa: [
        body('nombre_empresa').trim().isLength({ min: 2, max: 100 }).withMessage('Nombre empresa debe tener entre 2 y 100 caracteres'),
        body('direccion').optional().trim().isLength({ max: 200 }).withMessage('Dirección máximo 200 caracteres'),
        body('telefono').optional().trim().matches(/^[\d\s\-\+\(\)]+$/).withMessage('Teléfono inválido'),
        body('email').optional().isEmail().withMessage('Email inválido'),
        body('nit').optional().trim().isLength({ max: 20 }).withMessage('NIT máximo 20 caracteres'),
        body('ciudad').optional().trim().isLength({ max: 50 }).withMessage('Ciudad máximo 50 caracteres'),
        body('eslogan').optional().trim().isLength({ max: 200 }).withMessage('Eslogan máximo 200 caracteres'),
        manejarErroresValidacion
    ],

    // Validación de código
    codigo: [
        param('codigo_categoria').trim().isLength({ min: 1, max: 20 }).withMessage('Código categoría inválido'),
        manejarErroresValidacion
    ],

    // Validar parámetros de ID
    id: (req, res, next) => {
        const { id } = req.params;
        
        if (!validator.isInt(id, { min: 1 })) {
            return res.status(400).json({
                success: false,
                error: 'ID debe ser un número entero positivo'
            });
        }

        req.params.id = parseInt(id);
        next();
    },

    // Validar parámetros de paginación
    paginacion: (req, res, next) => {
        const { pagina = '1', limite = '10' } = req.query;

        // Validar y convertir página
        if (!validator.isInt(pagina, { min: 1, max: 1000 })) {
            req.query.pagina = 1;
        } else {
            req.query.pagina = parseInt(pagina);
        }

        // Validar y convertir límite
        if (!validator.isInt(limite, { min: 1, max: 100 })) {
            req.query.limite = 10;
        } else {
            req.query.limite = parseInt(limite);
        }

        next();
    }
};

// Middleware de headers de seguridad
const configurarSeguridad = (app) => {
    // Helmet para headers de seguridad
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                scriptSrcAttr: ["'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        crossOriginEmbedderPolicy: false
    }));

    // CORS headers personalizados
    app.use((req, res, next) => {
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('X-Frame-Options', 'DENY');
        res.header('X-XSS-Protection', '1; mode=block');
        res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    });
};

// Middleware de logging de seguridad
const logSeguridad = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    
    // Log de intentos sospechosos
    const queryString = JSON.stringify(req.query);
    if (req.path.includes('admin') || 
        req.path.includes('..') ||
        req.path.includes('script') ||
        queryString.includes('<') ||
        queryString.includes('script')) {
        
        console.warn(`🚨 INTENTO SOSPECHOSO: ${ip} - ${req.method} ${req.path} - ${userAgent}`);
    }

    next();
};

// Middleware de prevención de inyección SQL
const prevenirInyeccionSQL = (req, res, next) => {
    const sqlPatterns = [
        /(\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bunion\b|\bor\b|\band\b).*(\b1=1\b|\b1 = 1\b)/i,
        /(\bor\b|\band\b)\s+\d+\s*=\s*\d+/i,
        /(union.*select|select.*union)/i,
        /(drop\s+table|drop\s+database)/i,
        /'\s*(or|and)\s+/i
    ];

    const checkValue = (value) => {
        if (typeof value === 'string') {
            return sqlPatterns.some(pattern => pattern.test(value));
        }
        return false;
    };

    const checkObject = (obj) => {
        for (const key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (checkObject(obj[key])) return true;
            } else if (checkValue(obj[key])) {
                return true;
            }
        }
        return false;
    };

    // Verificar query params, body, y params
    if (checkObject(req.query) || checkObject(req.body) || checkObject(req.params)) {
        console.warn(`🚨 INTENTO DE INYECCIÓN SQL: ${req.ip} - ${req.method} ${req.path}`);
        return res.status(400).json({
            success: false,
            error: 'Solicitud inválida detectada'
        });
    }

    next();
};

// Wrapper para manejo asíncrono de errores
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// ===== VALIDACIONES PARA CLIENTES =====

// Validar creación de cliente
const validarCliente = [
    body('numero_documento')
        .notEmpty()
        .withMessage('El número de documento es requerido')
        .isLength({ min: 5, max: 20 })
        .withMessage('El número de documento debe tener entre 5 y 20 caracteres')
        .matches(/^[0-9A-Za-z-]+$/)
        .withMessage('El número de documento solo puede contener números, letras y guiones'),
    
    body('tipo_documento')
        .optional()
        .isIn(['CC', 'CE', 'NIT', 'PAS', 'TI'])
        .withMessage('Tipo de documento no válido'),
    
    body('nombres')
        .optional()
        .isLength({ min: 2, max: 255 })
        .withMessage('Los nombres deben tener entre 2 y 255 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
        .withMessage('Los nombres solo pueden contener letras y espacios'),
    
    body('apellidos')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Los apellidos no pueden superar los 255 caracteres')
        .custom((value) => {
            if (value && !/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(value)) {
                throw new Error('Los apellidos solo pueden contener letras y espacios');
            }
            return true;
        }),
    
    body('razon_social')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La razón social no puede superar los 255 caracteres'),
    
    body('telefono')
        .optional()
        .isLength({ max: 20 })
        .withMessage('El teléfono no puede superar los 20 caracteres')
        .custom((value) => {
            if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
                throw new Error('El teléfono tiene un formato inválido');
            }
            return true;
        }),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('El email debe tener un formato válido')
        .isLength({ max: 150 })
        .withMessage('El email no puede superar los 150 caracteres'),
    
    body('direccion')
        .optional()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede superar los 200 caracteres'),
    
    body('ciudad')
        .optional()
        .isLength({ max: 100 })
        .withMessage('La ciudad no puede superar los 100 caracteres')
        .custom((value) => {
            if (value && !/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-\.]+$/.test(value)) {
                throw new Error('La ciudad solo puede contener letras, espacios, guiones y puntos');
            }
            return true;
        }),
    
    body('fecha_nacimiento')
        .optional()
        .isISO8601()
        .withMessage('La fecha de nacimiento debe tener formato válido (YYYY-MM-DD)')
        .custom((value) => {
            if (value) {
                const fecha = new Date(value);
                const hoy = new Date();
                const hace150Years = new Date();
                hace150Years.setFullYear(hoy.getFullYear() - 150);
                
                if (fecha > hoy) {
                    throw new Error('La fecha de nacimiento no puede ser futura');
                }
                if (fecha < hace150Years) {
                    throw new Error('La fecha de nacimiento no puede ser tan antigua');
                }
            }
            return true;
        }),
    
    body('notas')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden superar los 500 caracteres'),
    
    manejarErroresValidacion
];

// Validar actualización de cliente (campos opcionales)
const validarActualizacionCliente = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID de cliente inválido'),
    
    body('numero_documento')
        .optional()
        .isLength({ min: 5, max: 20 })
        .withMessage('El número de documento debe tener entre 5 y 20 caracteres')
        .matches(/^[0-9A-Za-z-]+$/)
        .withMessage('El número de documento solo puede contener números, letras y guiones'),
    
    body('tipo_documento')
        .optional()
        .isIn(['CC', 'CE', 'NIT', 'PAS', 'TI'])
        .withMessage('Tipo de documento no válido'),
    
    body('nombres')
        .optional()
        .isLength({ min: 2, max: 255 })
        .withMessage('Los nombres deben tener entre 2 y 255 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/)
        .withMessage('Los nombres solo pueden contener letras y espacios'),
    
    body('apellidos')
        .optional()
        .isLength({ max: 255 })
        .withMessage('Los apellidos no pueden superar los 255 caracteres')
        .custom((value) => {
            if (value && !/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/.test(value)) {
                throw new Error('Los apellidos solo pueden contener letras y espacios');
            }
            return true;
        }),
    
    body('razon_social')
        .optional()
        .isLength({ max: 255 })
        .withMessage('La razón social no puede superar los 255 caracteres'),
    
    body('telefono')
        .optional()
        .isLength({ max: 20 })
        .withMessage('El teléfono no puede superar los 20 caracteres')
        .custom((value) => {
            if (value && !/^[\d\s\-\+\(\)]+$/.test(value)) {
                throw new Error('El teléfono tiene un formato inválido');
            }
            return true;
        }),
    
    body('email')
        .optional()
        .isEmail()
        .withMessage('El email debe tener un formato válido')
        .isLength({ max: 150 })
        .withMessage('El email no puede superar los 150 caracteres'),
    
    body('direccion')
        .optional()
        .isLength({ max: 200 })
        .withMessage('La dirección no puede superar los 200 caracteres'),
    
    body('ciudad')
        .optional()
        .isLength({ max: 100 })
        .withMessage('La ciudad no puede superar los 100 caracteres')
        .custom((value) => {
            if (value && !/^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-\.]+$/.test(value)) {
                throw new Error('La ciudad solo puede contener letras, espacios, guiones y puntos');
            }
            return true;
        }),
    
    body('fecha_nacimiento')
        .optional()
        .isISO8601()
        .withMessage('La fecha de nacimiento debe tener formato válido (YYYY-MM-DD)')
        .custom((value) => {
            if (value) {
                const fecha = new Date(value);
                const hoy = new Date();
                const hace150Years = new Date();
                hace150Years.setFullYear(hoy.getFullYear() - 150);
                
                if (fecha > hoy) {
                    throw new Error('La fecha de nacimiento no puede ser futura');
                }
                if (fecha < hace150Years) {
                    throw new Error('La fecha de nacimiento no puede ser tan antigua');
                }
            }
            return true;
        }),
    
    body('activo')
        .optional()
        .isBoolean()
        .withMessage('El estado activo debe ser true o false'),
    
    body('notas')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Las notas no pueden superar los 500 caracteres'),
    
    manejarErroresValidacion
];

module.exports = {
    validarEntrada,
    authLimiter,
    generalLimiter,
    apiLimiter,
    developmentLimiter,
    configurarSeguridad,
    asyncHandler,
    logSeguridad,
    prevenirInyeccionSQL,
    validarCliente,
    validarActualizacionCliente
};