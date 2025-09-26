const express = require('express');
const router = express.Router();
const MovimientoController = require('../controllers/movimientoController');
const { verificarToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// POST /api/movimientos - Crear nuevo movimiento
router.post('/', MovimientoController.crearMovimiento);

// GET /api/movimientos - Obtener historial de movimientos
router.get('/', MovimientoController.obtenerMovimientos);

module.exports = router;
