const express = require('express');
const ActividadController = require('../controllers/actividadController');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Actividades recientes del día (dashboard)
router.get('/recientes', verificarToken, ActividadController.obtenerRecientes);

module.exports = router;
