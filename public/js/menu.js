// JavaScript para funcionalidad del menú lateral
document.addEventListener('DOMContentLoaded', function() {
    console.log('Menu.js cargado correctamente');
    
    // Seleccionar todos los elementos que tienen submenu
    const elementosConSubmenu = document.querySelectorAll('.tiene-submenu');
    console.log('Elementos con submenu encontrados:', elementosConSubmenu.length);
    
    elementosConSubmenu.forEach(elemento => {
        const enlace = elemento.querySelector('.item-navegacion');
        const submenu = elemento.querySelector('.submenu');
        
        console.log('Elemento:', elemento);
        console.log('Enlace:', enlace);
        console.log('Submenu:', submenu);
        
        if (enlace && submenu) {
            // Agregar evento click al enlace principal
            enlace.addEventListener('click', function(e) {
                e.preventDefault(); // Evitar navegación
                console.log('Click en enlace del submenu');
                
                // Alternar clase activo en el elemento padre
                elemento.classList.toggle('activo');
                
                // Alternar clase mostrar en el submenu
                submenu.classList.toggle('mostrar');
                
                console.log('Clases después del toggle:');
                console.log('Elemento activo:', elemento.classList.contains('activo'));
                console.log('Submenu mostrar:', submenu.classList.contains('mostrar'));
                
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
