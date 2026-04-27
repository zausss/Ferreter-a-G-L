// JavaScript para funcionalidad del menú lateral
document.addEventListener('DOMContentLoaded', function() {
    // Cargar información del usuario al cargar la página
    cargarInfoUsuario();
    
    // Cargar estadísticas del dashboard
    cargarEstadisticasDashboard();
    
    // Agregar evento al botón de reporte completo
    const btnReporteCompleto = document.getElementById('btn-reporte-completo');
    if (btnReporteCompleto) {
        btnReporteCompleto.addEventListener('click', abrirReporteCompleto);
    }
    
    // Agregar evento al botón cerrar modal
    const cerrarModalBtn = document.getElementById('cerrar-modal-reporte');
    if (cerrarModalBtn) {
        cerrarModalBtn.addEventListener('click', cerrarReporteCompleto);
    }
    
    // Agregar evento al botón cerrar reporte
    const btnCerrarReporte = document.getElementById('btn-cerrar-reporte');
    if (btnCerrarReporte) {
        btnCerrarReporte.addEventListener('click', cerrarReporteCompleto);
    }
    
    // Agregar evento al botón descargar reporte
    const btnDescargarReporte = document.getElementById('btn-descargar-reporte');
    if (btnDescargarReporte) {
        btnDescargarReporte.addEventListener('click', descargarReporte);
    }
    
    // Cerrar modal al hacer clic en el fondo
    const modalReporte = document.getElementById('modal-reporte');
    if (modalReporte) {
        modalReporte.addEventListener('click', function(e) {
            if (e.target === modalReporte) {
                cerrarReporteCompleto();
            }
        });
    }

    // Agregar evento click a la tarjeta de bajo stock
    const tarjetaBajoStock = document.getElementById('tarjeta-bajo-stock');
    if (tarjetaBajoStock) {
        tarjetaBajoStock.addEventListener('click', abrirModalBajoStock);
    }

    // Agregar evento al botón cerrar modal bajo stock
    const cerrarModalBajoStockBtn = document.getElementById('cerrar-modal-bajo-stock');
    if (cerrarModalBajoStockBtn) {
        cerrarModalBajoStockBtn.addEventListener('click', cerrarModalBajoStock);
    }

    // Agregar evento al botón cerrar bajo stock
    const btnCerrarBajoStock = document.getElementById('btn-cerrar-bajo-stock');
    if (btnCerrarBajoStock) {
        btnCerrarBajoStock.addEventListener('click', cerrarModalBajoStock);
    }

    // Cerrar modal al hacer clic en el fondo
    const modalBajoStock = document.getElementById('modal-bajo-stock');
    if (modalBajoStock) {
        modalBajoStock.addEventListener('click', function(e) {
            if (e.target === modalBajoStock) {
                cerrarModalBajoStock();
            }
        });
    }

    // ==========================
    // Modal: Actividades del día
    // ==========================
    const btnVerActividades = document.getElementById('btn-ver-actividades');
    if (btnVerActividades) {
        btnVerActividades.addEventListener('click', abrirModalActividades);
    }

    // Abrir modal al hacer click en el encabezado de la sección (como Resumen del día)
    const encabezadoActividades = document.getElementById('encabezado-actividades');
    if (encabezadoActividades) {
        encabezadoActividades.addEventListener('click', function() {
            abrirModalActividades();
        });
    }

    // Fallback: abrir modal si hacen click en la caja completa (excepto botones/enlaces)
    const cajaActividades = document.querySelector('.caja-seccion.actividades-recientes');
    if (cajaActividades) {
        cajaActividades.addEventListener('click', function(e) {
            // No interceptar clicks en botones o enlaces (ej: Registrar venta)
            if (e.target.closest('button, a')) return;
            // Tampoco si el click fue dentro del encabezado-tabla o contenido (deja scroll/selección normal)
            if (e.target.closest('.encabezado-tabla, .contenido-seccion')) return;
            abrirModalActividades();
        });
    }

    const cerrarModalActividadesBtn = document.getElementById('cerrar-modal-actividades');
    if (cerrarModalActividadesBtn) {
        cerrarModalActividadesBtn.addEventListener('click', cerrarModalActividades);
    }

    const btnCerrarActividades = document.getElementById('btn-cerrar-actividades');
    if (btnCerrarActividades) {
        btnCerrarActividades.addEventListener('click', cerrarModalActividades);
    }

    const modalActividades = document.getElementById('modal-actividades');
    if (modalActividades) {
        modalActividades.addEventListener('click', function(e) {
            if (e.target === modalActividades) {
                cerrarModalActividades();
            }
        });
    }

    // Cerrar con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarReporteCompleto();
            cerrarModalBajoStock();
            cerrarModalActividades();
        }
    });
    
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

