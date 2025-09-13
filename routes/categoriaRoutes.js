const express = require('express');
const router = express.Router();
const CategoriaController = require('../controllers/categoriaController');
const { verificarToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(verificarToken);

// Rutas para categorías

// GET /categorias - Obtener todas las categorías
router.get('/', CategoriaController.obtenerTodas);

// GET /categorias/buscar - Buscar categorías
router.get('/buscar', CategoriaController.buscar);

// GET /categorias/:id - Obtener categoría por ID
router.get('/:id', CategoriaController.obtenerPorId);

const { soloAdministradores } = require('../middleware/auth');
// POST /categorias - Crear nueva categoría (solo admin)
router.post('/', soloAdministradores, CategoriaController.crear);

// PUT /categorias/:id - Actualizar categoría
router.put('/:id', CategoriaController.actualizar);

// DELETE /categorias/:id - Eliminar categoría (soft delete)
router.delete('/:id', CategoriaController.eliminar);

module.exports = router;
