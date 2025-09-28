// Variables globales
let productos = [];
let productoEditando = null;
let paginaActual = 1;
const productosPorPagina = 10;

// URLs de la API
const API_BASE = '/api/productos';

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    cargarCategorias();
    cargarProductos();
    configurarEventos();
});

// Configurar eventos
function configurarEventos() {
    // Búsqueda
    document.getElementById('buscar-producto').addEventListener('input', filtrarProductos);
    
    // Filtros
    document.getElementById('filtro-categoria').addEventListener('change', filtrarProductos);
    document.getElementById('filtro-estado').addEventListener('change', filtrarProductos);
    
    // Formulario
    document.getElementById('form-producto').addEventListener('submit', guardarProducto);
    
    // Cálculo automático del margen de ganancia
    document.getElementById('precio-venta').addEventListener('input', calcularMargen);
    document.getElementById('precio-compra').addEventListener('input', calcularMargen);
    
    // Paginación
    document.getElementById('btn-anterior').addEventListener('click', paginaAnterior);
    document.getElementById('btn-siguiente').addEventListener('click', paginaSiguiente);
    
    // Cerrar modal al hacer clic fuera (con confirmación)
    document.getElementById('modal-producto').addEventListener('click', function(e) {
        if (e.target === this) {
            // Verificar si hay datos en el formulario
            const form = document.getElementById('form-producto');
            const formData = new FormData(form);
            let hasData = false;
            
            for (let value of formData.values()) {
                if (value.trim() !== '') {
                    hasData = true;
                    break;
                }
            }
            
            if (hasData) {
                customAlert.confirm(
                    'Se perderán todos los datos que has ingresado en el formulario.',
                    '¿Cerrar sin guardar?'
                ).then((confirmed) => {
                    if (confirmed) {
                        cerrarModal();
                    }
                });
            } else {
                cerrarModal();
            }
        }
    });
}

// Cargar categorías desde la API
async function cargarCategorias() {
    try {
        const response = await fetch('/api/categorias');
        const data = await response.json();
        
        if (data.success) {
            const categorias = data.categorias;
            
            // Cargar en el select de filtros
            const filtroSelect = document.getElementById('filtro-categoria');
            filtroSelect.innerHTML = '<option value="">Todas las categorías</option>';
            
            // Cargar en el select del formulario
            const categoriaSelect = document.getElementById('categoria');
            categoriaSelect.innerHTML = '<option value="">Seleccionar categoría</option>';
            
            categorias.forEach(categoria => {
                // Agregar al filtro
                const optionFiltro = document.createElement('option');
                optionFiltro.value = categoria.id;
                optionFiltro.textContent = categoria.nombre_categoria;
                filtroSelect.appendChild(optionFiltro);
                
                // Agregar al formulario
                const optionFormulario = document.createElement('option');
                optionFormulario.value = categoria.id;
                optionFormulario.textContent = categoria.nombre_categoria;
                categoriaSelect.appendChild(optionFormulario);
            });
        }
    } catch (error) {
        console.error('Error cargando categorías:', error);
        mostrarMensaje('Error al cargar las categorías', 'error');
    }
}

