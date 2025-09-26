// Registro de credenciales para empleados existentes - JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del formulario
    const formulario = document.getElementById('registro-form');
    const btnRegistrar = document.getElementById('btn-registrar');
    const mensajeExito = document.getElementById('mensaje-exito');
    const mensajeError = document.getElementById('mensaje-error');
    const infoEmpleado = document.getElementById('info-empleado');

    // Variables para empleado encontrado
    let empleadoVerificado = null;

    // Validación en tiempo real
    configurarValidacionTiempoReal();

    // Verificación de empleado cuando se completan cédula y correo
    const cedula = document.getElementById('cedula');
    const correo = document.getElementById('correo');
    
    cedula.addEventListener('blur', verificarEmpleado);
    correo.addEventListener('blur', verificarEmpleado);

    // Envío del formulario
    formulario.addEventListener('submit', manejarEnvioFormulario);
    
    // Configurar botones de mostrar/ocultar contraseña
    const botonesPassword = document.querySelectorAll('.btn-mostrar-password');
    botonesPassword.forEach(boton => {
        boton.addEventListener('click', function(e) {
            e.preventDefault();
            const campoPassword = this.parentElement.querySelector('input[type="password"], input[type="text"]');
            if (campoPassword) {
                togglePassword(campoPassword.id);
            }
        });
    });

    // Verificar si el empleado existe en el sistema
    async function verificarEmpleado() {
        const cedula = document.getElementById('cedula').value.trim();
        const correo = document.getElementById('correo').value.trim();
        
        // Solo verificar si ambos campos están completos
        if (!cedula || !correo || cedula.length < 7 || !correo.includes('@')) {
            ocultarInfoEmpleado();
            return;
        }

        try {
            const response = await fetch('/auth/verificar-empleado', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cedula, correo })
            });

            const resultado = await response.json();

            if (response.ok && resultado.exito) {
                empleadoVerificado = resultado.empleado;
                mostrarInfoEmpleado(resultado.empleado);
                ocultarMensajes();
            } else {
                empleadoVerificado = null;
                ocultarInfoEmpleado();
                if (resultado.mensaje) {
                    mostrarMensaje(resultado.mensaje, 'error');
                }
            }
        } catch (error) {
            console.error('Error verificando empleado:', error);
            empleadoVerificado = null;
            ocultarInfoEmpleado();
            mostrarMensaje('Error de conexión verificando empleado', 'error');
        }
    }

    // Mostrar información del empleado encontrado
    function mostrarInfoEmpleado(empleado) {
        document.getElementById('empleado-nombre').textContent = empleado.nombre_completo;
        document.getElementById('empleado-cargo').textContent = empleado.cargo || 'No asignado';
        
        const estadoElement = document.getElementById('empleado-estado');
        estadoElement.textContent = 'Puede crear credenciales';
        estadoElement.className = 'info-value estado-activo';
        
        document.getElementById('info-empleado').style.display = 'block';
    }

    // Ocultar información del empleado
    function ocultarInfoEmpleado() {
        document.getElementById('info-empleado').style.display = 'none';
    }

    // Envío del formulario
    async function manejarEnvioFormulario(event) {
        event.preventDefault();
        
        // Verificar que el empleado esté validado
        if (!empleadoVerificado) {
            mostrarMensaje('Primero debe verificar que es un empleado registrado', 'error');
            return;
        }
        
        // Validar todos los campos
        if (!validarFormularioCompleto()) {
            mostrarMensaje('Por favor, corrija los errores en el formulario', 'error');
            return;
        }
        
        // Deshabilitar botón y mostrar loading
        btnRegistrar.disabled = true;
        btnRegistrar.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="spinning">
                <path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.314-5.314l-2.828 2.828M9.514 14.686l-2.828 2.828m11.314 0l-2.828-2.828M9.514 9.514L6.686 6.686"/>
            </svg>
            Creando credenciales...
        `;
        
        try {
            // Recopilar datos del formulario
            const formData = new FormData(formulario);
            const datos = Object.fromEntries(formData.entries());
            
            // Agregar ID del empleado verificado
            datos.id_empleado = empleadoVerificado.id;
            
            // Enviar datos al servidor
            const response = await fetch('/auth/registro-credenciales', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datos)
            });
            
            const resultado = await response.json();
            
            if (response.ok && resultado.exito) {
                mostrarMensaje(resultado.mensaje || 'Credenciales creadas exitosamente', 'exito');
                
                // Limpiar formulario
                formulario.reset();
                ocultarInfoEmpleado();
                empleadoVerificado = null;
                
                // Redirigir después de 3 segundos
                setTimeout(() => {
                    window.location.href = '/auth/login';
                }, 3000);
                
            } else {
                mostrarMensaje(resultado.mensaje || 'Error creando las credenciales', 'error');
            }
            
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión. Intente nuevamente.', 'error');
        } finally {
            // Restaurar botón
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" />
                </svg>
                Crear Credenciales
            `;
        }
    }

    // Mostrar mensajes
    function mostrarMensaje(mensaje, tipo) {
        const mensajeElemento = tipo === 'exito' ? mensajeExito : mensajeError;
        const otroMensaje = tipo === 'exito' ? mensajeError : mensajeExito;
        
        if (!mensajeElemento) {
            return;
        }
        
        // Ocultar el otro mensaje
        if (otroMensaje) {
            otroMensaje.style.display = 'none';
        }
        
        // Mostrar mensaje actual
        const spanMensaje = mensajeElemento.querySelector('span');
        if (spanMensaje) {
            spanMensaje.textContent = mensaje;
        }
        mensajeElemento.style.display = 'flex';
        
        // Scroll hacia el mensaje
        mensajeElemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            mensajeElemento.style.display = 'none';
        }, 5000);
    }

    // Ocultar mensajes
    function ocultarMensajes() {
        if (mensajeExito) mensajeExito.style.display = 'none';
        if (mensajeError) mensajeError.style.display = 'none';
    }
});

