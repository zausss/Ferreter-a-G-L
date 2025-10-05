const Usuario = require('../../models/Usuario');
const bcrypt = require('bcrypt');
const { pool } = require('../../config/database');

// Mock del pool de base de datos
jest.mock('../../config/database');
jest.mock('bcrypt');

describe('Usuario - Pruebas Unitarias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('buscarParaLogin', () => {
    test('Buscar usuario exitoso', async () => {
      // Arrange
      const mockUsuario = {
        id: 1,
        nombre_usuario: 'Daniel',
        password_hash: 'hashedpassword',
        nombre_completo: 'Daniel Administrador',
        correo_electronico: 'daniel@test.com',
        rol_sistema: 'Administrador'
      };

      pool.query.mockResolvedValue({ rows: [mockUsuario] });

      // Act
      const resultado = await Usuario.buscarParaLogin('Daniel');

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['Daniel']
      );
      expect(resultado).toEqual(mockUsuario);
    });

    test('Usuario no encontrado', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rows: [] });

      // Act
      const resultado = await Usuario.buscarParaLogin('noexiste');

      // Assert
      expect(resultado).toBeNull();
    });

    test('Error en la base de datos', async () => {
      // Arrange
      const error = new Error('Error de conexión');
      pool.query.mockRejectedValue(error);

      // Act & Assert
      await expect(Usuario.buscarParaLogin('Daniel')).rejects.toThrow('Error de conexión');
    });
  });

  describe('verificarPassword', () => {
    test('Contraseña correcta', async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(true);

      // Act
      const resultado = await Usuario.verificarPassword('password123', 'hashedpassword');

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(resultado).toBe(true);
    });

    test('Contraseña incorrecta', async () => {
      // Arrange
      bcrypt.compare.mockResolvedValue(false);

      // Act
      const resultado = await Usuario.verificarPassword('passwordIncorrecta', 'hashedpassword');

      // Assert
      expect(resultado).toBe(false);
    });

    test('Error al verificar contraseña', async () => {
      // Arrange
      const error = new Error('Error de bcrypt');
      bcrypt.compare.mockRejectedValue(error);

      // Act & Assert
      await expect(Usuario.verificarPassword('password', 'hash')).rejects.toThrow('Error de bcrypt');
    });
  });

  describe('estaBloquado', () => {
    test('Usuario no bloqueado (sin fecha de bloqueo)', () => {
      // Arrange
      const usuario = { bloqueado_hasta: null };

      // Act
      const resultado = Usuario.estaBloquado(usuario);

      // Assert
      expect(resultado).toBe(false);
    });

    test('Usuario no bloqueado (fecha de bloqueo pasada)', () => {
      // Arrange
      const fechaPasada = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos atrás
      const usuario = { bloqueado_hasta: fechaPasada };

      // Act
      const resultado = Usuario.estaBloquado(usuario);

      // Assert
      expect(resultado).toBe(false);
    });

    test('Usuario bloqueado (fecha de bloqueo futura)', () => {
      // Arrange
      const fechaFutura = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos adelante
      const usuario = { bloqueado_hasta: fechaFutura };

      // Act
      const resultado = Usuario.estaBloquado(usuario);

      // Assert
      expect(resultado).toBe(true);
    });
  });

  describe('tieneAccesoAlSistema', () => {
    test('Rol Administrador tiene acceso', () => {
      // Act
      const resultado = Usuario.tieneAccesoAlSistema('Administrador');

      // Assert
      expect(resultado).toBe(true);
    });

    test('Rol Cajero tiene acceso', () => {
      // Act
      const resultado = Usuario.tieneAccesoAlSistema('Cajero');

      // Assert
      expect(resultado).toBe(true);
    });

    test('Rol Empleado no tiene acceso', () => {
      // Act
      const resultado = Usuario.tieneAccesoAlSistema('Empleado');

      // Assert
      expect(resultado).toBe(false);
    });

    test('Rol inexistente no tiene acceso', () => {
      // Act
      const resultado = Usuario.tieneAccesoAlSistema('RolInexistente');

      // Assert
      expect(resultado).toBe(false);
    });
  });

  describe('actualizarUltimoAcceso', () => {
    test('Actualización exitosa', async () => {
      // Arrange
      pool.query.mockResolvedValue({ rowCount: 1 });

      // Act
      await Usuario.actualizarUltimoAcceso(1);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios_sistema'),
        [1]
      );
    });

    test('Error al actualizar', async () => {
      // Arrange
      const error = new Error('Error de actualización');
      pool.query.mockRejectedValue(error);

      // Act & Assert
      await expect(Usuario.actualizarUltimoAcceso(1)).rejects.toThrow('Error de actualización');
    });
  });

  describe('incrementarIntentosFallidos', () => {
    test('Incrementar intentos exitosamente', async () => {
      // Arrange
      const mockResultado = {
        rows: [{
          intentos_fallidos: 2,
          bloqueado_hasta: null
        }]
      };
      pool.query.mockResolvedValue(mockResultado);

      // Act
      const resultado = await Usuario.incrementarIntentosFallidos(1);

      // Assert
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE usuarios_sistema'),
        [1]
      );
      expect(resultado).toEqual(mockResultado.rows[0]);
    });

    test('Incrementar hasta bloquear usuario', async () => {
      // Arrange
      const fechaBloqueo = new Date();
      const mockResultado = {
        rows: [{
          intentos_fallidos: 5,
          bloqueado_hasta: fechaBloqueo
        }]
      };
      pool.query.mockResolvedValue(mockResultado);

      // Act
      const resultado = await Usuario.incrementarIntentosFallidos(1);

      // Assert
      expect(resultado.intentos_fallidos).toBe(5);
      expect(resultado.bloqueado_hasta).toBe(fechaBloqueo);
    });

    test('Error al incrementar intentos', async () => {
      // Arrange
      const error = new Error('Error de base de datos');
      pool.query.mockRejectedValue(error);

      // Act & Assert
      await expect(Usuario.incrementarIntentosFallidos(1)).rejects.toThrow('Error de base de datos');
    });
  });
});