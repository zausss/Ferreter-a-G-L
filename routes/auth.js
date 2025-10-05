const express = require('express');
const path = require('path');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { redirigirSiAutenticado, verificarToken } = require('../middleware/auth');
const { validarEntrada, authLimiter } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

// Mostrar página de login (solo si no está autenticado)
router.get('/login', redirigirSiAutenticado, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Mostrar página de registro (solo si no está autenticado)
router.get('/registro', redirigirSiAutenticado, AuthController.mostrarRegistro);

// Procesar login (con rate limiting y validación)
router.post('/login', authLimiter, validarEntrada.login, asyncHandler(AuthController.procesarLogin));

// Procesar registro
router.post('/registro', asyncHandler(AuthController.procesarRegistro));

// Verificar empleado existente
router.post('/verificar-empleado', asyncHandler(AuthController.verificarEmpleado));

// Crear credenciales para empleado existente
router.post('/registro-credenciales', asyncHandler(AuthController.crearCredenciales));

// Logout
router.post('/logout', asyncHandler(AuthController.logout));
router.get('/logout', asyncHandler(AuthController.logout));

// Obtener información del usuario autenticado
router.get('/usuario-info', verificarToken, asyncHandler(AuthController.obtenerInfoUsuario));

// Verificar estado de autenticación
router.get('/verificar', asyncHandler(AuthController.verificarEstado));

module.exports = router;
