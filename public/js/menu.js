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
