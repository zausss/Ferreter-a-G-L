const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');
const path = require('path');
const config = require('../config/config');

class AuthController {
    
    // Mostrar página de login
    static mostrarLogin(req, res) {
        // Si ya está autenticado, redirigir al dashboard
        if (req.cookies.token) {
            return res.redirect('/dashboard');
        }
        
        res.sendFile(path.join(__dirname, '../views/login.html'));
    }

    // Mostrar página de registro
    static mostrarRegistro(req, res) {
        // Si ya está autenticado, redirigir al dashboard
        if (req.cookies.token) {
            return res.redirect('/dashboard');
        }
        
        res.sendFile(path.join(__dirname, '../views/registro.html'));
    }

    // Procesar login
    static async procesarLogin(req, res) {
        try {
            const { email_usuario, password } = req.body;

            // Validar datos requeridos
            if (!email_usuario || !password) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Email/usuario y contraseña son requeridos'
                });
            }

            // Buscar usuario
            const usuario = await Usuario.buscarParaLogin(email_usuario);
            
            if (!usuario) {
                return res.status(401).json({
                    exito: false,
                    mensaje: 'Credenciales incorrectas'
                });
            }

            // Verificar si está bloqueado
            if (Usuario.estaBloquado(usuario)) {
                const tiempoBloqueo = new Date(usuario.bloqueado_hasta);
                return res.status(423).json({
                    exito: false,
                    mensaje: `Usuario bloqueado hasta ${tiempoBloqueo.toLocaleString('es-ES')} por múltiples intentos fallidos`
                });
            }

            // Verificar rol de acceso
            if (!Usuario.tieneAccesoAlSistema(usuario.rol_sistema)) {
                return res.status(403).json({
                    exito: false,
                    mensaje: 'Su cargo no tiene permisos para acceder al sistema'
                });
            }

            // Verificar contraseña
            const passwordValido = await Usuario.verificarPassword(password, usuario.password_hash);
            
            if (!passwordValido) {
                // Incrementar intentos fallidos
                await Usuario.incrementarIntentosFallidos(usuario.id);
                
                return res.status(401).json({
                    exito: false,
                    mensaje: 'Credenciales incorrectas'
                });
            }

            // Login exitoso - actualizar último acceso
            await Usuario.actualizarUltimoAcceso(usuario.id);

            // Generar token JWT
            const tokenPayload = {
                id: usuario.id,
                empleado_id: usuario.empleado_id,
                nombre_usuario: usuario.nombre_usuario,
                nombre_completo: usuario.nombre_completo,
                email: usuario.correo_electronico,
                rol: usuario.rol_sistema,
                cargo: usuario.nombre_cargo
            };

            const token = jwt.sign(
                tokenPayload,
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            // Establecer cookie segura
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 1000, // 60 minutos
                sameSite: 'strict'
            });

            // Respuesta de éxito
            // Si es petición AJAX, responder con JSON
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.json({
                    exito: true,
                    mensaje: 'Login exitoso',
                    usuario: {
                        nombre_completo: usuario.nombre_completo,
                        rol: usuario.rol_sistema,
                        cargo: usuario.nombre_cargo
                    },
                    redirectTo: '/dashboard'
                });
            }
            
            // Si es formulario HTML, redirigir directamente
            res.redirect('/dashboard');

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }

    // Logout
    static logout(req, res) {
        try {
            // Limpiar cookie
            res.clearCookie('token');
            
            // Si es petición AJAX
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.json({
                    exito: true,
                    mensaje: 'Sesión cerrada exitosamente',
                    redirectTo: '/login'
                });
            }
            
            // Si es petición normal, redirigir
            res.redirect('/auth/login');
            
        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error cerrando sesión'
            });
        }
    }

    // Verificar estado de autenticación
    static async verificarEstado(req, res) {
        try {
            if (!req.usuario) {
                return res.status(401).json({
                    autenticado: false
                });
            }

            res.json({
                autenticado: true,
                usuario: {
                    nombre_completo: req.usuario.nombre_completo,
                    rol: req.usuario.rol_sistema,
                    cargo: req.usuario.nombre_cargo
                }
            });

        } catch (error) {
            console.error('Error verificando estado:', error);
            res.status(500).json({
                autenticado: false,
                error: 'Error interno'
            });
        }
    }

    // Procesar registro de empleado
    static async procesarRegistro(req, res) {
        try {
            const {
                cedula,
                nombre_completo,
                telefono,
                correo_electronico,
                direccion,
                cargo_id,
                fecha_ingreso,
                salario,
                nombre_usuario,
                password,
                confirmar_password,
                terminos
            } = req.body;

            // Validaciones básicas
            if (!cedula || !nombre_completo || !telefono || !correo_electronico || 
                !cargo_id || !fecha_ingreso || !salario || !nombre_usuario || !password) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Todos los campos marcados con * son obligatorios'
                });
            }

            // Validar que las contraseñas coincidan
            if (password !== confirmar_password) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Las contraseñas no coinciden'
                });
            }

            // Validar términos y condiciones
            if (!terminos) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Debe aceptar los términos y condiciones'
                });
            }

            // Validar formato de cédula
            if (!/^\d{7,10}$/.test(cedula)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'La cédula debe contener entre 7 y 10 dígitos'
                });
            }

            // Validar formato de correo
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo_electronico)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El formato del correo electrónico no es válido'
                });
            }

            // Validar nombre de usuario
            if (!/^[a-zA-Z0-9_]{4,50}$/.test(nombre_usuario)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El nombre de usuario solo puede contener letras, números y guiones bajos (4-50 caracteres)'
                });
            }

            // Validar contraseña
            if (password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números'
                });
            }

            // Verificar si la cédula ya existe
            const empleadoExistente = await Usuario.buscarEmpleadoPorCedula(cedula);
            if (empleadoExistente) {
                return res.status(409).json({
                    exito: false,
                    mensaje: 'Ya existe un empleado registrado con esta cédula'
                });
            }

            // Verificar si el correo ya existe
            const correoExistente = await Usuario.buscarPorCorreo(correo_electronico);
            if (correoExistente) {
                return res.status(409).json({
                    exito: false,
                    mensaje: 'Ya existe un empleado registrado con este correo electrónico'
                });
            }

            // Verificar si el nombre de usuario ya existe
            const usuarioExistente = await Usuario.buscarPorNombreUsuario(nombre_usuario);
            if (usuarioExistente) {
                return res.status(409).json({
                    exito: false,
                    mensaje: 'El nombre de usuario ya está en uso'
                });
            }

            // Crear empleado y usuario
            const empleadoId = await Usuario.crearEmpleadoCompleto({
                cedula,
                nombre_completo,
                telefono,
                correo_electronico,
                direccion: direccion || null,
                cargo_id: parseInt(cargo_id),
                fecha_ingreso,
                salario: parseFloat(salario),
                nombre_usuario,
                password
            });

            // Respuesta exitosa
            res.status(201).json({
                exito: true,
                mensaje: 'Empleado registrado exitosamente. Ya puede iniciar sesión con sus credenciales.',
                empleado_id: empleadoId
            });

        } catch (error) {
            console.error('Error en registro de empleado:', error);
            
            if (error.message.includes('cargo_id')) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El cargo seleccionado no es válido'
                });
            }
            
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor. Intente nuevamente.'
            });
        }
    }

    // Verificar empleado
    static async verificarEmpleado(req, res) {
        try {
            const { cedula, correo } = req.body;

            // Validar datos requeridos
            if (!cedula || !correo) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Cédula y correo son requeridos'
                });
            }

            // Buscar empleado
            const empleado = await Usuario.verificarEmpleado(cedula, correo);
            
            if (!empleado) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'No se encontró un empleado activo con esos datos'
                });
            }

            // Devolver información del empleado (sin datos sensibles)
            res.json({
                exito: true,
                mensaje: 'Empleado encontrado',
                empleado: {
                    id: empleado.id,
                    cedula: empleado.cedula,
                    nombre_completo: empleado.nombre_completo,
                    correo_electronico: empleado.correo_electronico,
                    cargo: empleado.nombre_cargo || 'Sin cargo asignado',
                    fecha_ingreso: empleado.fecha_ingreso
                }
            });

        } catch (error) {
            console.error('Error verificando empleado:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }

    // Crear credenciales para empleado
    static async crearCredenciales(req, res) {
        try {
            const { id_empleado, nombre_usuario, password } = req.body;

            // Validar datos requeridos
            if (!id_empleado || !nombre_usuario || !password) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Todos los campos son requeridos'
                });
            }

            // Validar contraseña (menos estricta)
            if (password.length < 6) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Crear credenciales
            const usuario = await Usuario.crearCredencialesEmpleado(id_empleado, nombre_usuario, password);

            res.status(201).json({
                exito: true,
                mensaje: 'Credenciales creadas exitosamente',
                usuario: {
                    id: usuario.id,
                    nombre_usuario: usuario.nombre_usuario,
                    fecha_creacion: usuario.fecha_creacion
                }
            });

        } catch (error) {
            console.error('Error creando credenciales:', error);
            
            // Errores específicos
            if (error.message.includes('ya tiene credenciales')) {
                return res.status(409).json({
                    exito: false,
                    mensaje: 'Este empleado ya tiene credenciales en el sistema'
                });
            }
            
            if (error.message.includes('ya está en uso')) {
                return res.status(409).json({
                    exito: false,
                    mensaje: 'El nombre de usuario ya está en uso'
                });
            }

            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }

    // Obtener información del usuario autenticado
    static async obtenerInfoUsuario(req, res) {
        try {
            // El middleware verificarToken ya agregó la información del usuario a req.usuario
            const { id, nombre_usuario, nombre_completo, email, rol_sistema } = req.usuario;

            res.json({
                exito: true,
                usuario: {
                    id: id,
                    nombre_usuario: nombre_usuario,
                    nombre_completo: nombre_completo,
                    email: email,
                    cargo: rol_sistema
                }
            });

        } catch (error) {
            console.error('Error obteniendo información del usuario:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AuthController;
