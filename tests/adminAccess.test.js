const request = require('supertest');
const app = require('../app');

describe('Pruebas de acceso a funciones de administrador', () => {
  let tokenCajero;

  beforeAll(async () => {
    // Iniciar sesión como Marcela (rol Cajero) para obtener el token
    const res = await request(app)
      .post('/auth/login')
      .send({ email_usuario: 'Marcela', password: '1234' });
    // Si tu backend responde con redirección, podrías necesitar ajustar esto
    tokenCajero = res.headers['set-cookie']
      ? res.headers['set-cookie'].find(c => c.startsWith('token='))?.split(';')[0].split('=')[1]
      : undefined;
  });

  test('Acceso denegado a ruta solo admin con usuario cajero', async () => {
    // Suponiendo que /api/categorias es solo para admin
    const res = await request(app)
      .post('/api/categorias')
      .set('Cookie', [`token=${tokenCajero}`])
      .set('Accept', 'application/json')
      .send({ nombre: 'NuevaCategoria' });
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty('mensaje');
  });
});
