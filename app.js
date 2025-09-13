const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { conectarDB } = require('./config/database');
const config = require('./config/config');

// Importar rutas
const authRoutes = require('./routes/auth');
const categoriaRoutes = require('./routes/categoriaRoutes');

// Importar middleware
const { verificarToken } = require('./middleware/auth');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Rutas de autenticación (públicas)
app.use('/auth', authRoutes);

// Rutas API (protegidas)
app.use('/api/categorias', categoriaRoutes);

// Ruta raíz - redirigir según autenticación
app.get('/', (req, res) => {
    const token = req.cookies.token;
    if (token) {
        res.redirect('/dashboard');
    } else {
        res.redirect('/auth/login');
    }
});

// Ruta para dashboard (protegida)
app.get('/dashboard', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'menu.html'));
});

// Rutas protegidas para las páginas del sistema
app.get('/categorias.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'categorias.html'));
});

app.get('/menu.html', verificarToken, (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'menu.html'));
});


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