// Configurar validación en tiempo real
function configurarValidacionTiempoReal() {
    // Validación de cédula
    const cedula = document.getElementById('cedula');
    cedula.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, ''); // Solo números
        validarCedula(this.value);
    });

    // Validación de nombre de usuario
    const nombreUsuario = document.getElementById('nombre-usuario');
    nombreUsuario.addEventListener('input', function() {
        validarNombreUsuario(this.value);
    });

    // Validación de correo
    const correo = document.getElementById('correo');
    correo.addEventListener('input', function() {
        validarCorreo(this.value);
    });

    // Validación de contraseñas
    const password = document.getElementById('password');
    const confirmarPassword = document.getElementById('confirmar-password');
    
    password.addEventListener('input', function() {
        validarPassword(this.value);
        if (confirmarPassword.value) {
            validarConfirmarPassword(this.value, confirmarPassword.value);
        }
    });
    
    confirmarPassword.addEventListener('input', function() {
        validarConfirmarPassword(password.value, this.value);
    });
}

// Validaciones individuales
function validarCedula(cedula) {
    const campo = document.getElementById('cedula').parentElement;
    const error = campo.querySelector('.campo-error') || crearElementoError(campo);
    
    if (cedula.length < 7 || cedula.length > 12) {
        mostrarErrorCampo(campo, error, 'La cédula debe tener entre 7 y 12 dígitos');
        return false;
    }
    
    ocultarErrorCampo(campo, error);
    return true;
}

function validarNombreUsuario(nombreUsuario) {
    const campo = document.getElementById('nombre-usuario').parentElement;
    const error = campo.querySelector('.campo-error') || crearElementoError(campo);
    
    if (nombreUsuario.length < 4) {
        mostrarErrorCampo(campo, error, 'El nombre de usuario debe tener al menos 4 caracteres');
        return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(nombreUsuario)) {
        mostrarErrorCampo(campo, error, 'Solo se permiten letras, números y guiones bajos');
        return false;
    }
    
    ocultarErrorCampo(campo, error);
    return true;
}