// Cargar productos desde la API
async function cargarProductos() {
    try {
        const busqueda = document.getElementById('buscar-producto').value;
        const categoria = document.getElementById('filtro-categoria').value;
        const estado = document.getElementById('filtro-estado').value;
        
        const params = new URLSearchParams({
            pagina: paginaActual,
            limite: productosPorPagina
        });
        
        if (busqueda) params.append('busqueda', busqueda);
        if (categoria) params.append('categoria', categoria);
        if (estado) params.append('estado', estado);
        
        const response = await fetch(`${API_BASE}?${params}`);
        const data = await response.json();
        
        if (data.success) {
            productos = data.data;
            mostrarProductos(productos);
            actualizarPaginacion(data.pagination);
        } else {
            console.error('Error cargando productos:', data.message);
            mostrarNotificacion('Error cargando productos', 'error');
        }
        
    } catch (error) {
        console.error('Error en la petición:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

// Mostrar productos en la tabla
function mostrarProductos(productos) {
    const tbody = document.getElementById('tabla-productos-body');
    tbody.innerHTML = '';
    
    productos.forEach(producto => {
        const fila = crearFilaProducto(producto);
        tbody.appendChild(fila);
    });
    
    if (productos.length === 0) {
        const filaVacia = document.createElement('tr');
        filaVacia.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 40px; color: #7f8c8d;">
                No se encontraron productos
            </td>
        `;
        tbody.appendChild(filaVacia);
    }
}

function crearFilaProducto(producto) {
    const fila = document.createElement('tr');
    
    // Determinar el estado visual
    let estadoClass = 'activo';
    let estadoTexto = 'Activo';
    
    if (producto.estado === 'inactivo') {
        estadoClass = 'inactivo';
        estadoTexto = 'Inactivo';
    } else if (producto.estado === 'bajo-stock') {
        estadoClass = 'bajo-stock';
        estadoTexto = 'Bajo Stock';
    }
    
    fila.innerHTML = `
        <td>${producto.codigo}</td>
        <td>
            <div class="producto-info">
                <div class="nombre">${producto.nombre}</div>
                ${producto.dimensiones ? `<small class="dimensiones">📏 ${producto.dimensiones}</small>` : ''}
                ${producto.peso ? `<small class="peso">⚖️ ${producto.peso}kg</small>` : ''}
            </div>
        </td>
        <td>${capitalizarTexto(producto.categoria)}</td>
        <td class="precio-venta">$${producto.precio.toFixed(2)}</td>
        <td class="precio-compra">$${producto.precioCompra ? producto.precioCompra.toFixed(2) : 'N/A'}</td>
        <td>
            <div class="stock-info">
                <span class="stock-actual">${producto.stock}</span>
                <small class="stock-minimo">Min: ${producto.stockMinimo}</small>
            </div>
        </td>
        <td class="ubicacion">${producto.ubicacion || 'Sin asignar'}</td>
        <td><span class="estado ${estadoClass}">${estadoTexto}</span></td>
        <td>
            <div class="acciones">
                <button class="btn-accion editar" onclick="editarProducto(${producto.id})" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                    </svg>
                </button>
                <button class="btn-accion eliminar" onclick="eliminarProducto(${producto.id})" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </td>
    `;
    
    return fila;
}

// Funciones del modal
function abrirModal() {
    productoEditando = null;
    document.getElementById('modal-titulo').textContent = 'Nuevo Producto';
    document.getElementById('form-producto').reset();
    document.getElementById('modal-producto').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function cerrarModal() {
    document.getElementById('modal-producto').style.display = 'none';
    document.body.style.overflow = 'auto';
    productoEditando = null;
}

async function editarProducto(id) {
    try {
        const response = await fetch(`${API_BASE}/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const producto = data.data;
            productoEditando = producto;
            document.getElementById('modal-titulo').textContent = 'Editar Producto';
            
            // Llenar el formulario
            document.getElementById('codigo').value = producto.codigo;
            document.getElementById('nombre').value = producto.nombre;
            document.getElementById('categoria').value = producto.categoria_id || '';
            document.getElementById('precio-venta').value = producto.precio;
            document.getElementById('precio-compra').value = producto.precioCompra || '';
            document.getElementById('stock').value = producto.stock;
            document.getElementById('stock-minimo').value = producto.stockMinimo;
            document.getElementById('ubicacion-bodega').value = producto.ubicacion || '';
            document.getElementById('peso').value = producto.peso || '';
            document.getElementById('dimensiones').value = producto.dimensiones || '';
            document.getElementById('descripcion').value = producto.descripcion || '';
            
            // Calcular margen
            calcularMargen();
            
            document.getElementById('modal-producto').style.display = 'block';
            document.body.style.overflow = 'hidden';
        } else {
            mostrarNotificacion('Error cargando producto', 'error');
        }
    } catch (error) {
        console.error('Error cargando producto:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

async function guardarProducto(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const datosProducto = {
        codigo: formData.get('codigo').trim(),
        nombre: formData.get('nombre').trim(),
        categoria: formData.get('categoria'),
        precioVenta: parseFloat(formData.get('precio_venta')),
        precioCompra: parseFloat(formData.get('precio_compra')),
        stock: parseInt(formData.get('stock')),
        stockMinimo: parseInt(formData.get('stock_minimo')) || 5,
        ubicacionBodega: formData.get('ubicacion_bodega')?.trim() || null,
        peso: formData.get('peso') ? parseFloat(formData.get('peso')) : null,
        dimensiones: formData.get('dimensiones')?.trim() || null,
        descripcion: formData.get('descripcion')?.trim() || null
    };
    
    try {
        let response;
        
        if (productoEditando) {
            // Actualizar producto existente
            response = await fetch(`${API_BASE}/${productoEditando.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosProducto)
            });
        } else {
            // Crear nuevo producto
            response = await fetch(API_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosProducto)
            });
        }
        
        const data = await response.json();
        
        if (data.success) {
            mostrarNotificacion(data.message, 'success');
            cargarProductos();
            cerrarModal();
        } else {
            mostrarNotificacion(data.message, 'error');
        }
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        mostrarNotificacion('Error de conexión', 'error');
    }
}

async function eliminarProducto(id) {
    const producto = productos.find(p => p.id === id);
    if (!producto) return;
    
    const confirmed = await customAlert.confirm(
        `Esta acción eliminará permanentemente el producto "${producto.nombre}" y no se puede deshacer.`,
        '¿Eliminar producto?',
        'error'
    );
    
    if (confirmed) {
        try {
            const response = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarNotificacion(data.message, 'success');
                cargarProductos();
            } else {
                mostrarNotificacion(data.message, 'error');
            }
            
        } catch (error) {
            console.error('Error eliminando producto:', error);
            mostrarNotificacion('Error de conexión', 'error');
        }
    }
}

// Funciones de filtrado y paginación
function filtrarProductos() {
    paginaActual = 1;
    cargarProductos();
}

function actualizarPaginacion(paginacion) {
    document.querySelector('.info-paginacion').textContent = 
        `Página ${paginacion.paginaActual} de ${paginacion.totalPaginas}`;
    
    document.getElementById('btn-anterior').disabled = paginacion.paginaActual <= 1;
    document.getElementById('btn-siguiente').disabled = paginacion.paginaActual >= paginacion.totalPaginas;
}

function paginaAnterior() {
    if (paginaActual > 1) {
        paginaActual--;
        cargarProductos();
    }
}

function paginaSiguiente() {
    paginaActual++;
    cargarProductos();
}

// Funciones utilitarias
function capitalizarTexto(texto) {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Función eliminada - ahora usamos IDs de categorías directamente

// Función para calcular el margen de ganancia automáticamente
function calcularMargen() {
    const precioVenta = parseFloat(document.getElementById('precio-venta').value) || 0;
    const precioCompra = parseFloat(document.getElementById('precio-compra').value) || 0;
    
    if (precioVenta > 0 && precioCompra > 0) {
        const margen = ((precioVenta - precioCompra) / precioCompra) * 100;
        document.getElementById('margen').value = margen.toFixed(2);
        
        // Cambiar color del campo según el margen
        const campoMargen = document.getElementById('margen');
        if (margen < 20) {
            campoMargen.style.color = '#e74c3c'; // Rojo para margen bajo
        } else if (margen < 50) {
            campoMargen.style.color = '#f39c12'; // Naranja para margen medio
        } else {
            campoMargen.style.color = '#27ae60'; // Verde para margen alto
        }
    } else {
        document.getElementById('margen').value = '';
        document.getElementById('margen').style.color = '';
    }
}

function mostrarNotificacion(mensaje, tipo) {
    // Crear elemento de notificación
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `
        <span>${mensaje}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Agregar estilos si no existen
    if (!document.getElementById('estilos-notificacion')) {
        const estilos = document.createElement('style');
        estilos.id = 'estilos-notificacion';
        estilos.textContent = `
            .notificacion {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 300px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                animation: slideIn 0.3s ease;
            }
            
            .notificacion.success {
                background: linear-gradient(135deg, #27ae60, #2ecc71);
            }
            
            .notificacion.error {
                background: linear-gradient(135deg, #e74c3c, #c0392b);
            }
            
            .notificacion button {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                margin-left: auto;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(estilos);
    }
    
    document.body.appendChild(notificacion);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentElement) {
            notificacion.remove();
        }
    }, 5000);
}

// Atajos de teclado
document.addEventListener('keydown', function(e) {
    // Escape para cerrar modal
    if (e.key === 'Escape') {
        cerrarModal();
    }
    
    // Ctrl+N para nuevo producto
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        abrirModal();
    }
});
