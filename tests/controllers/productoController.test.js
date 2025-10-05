const ProductoController = require('../../controllers/productoController');
const Producto = require('../../models/productoModel');

// Mock del modelo Producto
jest.mock('../../models/productoModel');

describe('ProductoController - Pruebas Unitarias', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      query: {},
      body: {},
      params: {},
      usuario: { id: 1, rol_sistema: 'Administrador' }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      sendFile: jest.fn().mockReturnThis()
    };
  });

  describe('obtenerProductos', () => {
    const mockProductos = [
      {
        id: 1,
        codigo_producto: 'P001',
        nombre: 'Martillo',
        nombre_categoria: 'Herramientas',
        stock_actual: 10,
        stock_minimo: 5,
        precio_venta: 25000,
        precio_compra: 0,
        activo: true
      },
      {
        id: 2,
        codigo_producto: 'P002',
        nombre: 'Tornillo',
        nombre_categoria: 'Tornillería',
        stock_actual: 2,
        stock_minimo: 10,
        precio_venta: 500,
        precio_compra: 0,
        activo: true
      }
    ];

    test('Obtener todos los productos sin filtros', async () => {
      // Arrange
      Producto.obtenerTodos.mockResolvedValue(mockProductos);

      // Act
      await ProductoController.obtenerProductos(req, res);

      // Assert
      expect(Producto.obtenerTodos).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            codigo: 'P001',
            nombre: 'Martillo',
            categoria: 'Herramientas',
            estado: 'activo'
          })
        ]),
        pagination: {
          paginaActual: 1,
          totalProductos: 2,
          totalPaginas: 1,
          productosPorPagina: 10
        }
      });
    });

    test('Error al obtener productos', async () => {
      // Arrange
      const error = new Error('Error de base de datos');
      Producto.obtenerTodos.mockRejectedValue(error);

      // Act
      await ProductoController.obtenerProductos(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error interno del servidor',
        error: 'Error de base de datos'
      });
    });
  });

  describe('obtenerProductoPorId', () => {
    test('Obtener producto existente', async () => {
      // Arrange
      req.params.id = '1';
      const mockProducto = {
        id: 1,
        codigo_producto: 'P001',
        nombre: 'Martillo',
        descripcion: 'Martillo de carpintero',
        precio_venta: 25000,
        stock_actual: 10,
        activo: true
      };
      Producto.buscarPorId.mockResolvedValue(mockProducto);

      // Act
      await ProductoController.obtenerProductoPorId(req, res);

      // Assert
      expect(Producto.buscarPorId).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          id: 1,
          codigo: 'P001',
          nombre: 'Martillo'
        })
      });
    });

    test('Producto no encontrado', async () => {
      // Arrange
      req.params.id = '999';
      Producto.buscarPorId.mockResolvedValue(null);

      // Act
      await ProductoController.obtenerProductoPorId(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Producto no encontrado'
      });
    });
  });

  describe('crearProducto', () => {
    test('Error al crear producto con datos inválidos', async () => {
      // Arrange
      req.body = {
        nombre: '', // nombre vacio
        precioVenta: -100 // precio negativo
      };

      // Act
      await ProductoController.crearProducto(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Campos requeridos: código, nombre, precio de venta, precio de compra y stock'
      });
    });

    test('Error al crear producto con código duplicado', async () => {
      // Arrange
      req.body = {
        codigo: 'P001',
        nombre: 'Producto Duplicado',
        precioVenta: 8000,
        precioCompra: 5000,
        stock: 10
      };

      // Simular que ya existe un producto con ese código
      Producto.obtenerTodos.mockResolvedValue([
        { codigo_producto: 'P001', nombre: 'Producto Existente' }
      ]);

      // Act
      await ProductoController.crearProducto(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'El código del producto ya existe'
      });
    });
  });

  describe('eliminarProducto', () => {
    test('Eliminar producto exitosamente', async () => {
      // Arrange
      req.params.id = '1';
      Producto.eliminar.mockResolvedValue(true);

      // Act
      await ProductoController.eliminarProducto(req, res);

      // Assert
      expect(Producto.eliminar).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Producto eliminado exitosamente',
        data: true
      });
    });

    test('Producto no encontrado para eliminar', async () => {
      // Arrange
      req.params.id = '999';
      Producto.eliminar.mockResolvedValue(false);

      // Act
      await ProductoController.eliminarProducto(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Producto no encontrado'
      });
    });
  });

  describe('obtenerStockBajo', () => {
    test('Obtener productos con stock bajo', async () => {
      // Arrange
      const mockProductosStockBajo = [
        {
          id: 2,
          codigo_producto: 'P002',
          nombre: 'Tornillo',
          nombre_categoria: 'Tornillería',
          stock_actual: 2,
          stock_minimo: 10
        }
      ];
      Producto.stockBajo.mockResolvedValue(mockProductosStockBajo);

      // Act
      await ProductoController.obtenerStockBajo(req, res);

      // Assert
      expect(Producto.stockBajo).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 2,
            codigo: 'P002',
            nombre: 'Tornillo',
            stock: 2,
            stockMinimo: 10
          })
        ])
      });
    });
  });

  describe('obtenerEstadisticas', () => {
    test('Obtener estadísticas de productos', async () => {
      // Arrange
      const mockEstadisticas = {
        total_productos: '25',
        productos_con_stock: '20',
        productos_stock_bajo: '3',
        valor_total_inventario: '500000.50'
      };
      Producto.obtenerEstadisticas.mockResolvedValue(mockEstadisticas);

      // Act
      await ProductoController.obtenerEstadisticas(req, res);

      // Assert
      expect(Producto.obtenerEstadisticas).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        exito: true,
        estadisticas: {
          total_productos: 25,
          productos_con_stock: 20,
          productos_stock_bajo: 3,
          valor_total_inventario: 500000.50
        }
      });
    });

    test('Error al obtener estadísticas', async () => {
      // Arrange
      const error = new Error('Error de base de datos');
      Producto.obtenerEstadisticas.mockRejectedValue(error);

      // Act
      await ProductoController.obtenerEstadisticas(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        exito: false,
        mensaje: 'Error interno del servidor'
      });
    });
  });
});