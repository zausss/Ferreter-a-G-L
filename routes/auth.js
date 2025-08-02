const express = require('express');
const path = require('path');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { redirigirSiAutenticado } = require('../middleware/auth');

// Mostrar página de login (solo si no está autenticado)
router.get('/login', redirigirSiAutenticado, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Procesar login
router.post('/login', AuthController.procesarLogin);

// Logout
router.post('/logout', AuthController.logout);
router.get('/logout', AuthController.logout);

// Verificar estado de autenticación
router.get('/verificar', AuthController.verificarEstado);

module.exports = router;
