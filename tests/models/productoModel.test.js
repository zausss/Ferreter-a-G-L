const Producto = require('../../models/productoModel');
const { pool } = require('../../config/database');

// Mock del pool de base de datos
jest.mock('../../config/database');

describe('Producto - Pruebas Unitarias del Modelo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerTodos', () => {
    test('Obtener todos los productos exitosamente', async () => {
      // Arrange
      const mockProductos = [
        {
          id: 1,
          codigo_producto: 'P001',
          nombre: 'Martillo',
          precio_venta: 25000,
          stock_actual: 10,
          activo: true
        },
        {
          id: 2,
          codigo_producto: 'P002',
          nombre: 'Tornillo',
          precio_venta: 500,
          stock_actual: 50,
          activo: true
        }
      ];

      pool.query.mockResolvedValue({ rows: mockProductos });

      // Act
      const resultado = await Producto.obtenerTodos();

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
      expect(resultado).toEqual(mockProductos);
      expect(resultado).toHaveLength(2);
    });

    test('Error al obtener productos', async () => {
      // Arrange
      const error = new Error('Error de conexión a la base de datos');
      pool.query.mockRejectedValue(error);

      // Act & Assert
      await expect(Producto.obtenerTodos()).rejects.toThrow('Error de conexión a la base de datos');
    });
  });

  describe('buscarPorId', () => {
    test('Buscar producto por ID exitosamente', async () => {
      // Arrange
      const mockProducto = {
        id: 1,
        codigo_producto: 'P001',
        nombre: 'Martillo',
        descripcion: 'Martillo de carpintero',
        precio_venta: 25000,
        stock_actual: 10,
        activo: true
      };

      pool.query.mockResolvedValue({ rows: [mockProducto] });

      // Act
      const resultado = await Producto.buscarPorId(1);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        [1]
      );
      expect(resultado).toEqual(mockProducto);
    });

    test('Producto no encontrado por ID', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      const resultado = await Producto.buscarPorId(999);

      // Assert
      expect(resultado).toBeNull();
    });

    test('Error al buscar producto por ID', async () => {
      // Arrange
      const error = new Error('Error de base de datos');
      pool.query.mockRejectedValue(error);

      // Act & Assert
      await expect(Producto.buscarPorId(1)).rejects.toThrow('Error de base de datos');
    });
  });

  describe('crear', () => {
    test('Crear producto exitosamente', async () => {
      // Arrange
      const datosProducto = {
        codigo_producto: 'P003',
        nombre: 'Destornillador',
        descripcion: 'Destornillador Phillips',
        precio_venta: 8000,
        precio_compra: 5000,
        stock_actual: 20,
        stock_minimo: 5,
        categoria_id: 1
      };

      const mockProductoCreado = { id: 3, ...datosProducto };
      pool.query.mockResolvedValue({ rows: [mockProductoCreado] });

      // Act
      const resultado = await Producto.crear(datosProducto);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT'),
        expect.arrayContaining([
          datosProducto.codigo_producto,
          datosProducto.nombre,
          datosProducto.precio_venta
        ])
      );
      expect(resultado).toEqual(mockProductoCreado);
    });

    test('Error al crear producto', async () => {
      // Arrange
      const datosProducto = {
        codigo_producto: 'P003',
        nombre: 'Destornillador',
        precio_venta: 8000
      };

      const error = new Error('Error al insertar producto');
      pool.query.mockRejectedValue(error);

      // Act & Assert
      await expect(Producto.crear(datosProducto)).rejects.toThrow('Error al insertar producto');
    });
  });

  describe('actualizar', () => {
    test('Actualizar producto exitosamente', async () => {
      // Arrange
      const datosActualizacion = {
        nombre: 'Martillo Actualizado',
        precio_venta: 30000
      };

      const mockProductoActualizado = {
        id: 1,
        codigo_producto: 'P001',
        nombre: 'Martillo Actualizado',
        precio_venta: 30000
      };

      pool.query.mockResolvedValue({ rows: [mockProductoActualizado] });

      // Act
      const resultado = await Producto.actualizar(1, datosActualizacion);

      // Assert
      expect(pool.query).toHaveBeenCalled();
      expect(resultado).toEqual(mockProductoActualizado);
    });

    test('Producto no encontrado para actualizar', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      const resultado = await Producto.actualizar(999, { nombre: 'Nuevo Nombre' });

      // Assert
      expect(resultado).toBeNull();
    });
  });

  describe('eliminar', () => {
    test('Eliminar producto exitosamente', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rowCount: 1 });

      // Act
      const resultado = await Producto.eliminar(1);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        [1]
      );
      expect(resultado).toBe(true);
    });

    test('Producto no encontrado para eliminar', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rowCount: 0 });

      // Act
      const resultado = await Producto.eliminar(999);

      // Assert
      expect(resultado).toBe(false);
    });

    test('Error al eliminar producto', async () => {
      // Arrange
      const error = new Error('Error al eliminar');
      pool.query.mockRejectedValue(error);

      // Act & Assert
      await expect(Producto.eliminar(1)).rejects.toThrow('Error al eliminar');
    });
  });

  describe('stockBajo', () => {
    test('Obtener productos con stock bajo', async () => {
      // Arrange
      const mockProductosStockBajo = [
        {
          id: 2,
          codigo_producto: 'P002',
          nombre: 'Tornillo',
          stock_actual: 2,
          stock_minimo: 10
        }
      ];

      pool.query.mockResolvedValue({ rows: mockProductosStockBajo });

      // Act
      const resultado = await Producto.stockBajo();

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('stock_actual')
      );
      expect(resultado).toEqual(mockProductosStockBajo);
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

      pool.query.mockResolvedValue({ rows: [mockEstadisticas] });

      // Act
      const resultado = await Producto.obtenerEstadisticas();

      // Assert
      expect(pool.query).toHaveBeenCalled();
      expect(resultado).toEqual(mockEstadisticas);
    });

    test('Error al obtener estadísticas', async () => {
      // Arrange
      const error = new Error('Error de estadísticas');
      pool.query.mockRejectedValue(error);

      // Act & Assert
      await expect(Producto.obtenerEstadisticas()).rejects.toThrow('Error de estadísticas');
    });
  });
});