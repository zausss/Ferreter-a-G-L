 // Obtener referencias a elementos del DOM
        const formLogin = document.getElementById('form-login');
        const mensajeDiv = document.getElementById('mensaje-login');
        const botonSubmit = formLogin.querySelector('.boton-login');

        // Función para mostrar mensajes
        function mostrarMensaje(mensaje, esError = true) {
            mensajeDiv.textContent = mensaje;
            mensajeDiv.className = esError ? 'mensaje error' : 'mensaje exito';
            mensajeDiv.style.display = 'block';
            
            // Ocultar mensaje después de 5 segundos
            setTimeout(() => {
                mensajeDiv.style.display = 'none';
            }, 5000);
        }

        // Interceptar el envío del formulario
        formLogin.addEventListener('submit', async function(evento) {
            // PASO CLAVE: Prevenir envío normal del formulario
            evento.preventDefault();
            
            // Obtener datos del formulario
            const formData = new FormData(formLogin);
            const datosLogin = {
                email_usuario: formData.get('email_usuario'),
                password: formData.get('password')
            };

            // Cambiar texto del botón mientras procesa
            const textoOriginal = botonSubmit.textContent;
            botonSubmit.textContent = 'Iniciando sesión...';
            botonSubmit.disabled = true;

            try {
                // Hacer petición AJAX al servidor
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(datosLogin)
                });

                // Leer la respuesta JSON
                const resultado = await response.json();

                if (resultado.exito) {
                    // Login exitoso
                    mostrarMensaje('Login exitoso. Redirigiendo...', false);
                    
                    // Redirigir después de 1 segundo
                    setTimeout(() => {
                        window.location.href = resultado.redirectTo || '/dashboard';
                    }, 1000);
                    
                } else {
                    // Error en login
                    mostrarMensaje(resultado.mensaje);
                }

            } catch (error) {
                // Error de conexión o del servidor
                mostrarMensaje('Error de conexión. Intenta nuevamente.');
                console.error('Error:', error);
            } finally {
                // Restaurar botón
                botonSubmit.textContent = textoOriginal;
                botonSubmit.disabled = false;
            }
        });