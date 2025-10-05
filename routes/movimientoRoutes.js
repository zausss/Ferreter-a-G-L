const express = require('express');
const router = express.Router();
const MovimientoController = require('../controllers/movimientoController');
const { verificarToken } = require('../middleware/auth');
const { validarEntrada, asyncHandler } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(verificarToken);

// POST /api/movimientos - Crear nuevo movimiento
router.post('/', validarEntrada.movimiento, asyncHandler(MovimientoController.crearMovimiento));

// GET /api/movimientos - Obtener historial de movimientos
router.get('/', validarEntrada.paginacion, asyncHandler(MovimientoController.obtenerMovimientos));

module.exports = router;