// ================================
// FUNCIONES PARA MODAL ACTIVIDADES
// ================================

function abrirModalActividades() {
    const modal = document.getElementById('modal-actividades');
    if (!modal) return;
    modal.classList.add('activo');
    cargarActividadesDelDiaModal();
}

function cerrarModalActividades() {
    const modal = document.getElementById('modal-actividades');
    if (!modal) return;
    modal.classList.remove('activo');
}

async function cargarActividadesDelDiaModal() {
    const contenedor = document.getElementById('contenido-actividades-modal');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="fila-datos">
            <div class="celda" style="grid-column: 1 / -1;">Cargando actividades...</div>
        </div>
    `;

    try {
        const response = await fetch('/api/actividades/recientes', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            contenedor.innerHTML = `
                <div class="fila-datos">
                    <div class="celda" style="grid-column: 1 / -1;">No se pudieron cargar las actividades.</div>
                </div>
            `;
            return;
        }

        const data = await response.json();
        const actividades = Array.isArray(data.actividades) ? data.actividades : [];

        if (!data.exito || actividades.length === 0) {
            contenedor.innerHTML = `
                <div class="fila-datos">
                    <div class="celda" style="grid-column: 1 / -1;">No hay actividades registradas para hoy.</div>
                </div>
            `;
            return;
        }

        contenedor.innerHTML = '';
        actividades.forEach(actividad => {
            const fecha = actividad.fecha ? new Date(actividad.fecha) : null;
            const hora = fecha ? fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : '—';
            const estado = (actividad.estado || 'pendiente').toString();
            const estadoLabel = estado.charAt(0).toUpperCase() + estado.slice(1);

            const filaHtml = `
                <div class="fila-datos">
                    <div class="celda">${actividad.descripcion ?? '—'}</div>
                    <div class="celda">${hora}</div>
                    <div class="celda estado ${estado}"><span>${estadoLabel}</span></div>
                </div>
            `;
            contenedor.insertAdjacentHTML('beforeend', filaHtml);
        });
    } catch (error) {
        console.error('Error cargando actividades del día (modal):', error);
        contenedor.innerHTML = `
            <div class="fila-datos">
                <div class="celda" style="grid-column: 1 / -1;">Ocurrió un error cargando las actividades.</div>
            </div>
        `;
    }
}

// Función para confirmar cierre de sesión
async function confirmarCerrarSesion(event) {
    event.preventDefault(); // Evitar navegación inmediata
    
    // Mostrar confirmación personalizada
    const confirmar = await customAlert.confirm(
        '¿Estás seguro de que deseas cerrar tu sesión actual?',
        'Cerrar Sesión'
    );
    
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
            customAlert.alert('Hubo un problema al cerrar la sesión. Por favor, intenta nuevamente.', 'Error', 'error');
            
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
                    totalProductosElement.textContent = data.estadisticas.total_productos || '0';
                }
                
                // Cargar información de bajo stock
                cargarProductosBajoStock();
                
                // Cargar información de ventas
                cargarInformacionVentas();
                
                // Cargar información de clientes
                cargarInformacionClientes();
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
    } finally {
        // Actividades no deberían depender de la carga de productos.
        // Así evitamos que se quede la información estática en pantalla.
        cargarActividadesRecientes();
    }
}

// Función para cargar información de ventas
async function cargarInformacionVentas() {
    try {
        const response = await fetch('/api/ventas/estadisticas', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito) {
                // Actualizar total ventas hoy
                const ventasHoyElement = document.querySelector('.tarjeta:nth-child(2) .valor-tarjeta');
                if (ventasHoyElement && data.estadisticas.ventas_hoy) {
                    ventasHoyElement.textContent = '$' + data.estadisticas.ventas_hoy.toLocaleString('es-CO', {minimumFractionDigits: 2});
                }

                // =====================
                // Resumen del día (MENÚ)
                // =====================

                // Ventas realizadas (si el endpoint trae total_ventas lo usamos, si no, hacemos fallback)
                const resumenVentasRealizadas = document.getElementById('resumen-ventas-realizadas');
                if (resumenVentasRealizadas) {
                    const totalVentas = Number(data.estadisticas.total_ventas ?? 0);
                    resumenVentasRealizadas.textContent = totalVentas + ' venta' + (totalVentas !== 1 ? 's' : '');
                }

                // Actualizar ingresos del día
                const ingresosElement = document.getElementById('resumen-ingresos-dia');
                if (ingresosElement) {
                    const ingresos = Number(data.estadisticas.ventas_hoy ?? 0);
                    ingresosElement.textContent = '$' + ingresos.toLocaleString('es-CO', { minimumFractionDigits: 2 });
                }

                // Actualizar productos vendidos
                const productosVendidosElement = document.getElementById('resumen-productos-vendidos');
                if (productosVendidosElement) {
                    const vendidos = Number(data.estadisticas.productos_vendidos ?? 0);
                    productosVendidosElement.textContent = vendidos + ' unidade' + (vendidos !== 1 ? 's' : '');
                }
            }
        }
    } catch (error) {
        console.error('Error cargando información de ventas:', error);
    }
}

// Función para cargar información de clientes
async function cargarInformacionClientes() {
    try {
        const response = await fetch('/api/clientes/estadisticas', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito) {
                // Actualizar clientes atendidos (Resumen del día en el MENÚ)
                const clientesElement = document.getElementById('resumen-clientes-atendidos');
                if (clientesElement) {
                    const totalClientes = Number(data.estadisticas.total_clientes ?? 0);
                    clientesElement.textContent = totalClientes + ' cliente' + (totalClientes !== 1 ? 's' : '');
                }
            }
        }
    } catch (error) {
        console.error('Error cargando información de clientes:', error);
    }
}

// Función para cargar actividades recientes
async function cargarActividadesRecientes() {
    try {
        const response = await fetch('/api/actividades/recientes', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.exito && data.actividades) {
                // Actualizar la sección de actividades
                const contenidoActividades = document.querySelector('.actividades-recientes .contenido-seccion');
                if (contenidoActividades && data.actividades.length > 0) {
                    // Limpiar contenido actual
                    contenidoActividades.innerHTML = '';
                    
                    // Agregar nuevas actividades (máximo 5)
                    data.actividades.slice(0, 5).forEach(actividad => {
                        const filaHtml = `
                            <div class="fila-datos">
                                <div class="celda">${actividad.descripcion}</div>
                                <div class="celda">${new Date(actividad.fecha).toLocaleTimeString('es-CO', {
                                                    timeZone: 'America/Bogota',
                                                    hour: '2-digit',
                                                    minute: '2-digit'})}</div>
                                <div class="celda estado ${actividad.estado}"><span>${actividad.estado.charAt(0).toUpperCase() + actividad.estado.slice(1)}</span></div>
                            </div>
                        `;
                        contenidoActividades.insertAdjacentHTML('beforeend', filaHtml);
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error cargando actividades recientes:', error);
    }
}

// Función para cargar productos con bajo stock
async function cargarProductosBajoStock() {
    try {
        const response = await fetch('/api/productos/stock-bajo', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                // Actualizar la tarjeta de bajo stock
                const bajoStockElement = document.getElementById('bajo-stock');
                if (bajoStockElement) {
                    const cantidad = Array.isArray(data.data) ? data.data.length : 0;
                    bajoStockElement.textContent = cantidad + ' unidade' + (cantidad !== 1 ? 's' : '');
                }
            }
        }
    } catch (error) {
        console.error('Error cargando productos con bajo stock:', error);
        // Mostrar valor por defecto en caso de error
        const bajoStockElement = document.getElementById('bajo-stock');
        if (bajoStockElement) {
            bajoStockElement.textContent = '0 unidades';
        }
    }
}

// ===========================
// FUNCIONES PARA MODAL REPORTE
// ===========================

// Objeto para almacenar datos del reporte
const datosReporte = {
    ventas_realizadas: 0,
    ingresos_dia: 0,
    productos_vendidos: 0,
    clientes_atendidos: 0,
    total_productos: 0,
    bajo_stock: 0
};

// Función para abrir el modal de reporte completo
function abrirReporteCompleto() {
    const modal = document.getElementById('modal-reporte');
    if (modal) {
        modal.classList.add('activo');
        // Llenar el modal con los datos actuales
        llenarReporteCompleto();
    }
}

// Función para cerrar el modal de reporte completo
function cerrarReporteCompleto() {
    const modal = document.getElementById('modal-reporte');
    if (modal) {
        modal.classList.remove('activo');
    }
}

// Función para llenar el modal con los datos del reporte
async function llenarReporteCompleto() {
    try {
        // Obtener información de ventas
        const responseVentas = await fetch('/api/ventas/estadisticas', {
            method: 'GET',
            credentials: 'include'
        });

        // Obtener información de clientes
        const responseClientes = await fetch('/api/clientes/estadisticas', {
            method: 'GET',
            credentials: 'include'
        });

        // Obtener información de productos
        const responseProductos = await fetch('/api/productos/estadisticas', {
            method: 'GET',
            credentials: 'include'
        });

        // Obtener información de bajo stock
        const responseBajoStock = await fetch('/api/productos/stock-bajo', {
            method: 'GET',
            credentials: 'include'
        });

        // Procesar datos de ventas
        if (responseVentas.ok) {
            const dataVentas = await responseVentas.json();
            if (dataVentas.exito && dataVentas.estadisticas) {
                datosReporte.ventas_realizadas = dataVentas.estadisticas.total_ventas || 0;
                datosReporte.ingresos_dia = dataVentas.estadisticas.ventas_hoy || 0;
                datosReporte.productos_vendidos = dataVentas.estadisticas.productos_vendidos || 0;
            }
        }

        // Procesar datos de clientes
        if (responseClientes.ok) {
            const dataClientes = await responseClientes.json();
            if (dataClientes.exito && dataClientes.estadisticas) {
                datosReporte.clientes_atendidos = dataClientes.estadisticas.total_clientes || 0;
            }
        }

        // Procesar datos de productos
        if (responseProductos.ok) {
            const dataProductos = await responseProductos.json();
            if (dataProductos.exito && dataProductos.estadisticas) {
                datosReporte.total_productos = dataProductos.estadisticas.total_productos || 0;
            }
        }

        // Procesar datos de bajo stock
        if (responseBajoStock.ok) {
            const dataBajoStock = await responseBajoStock.json();
            if (dataBajoStock.success && dataBajoStock.data) {
                datosReporte.bajo_stock = Array.isArray(dataBajoStock.data) ? dataBajoStock.data.length : 0;
            }
        }

        // Actualizar elementos del modal
        actualizarElementosReporte();

    } catch (error) {
        console.error('Error llenando reporte completo:', error);
        customAlert.alert('Error al cargar el reporte. Por favor, intenta nuevamente.', 'Error', 'error');
    }
}

// Función para actualizar los elementos del modal con los datos
function actualizarElementosReporte() {
    // Actualizar tarjetas de reporte
    const reporteVentasRealizadas = document.getElementById('reporte-ventas-realizadas');
    if (reporteVentasRealizadas) {
        reporteVentasRealizadas.textContent = datosReporte.ventas_realizadas + ' venta' + (datosReporte.ventas_realizadas !== 1 ? 's' : '');
    }

    const reporteIngresosDia = document.getElementById('reporte-ingresos-dia');
    if (reporteIngresosDia) {
        reporteIngresosDia.textContent = '$' + datosReporte.ingresos_dia.toLocaleString('es-CO', { minimumFractionDigits: 2 });
    }

    const reporteProductosVendidos = document.getElementById('reporte-productos-vendidos');
    if (reporteProductosVendidos) {
        reporteProductosVendidos.textContent = datosReporte.productos_vendidos + ' unidade' + (datosReporte.productos_vendidos !== 1 ? 's' : '');
    }

    const reporteClientesAtendidos = document.getElementById('reporte-clientes-atendidos');
    if (reporteClientesAtendidos) {
        reporteClientesAtendidos.textContent = datosReporte.clientes_atendidos + ' cliente' + (datosReporte.clientes_atendidos !== 1 ? 's' : '');
    }

    const reporteTotalProductos = document.getElementById('reporte-total-productos');
    if (reporteTotalProductos) {
        reporteTotalProductos.textContent = datosReporte.total_productos + ' producto' + (datosReporte.total_productos !== 1 ? 's' : '');
    }

    const reporteBajoStock = document.getElementById('reporte-bajo-stock');
    if (reporteBajoStock) {
        reporteBajoStock.textContent = datosReporte.bajo_stock + ' unidade' + (datosReporte.bajo_stock !== 1 ? 's' : '');
    }

    // Actualizar información adicional
    const ahora = new Date();
    
    const reporteFecha = document.getElementById('reporte-fecha');
    if (reporteFecha) {
        reporteFecha.textContent = ahora.toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    const reporteHora = document.getElementById('reporte-hora');
    if (reporteHora) {
        reporteHora.textContent = ahora.toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // Obtener información del usuario
    const saludo = document.getElementById('saludo-usuario');
    const reporteUsuario = document.getElementById('reporte-usuario');
    if (reporteUsuario && saludo) {
        reporteUsuario.textContent = saludo.textContent.replace('Hola, ', '');
    }
}

// Función para descargar el reporte como PDF o imagen
function descargarReporte() {
    try {
        // Crear contenido del reporte en texto
        const fecha = new Date();
        const fechaFormato = fecha.toLocaleDateString('es-CO');
        const horaFormato = fecha.toLocaleTimeString('es-CO');

        const contenido = `
REPORTE COMPLETO DEL DÍA - FERRETERÍA J&L
${'='.repeat(60)}

FECHA: ${fechaFormato}
HORA: ${horaFormato}

RESUMEN DEL DÍA
${'='.repeat(60)}

Ventas Realizadas: ${datosReporte.ventas_realizadas} venta${datosReporte.ventas_realizadas !== 1 ? 's' : ''}
Ingresos del Día: $${datosReporte.ingresos_dia.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
Productos Vendidos: ${datosReporte.productos_vendidos} unidade${datosReporte.productos_vendidos !== 1 ? 's' : ''}
Clientes Atendidos: ${datosReporte.clientes_atendidos} cliente${datosReporte.clientes_atendidos !== 1 ? 's' : ''}
Total Productos: ${datosReporte.total_productos} producto${datosReporte.total_productos !== 1 ? 's' : ''}
Bajo Stock: ${datosReporte.bajo_stock} unidade${datosReporte.bajo_stock !== 1 ? 's' : ''}

${'='.repeat(60)}
Generado por: Ferretería J&L - Sistema de Gestión
        `;

        // Crear blob con el contenido
        const blob = new Blob([contenido], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte-J&L-${fechaFormato.replace(/\//g, '-')}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        // Mostrar notificación de éxito
        customAlert.alert('Reporte descargado exitosamente', 'Éxito', 'exito');
    } catch (error) {
        console.error('Error descargando reporte:', error);
        customAlert.alert('Error al descargar el reporte', 'Error', 'error');
    }
}

// ===========================
// FUNCIONES PARA MODAL BAJO STOCK
// ===========================

// Datos de bajo stock
let productosBajoStock = [];

// Función para abrir el modal de bajo stock
async function abrirModalBajoStock() {
    const modal = document.getElementById('modal-bajo-stock');
    if (modal) {
        // Cargar productos con bajo stock
        await cargarProductosBajoStockModal();
        modal.classList.add('activo');
    }
}

// Función para cerrar el modal de bajo stock
function cerrarModalBajoStock() {
    const modal = document.getElementById('modal-bajo-stock');
    if (modal) {
        modal.classList.remove('activo');
    }
}

// Función para cargar productos con bajo stock en el modal
async function cargarProductosBajoStockModal() {
    try {
        const response = await fetch('/api/productos/stock-bajo', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                productosBajoStock = data.data;
                llenarTablaBajoStock();
            }
        }
    } catch (error) {
        console.error('Error cargando productos con bajo stock:', error);
        customAlert.alert('Error al cargar los productos con bajo stock', 'Error', 'error');
    }
}

// Función para llenar la tabla de bajo stock
function llenarTablaBajoStock() {
    const contenidoTabla = document.getElementById('contenido-tabla-bajo-stock');
    
    if (!contenidoTabla) {
        console.error('Elemento contenido-tabla-bajo-stock no encontrado');
        return;
    }

    // Limpiar contenido actual
    contenidoTabla.innerHTML = '';

    if (productosBajoStock.length === 0) {
        contenidoTabla.innerHTML = `
            <div class="fila-bajo-stock">
                <div class="columna-bajo-stock col-codigo" style="grid-column: 1 / -1; text-align: center; color: #94a3b8;">
                    No hay productos con bajo stock
                </div>
            </div>
        `;
        return;
    }

    // Agregar filas de productos
    productosBajoStock.forEach(producto => {
        const estado = producto.stock === 0 ? 'sin-stock' : 'bajo-stock';
        const labelEstado = producto.stock === 0 ? 'Sin Stock' : 'Bajo Stock';
        const badgeClass = producto.stock === 0 ? 'badge-sin-stock' : 'badge-bajo-stock';

        const fila = document.createElement('div');
        fila.className = 'fila-bajo-stock';
        fila.innerHTML = `
            <div class="columna-bajo-stock col-codigo" data-label="Código">${producto.codigo || '--'}</div>
            <div class="columna-bajo-stock col-nombre" data-label="Producto">${producto.nombre || '--'}</div>
            <div class="columna-bajo-stock col-categoria" data-label="Categoría">${producto.categoria || '--'}</div>
            <div class="columna-bajo-stock col-stock" data-label="Stock Actual">${producto.stock || 0}</div>
            <div class="columna-bajo-stock col-minimo" data-label="Stock Mínimo">${producto.stockMinimo || '--'}</div>
            <div class="columna-bajo-stock col-estado" data-label="Estado">
                <span class="badge-estado ${badgeClass}">${labelEstado}</span>
            </div>
        `;
        contenidoTabla.appendChild(fila);
    });
}
