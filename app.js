const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { conectarDB } = require('./config/database');
const config = require('./config/config');

// Importar rutas
const authRoutes = require('./routes/auth');
const categoriaRoutes = require('./routes/categoriaRoutes');
const productoRoutes = require('./routes/productoRoutes');
const movimientoRoutes = require('./routes/movimientoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const clienteRoutes = require('./routes/clienteRoutes');

// Importar controladores adicionales
const CargoController = require('./controllers/cargoController');

// Importar middleware
const { verificarToken } = require('./middleware/auth');
const { 
    generalLimiter,
    apiLimiter,
    developmentLimiter, 
    configurarSeguridad, 
    logSeguridad, 
    prevenirInyeccionSQL 
} = require('./middleware/validation');
const { 
    manejar404, 
    manejarErrores, 
    manejarPromesasRechazadas 
} = require('./middleware/errorHandler');

const app = express();

// Configurar trust proxy para obtener IPs reales
app.set('trust proxy', 1);

// Configurar seguridad
configurarSeguridad(app);

// Middlewares de seguridad
app.use(developmentLimiter); // Usar el limiter muy permisivo para desarrollo
app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.path} - ${req.ip}`);
    next();
});
app.use(logSeguridad);
app.use(prevenirInyeccionSQL);

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Manejar favicon
app.get('/favicon.ico', (req, res) => res.status(204).send());

// Rutas de autenticación (públicas)
app.use('/auth', authRoutes);

// Rutas API (protegidas)
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/clientes', clienteRoutes);

// Rutas adicionales para registro
app.get('/api/cargos', CargoController.obtenerCargos);

// Ruta de emergencia para resetear rate limits (solo en desarrollo)
if (config.server.env === 'development') {
    app.get('/api/reset-limits', (req, res) => {
        res.json({ 
            success: true, 
            message: 'Rate limits configurados en modo desarrollo (muy permisivos)',
            limits: {
                development: '10,000 requests en 5 minutos',
                login: '5 intentos en 15 minutos'
            }
        });
    });
}

// Ruta raíz - redirigir según autenticación
app.get('/', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        res.redirect('/menu.html');
    } else {
        res.redirect('/login.html');
    }
});

// Ruta para dashboard (protegida)
app.get('/dashboard', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'menu.html'));
});

// Ruta para login (sin protección)
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Rutas protegidas para las páginas del sistema
app.get('/categorias.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'categorias.html'));
});

app.get('/productos.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'productos.html'));
});

app.get('/control-stock.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'control-stock.html'));
});

app.get('/menu.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'menu.html'));
});

app.get('/venta.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'venta.html'));
});

app.get('/facturas.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'facturas.html'));
});

app.get('/clientes.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'clientes.html'));
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
    // Si es una petición AJAX/API, devolver JSON
    if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
        return res.status(404).json({
            error: 'Recurso no encontrado',
            mensaje: `La ruta ${req.originalUrl} no existe`
        });
    }
    
    // Si es una petición de navegador, mostrar página 404
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Middleware de manejo de errores (debe ir al final)
app.use(manejarErrores);

// Configurar manejo de promesas rechazadas
manejarPromesasRechazadas();

// Solo iniciar el servidor si este archivo es ejecutado directamente
if (require.main === module) {
    const iniciarServidor = async () => {
        try {
            // Conectar a la base de datos
            const dbConectada = await conectarDB();
            if (!dbConectada) {
                console.error(' No se pudo conectar a la base de datos');
                process.exit(1);
            }
            const PORT = config.server.port;
            app.listen(PORT, () => {
                console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
                console.log(`Sistema de autenticación configurado`);
                console.log(`Entorno: ${config.server.env}`);
            });
        } catch (error) {
            console.error(' Error iniciando servidor:', error);
            process.exit(1);
        }
    };
    iniciarServidor();
}

module.exports = app;