function validarCorreo(correo) {
    const campo = document.getElementById('correo').parentElement;
    const error = campo.querySelector('.campo-error') || crearElementoError(campo);
    
    const patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!patronCorreo.test(correo)) {
        mostrarErrorCampo(campo, error, 'Ingrese un correo electrónico válido');
        return false;
    }
    
    ocultarErrorCampo(campo, error);
    return true;
}

// Validar contraseña (simplificada)
function validarPassword(password) {
    const campo = document.getElementById('password').parentElement;
    const error = campo.querySelector('.campo-error') || crearElementoError(campo);
    
    if (password.length < 6) {
        mostrarErrorCampo(campo, error, 'La contraseña debe tener al menos 6 caracteres');
        return false;
    }
    
    ocultarErrorCampo(campo, error);
    return true;
}

// Validar confirmación de contraseña
function validarConfirmarPassword(password, confirmarPassword) {
    const campo = document.getElementById('confirmar-password').parentElement;
    const error = campo.querySelector('.campo-error') || crearElementoError(campo);
    
    if (confirmarPassword !== password) {
        mostrarErrorCampo(campo, error, 'Las contraseñas no coinciden');
        return false;
    }
    
    ocultarErrorCampo(campo, error);
    return true;
}

// Validar formulario completo
function validarFormularioCompleto() {
    const cedula = document.getElementById('cedula').value;
    const nombreUsuario = document.getElementById('nombre-usuario').value;
    const correo = document.getElementById('correo').value;
    const password = document.getElementById('password').value;
    const confirmarPassword = document.getElementById('confirmar-password').value;
    
    let esValido = true;
    
    if (!validarCedula(cedula)) esValido = false;
    if (!validarNombreUsuario(nombreUsuario)) esValido = false;
    if (!validarCorreo(correo)) esValido = false;
    if (!validarPassword(password)) esValido = false;
    if (!validarConfirmarPassword(password, confirmarPassword)) esValido = false;
    
    return esValido;
}

// Alternar visibilidad de contraseña
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.parentElement.querySelector('.btn-mostrar-password');
    
    if (field.type === 'password') {
        field.type = 'text';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 1 0 1.06-1.06l-18-18ZM22.676 12.553a11.249 11.249 0 0 1-2.631 4.31l-3.099-3.099a5.25 5.25 0 0 0-6.71-6.71L7.759 4.577a11.217 11.217 0 0 1 4.242-.827c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113Z"/>
                <path d="M15.75 12c0 .18-.013.357-.037.53l-4.244-4.243A3.75 3.75 0 0 1 15.75 12ZM12.53 15.713l-4.243-4.244a3.75 3.75 0 0 0 4.244 4.243Z"/>
                <path d="M6.75 12c0-.619.107-1.213.304-1.764l-3.1-3.1a11.25 11.25 0 0 0-2.63 4.31c-.12.362-.12.752 0 1.114 1.489 4.467 5.704 7.69 10.675 7.69 1.5 0 2.933-.294 4.242-.827l-2.477-2.477A5.25 5.25 0 0 1 6.75 12Z"/>
            </svg>
        `;
    } else {
        field.type = 'password';
        button.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clip-rule="evenodd" />
            </svg>
        `;
    }
}

// Funciones auxiliares para manejo de errores
function crearElementoError(campo) {
    const error = document.createElement('div');
    error.className = 'campo-error';
    campo.appendChild(error);
    return error;
}

function mostrarErrorCampo(campo, error, mensaje) {
    error.textContent = mensaje;
    error.style.display = 'block';
    campo.classList.add('campo-con-error');
}

function ocultarErrorCampo(campo, error) {
    error.style.display = 'none';
    campo.classList.remove('campo-con-error');
}

// CSS para animación de carga
const style = document.createElement('style');
style.textContent = `
    .spinning {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
