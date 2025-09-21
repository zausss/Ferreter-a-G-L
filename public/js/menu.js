// JavaScript para funcionalidad del menú lateral
document.addEventListener('DOMContentLoaded', function() {
    // Cargar información del usuario al cargar la página
    cargarInfoUsuario();
    
    // Cargar estadísticas del dashboard
    cargarEstadisticasDashboard();
    
    // Seleccionar todos los elementos que tienen submenu
    const elementosConSubmenu = document.querySelectorAll('.tiene-submenu');
    
    elementosConSubmenu.forEach(elemento => {
        const enlace = elemento.querySelector('.item-navegacion');
        const submenu = elemento.querySelector('.submenu');
        
        if (enlace && submenu) {
            // Agregar evento click al enlace principal
            enlace.addEventListener('click', function(e) {
                e.preventDefault(); // Evitar navegación
                
                // Alternar clase activo en el elemento padre
                elemento.classList.toggle('activo');
                
                // Alternar clase mostrar en el submenu
                submenu.classList.toggle('mostrar');
                
                // Cerrar otros submenus abiertos
                elementosConSubmenu.forEach(otroElemento => {
                    if (otroElemento !== elemento) {
                        otroElemento.classList.remove('activo');
                        const otroSubmenu = otroElemento.querySelector('.submenu');
                        if (otroSubmenu) {
                            otroSubmenu.classList.remove('mostrar');
                        }
                    }
                });
            });
        }
    });
    
    // Funcionalidad para cerrar submenus al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.tiene-submenu')) {
            elementosConSubmenu.forEach(elemento => {
                elemento.classList.remove('activo');
                const submenu = elemento.querySelector('.submenu');
                if (submenu) {
                    submenu.classList.remove('mostrar');
                }
            });
        }
    });
});

// Función para confirmar cierre de sesión
function confirmarCerrarSesion(event) {
    event.preventDefault(); // Evitar navegación inmediata
    
    // Mostrar confirmación
    const confirmar = confirm('¿Estás seguro de que deseas cerrar sesión?');
    
    if (confirmar) {
        // Mostrar mensaje de carga
        const botonCerrarSesion = document.getElementById('cerrar-sesion');
        const spanTexto = botonCerrarSesion.querySelector('span');
        const textoOriginal = spanTexto.textContent;
        
        spanTexto.textContent = 'Cerrando...';
        botonCerrarSesion.style.opacity = '0.6';
        botonCerrarSesion.style.pointerEvents = 'none';
        
        // Hacer petición de logout
        fetch('/auth/logout', {
            method: 'GET',
            credentials: 'include' // Incluir cookies
        })
        .then(response => {
            if (response.ok || response.redirected) {
                // Redirigir al login
                window.location.href = '/auth/login';
            } else {
                throw new Error('Error cerrando sesión');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al cerrar sesión. Intenta nuevamente.');
            
            // Restaurar botón
            spanTexto.textContent = textoOriginal;
            botonCerrarSesion.style.opacity = '1';
            botonCerrarSesion.style.pointerEvents = 'auto';
        });
    }
}

// Función para cargar información del usuario autenticado
async function cargarInfoUsuario() {
    try {
        const response = await fetch('/auth/usuario-info', {
            method: 'GET',
            credentials: 'include' // Incluir cookies
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.exito && data.usuario) {
                const saludoElement = document.getElementById('saludo-usuario');
                
                if (saludoElement) {
                    // Personalizar el saludo con nombre y cargo
                    const nombreCompleto = data.usuario.nombre_completo;
                    const cargo = data.usuario.cargo;
                    
                    saludoElement.textContent = `Hola, ${nombreCompleto} (${cargo})`;
                }
            }
        } else {
            // Si hay error de autenticación, redirigir al login
            if (response.status === 401) {
                window.location.href = '/auth/login';
            }
        }
    } catch (error) {
        console.error('Error cargando información del usuario:', error);
        // En caso de error, mantener el texto por defecto
    }
}

// Función para cargar estadísticas del dashboard
async function cargarEstadisticasDashboard() {
    try {
        const response = await fetch('/api/productos/estadisticas', {
            method: 'GET',
            credentials: 'include' // Incluir cookies
        });

        if (response.ok) {
            const data = await response.json();
            
            if (data.exito && data.estadisticas) {
                // Actualizar total de productos
                const totalProductosElement = document.getElementById('total-productos');
                if (totalProductosElement) {
                    totalProductosElement.textContent = data.estadisticas.total_productos;
                }
                
                // Puedes agregar más estadísticas aquí si quieres
                // Por ejemplo, valor total del inventario, productos con stock bajo, etc.
            }
        } else {
            // Si hay error de autenticación, no mostrar error en este caso
            if (response.status === 401) {
                console.log('Usuario no autenticado para estadísticas');
            }
        }
    } catch (error) {
        console.error('Error cargando estadísticas del dashboard:', error);
        // En caso de error, mantener texto por defecto
        const totalProductosElement = document.getElementById('total-productos');
        if (totalProductosElement) {
            totalProductosElement.textContent = 'Error';
        }
    }
}
