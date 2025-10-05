const express = require('express');
const router = express.Router();
const CategoriaController = require('../controllers/categoriaController');
const { verificarToken } = require('../middleware/auth');
const { validarEntrada, asyncHandler } = require('../middleware/validation');

// Middleware de autenticación para todas las rutas
router.use(verificarToken);

// Rutas para categorías

// GET /categorias - Obtener todas las categorías
router.get('/', validarEntrada.paginacion, asyncHandler(CategoriaController.obtenerTodas));

// GET /categorias/buscar - Buscar categorías
router.get('/buscar', validarEntrada.paginacion, asyncHandler(CategoriaController.buscar));

// GET /categorias/:id - Obtener categoría por ID
router.get('/:id', validarEntrada.id, asyncHandler(CategoriaController.obtenerPorId));

const { soloAdministradores } = require('../middleware/auth');
// POST /categorias - Crear nueva categoría (solo admin)
router.post('/', soloAdministradores, validarEntrada.categoria, asyncHandler(CategoriaController.crear));

// PUT /categorias/:id - Actualizar categoría
router.put('/:id', validarEntrada.id, validarEntrada.categoria, asyncHandler(CategoriaController.actualizar));

// DELETE /categorias/codigo/:codigo_categoria - Eliminar por código (solo admin)
router.delete('/codigo/:codigo_categoria', soloAdministradores, validarEntrada.codigo, asyncHandler(CategoriaController.eliminarPorCodigo));

// DELETE /categorias/:id - Eliminar categoría (soft delete)
router.delete('/:id', CategoriaController.eliminar);

module.exports = router;
