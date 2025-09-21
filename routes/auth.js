const express = require('express');
const path = require('path');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { redirigirSiAutenticado, verificarToken } = require('../middleware/auth');

// Mostrar página de login (solo si no está autenticado)
router.get('/login', redirigirSiAutenticado, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Mostrar página de registro (solo si no está autenticado)
router.get('/registro', redirigirSiAutenticado, AuthController.mostrarRegistro);

// Procesar login
router.post('/login', AuthController.procesarLogin);

// Procesar registro
router.post('/registro', AuthController.procesarRegistro);

// Verificar empleado existente
router.post('/verificar-empleado', AuthController.verificarEmpleado);

// Crear credenciales para empleado existente
router.post('/registro-credenciales', AuthController.crearCredenciales);

// Logout
router.post('/logout', AuthController.logout);
router.get('/logout', AuthController.logout);

// Obtener información del usuario autenticado
router.get('/usuario-info', verificarToken, AuthController.obtenerInfoUsuario);

// Verificar estado de autenticación
router.get('/verificar', AuthController.verificarEstado);

module.exports = router;
