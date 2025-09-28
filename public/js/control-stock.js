// JavaScript para Control de Stock
document.addEventListener('DOMContentLoaded', function() {
    // Variables globales
    let productosData = [];
    let categoriasData = [];
    let paginaActual = 1;
    const productosPorPagina = 10;
    let filtros = {
        busqueda: '',
        categoria: '',
        estado: ''
    };

    // Elementos del DOM
    const elementos = {
        // Estadísticas
        totalProductos: document.getElementById('total-productos-stock'),
        productosConStock: document.getElementById('productos-con-stock'),
        productosStockBajo: document.getElementById('productos-stock-bajo'),
        valorInventario: document.getElementById('valor-total-inventario'),
        
        // Filtros
        buscarProducto: document.getElementById('buscar-producto'),
        filtroCategoria: document.getElementById('filtro-categoria'),
        filtroEstado: document.getElementById('filtro-estado'),
        
        // Botones
        btnRegistrarMovimiento: document.getElementById('btn-registrar-movimiento'),
        btnActualizar: document.getElementById('btn-actualizar'),
        
        // Tabla
        tbodyProductos: document.getElementById('tbody-productos'),
        
        // Paginación
        infoRegistros: document.getElementById('info-registros'),
        btnAnterior: document.getElementById('btn-anterior'),
        btnSiguiente: document.getElementById('btn-siguiente'),
        numerosPagina: document.getElementById('numeros-pagina'),
        
        // Modal
        modal: document.getElementById('modal-movimiento'),
        formMovimiento: document.getElementById('form-movimiento'),
        productoMovimiento: document.getElementById('producto-movimiento'),
        tipoMovimiento: document.getElementById('tipo-movimiento'),
        cantidadMovimiento: document.getElementById('cantidad-movimiento'),
        motivoMovimiento: document.getElementById('motivo-movimiento'),
        observacionesMovimiento: document.getElementById('observaciones-movimiento'),
        btnCerrarModal: document.querySelector('.btn-cerrar-modal'),
        btnCancelarMovimiento: document.getElementById('btn-cancelar-movimiento')
    };

    // Inicializar la página
    inicializar();

    async function inicializar() {
        try {
            // Cargar información del usuario (reutilizar función del menú)
            if (typeof cargarInfoUsuario === 'function') {
                cargarInfoUsuario();
            }
            
            // Cargar datos iniciales
            await Promise.all([
                cargarEstadisticas(),
                cargarCategorias(),
                cargarProductos()
            ]);
            
            // Configurar event listeners
            configurarEventListeners();
            
        } catch (error) {
            console.error('Error inicializando la página:', error);
            mostrarError('Error cargando los datos iniciales');
        }
    }

    // Cargar estadísticas
    async function cargarEstadisticas() {
        try {
            const response = await fetch('/api/productos/estadisticas', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.exito) {
                    actualizarEstadisticas(data.estadisticas);
                }
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    // Actualizar las tarjetas de estadísticas
    function actualizarEstadisticas(stats) {
        elementos.totalProductos.textContent = stats.total_productos || 0;
        elementos.productosConStock.textContent = stats.productos_con_stock || 0;
        elementos.productosStockBajo.textContent = stats.productos_stock_bajo || 0;
        elementos.valorInventario.textContent = formatearMoneda(stats.valor_total_inventario || 0);
    }

    // Cargar categorías para el filtro
    async function cargarCategorias() {
        try {
            const response = await fetch('/api/categorias', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.categorias) {
                    categoriasData = data.categorias;
                    llenarFiltroCategoria();
                }
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        }
    }

    // Llenar el select de categorías
    function llenarFiltroCategoria() {
        elementos.filtroCategoria.innerHTML = '<option value="">Todas las categorías</option>';
        categoriasData.forEach(categoria => {
            const option = document.createElement('option');
            option.value = categoria.nombre_categoria;
            option.textContent = categoria.nombre_categoria;
            elementos.filtroCategoria.appendChild(option);
        });
    }

    // Cargar productos
    async function cargarProductos() {
        try {
            mostrarCargando();
            
            const response = await fetch('/api/productos', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data) {
                    productosData = data.data;
                    llenarSelectProductos();
                    aplicarFiltros();
                }
            } else {
                throw new Error('Error al cargar productos');
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
            mostrarError('Error cargando los productos');
        }
    }

    // Llenar el select de productos en el modal
    function llenarSelectProductos() {
        elementos.productoMovimiento.innerHTML = '<option value="">Seleccionar producto...</option>';
        productosData.forEach(producto => {
            const option = document.createElement('option');
            option.value = producto.id;
            option.textContent = `${producto.codigo} - ${producto.nombre}`;
            elementos.productoMovimiento.appendChild(option);
        });
    }

    // Aplicar filtros y mostrar productos
    function aplicarFiltros() {
        let productosFiltrados = [...productosData];

        // Filtro de búsqueda
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            productosFiltrados = productosFiltrados.filter(producto =>
                producto.nombre.toLowerCase().includes(busqueda) ||
                producto.codigo.toLowerCase().includes(busqueda)
            );
        }

        // Filtro de categoría
        if (filtros.categoria) {
            productosFiltrados = productosFiltrados.filter(producto =>
                producto.categoria === filtros.categoria
            );
        }

        // Filtro de estado
        if (filtros.estado) {
            productosFiltrados = productosFiltrados.filter(producto => {
                switch (filtros.estado) {
                    case 'disponible':
                        return producto.stock > producto.stockMinimo;
                    case 'bajo':
                        return producto.stock > 0 && producto.stock <= producto.stockMinimo;
                    case 'agotado':
                        return producto.stock === 0;
                    default:
                        return true;
                }
            });
        }

        mostrarProductos(productosFiltrados);
        actualizarPaginacion(productosFiltrados.length);
    }

    // Mostrar productos en la tabla
    function mostrarProductos(productos) {
        const inicio = (paginaActual - 1) * productosPorPagina;
        const fin = inicio + productosPorPagina;
        const productosPagina = productos.slice(inicio, fin);

        if (productosPagina.length === 0 && productos.length > 0) {
            paginaActual = 1;
            mostrarProductos(productos);
            return;
        }

        elementos.tbodyProductos.innerHTML = '';

        if (productosPagina.length === 0) {
            elementos.tbodyProductos.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem; color: #6b7280;">
                        No se encontraron productos que coincidan con los filtros
                    </td>
                </tr>
            `;
            return;
        }

        productosPagina.forEach(producto => {
            const fila = crearFilaProducto(producto);
            elementos.tbodyProductos.appendChild(fila);
        });
    }

    // Crear fila de producto para la tabla
    function crearFilaProducto(producto) {
        const fila = document.createElement('tr');
        
        const estado = obtenerEstadoStock(producto.stock, producto.stock_minimo);
        
        fila.innerHTML = `
            <td><code>${producto.codigo}</code></td>
            <td><strong>${producto.nombre}</strong></td>
            <td>${producto.categoria || 'Sin categoría'}</td>
            <td><strong>${producto.stock}</strong></td>
            <td>${producto.stock_minimo}</td>
            <td>
                <span class="estado-stock estado-${estado.clase}">
                    ${estado.texto}
                </span>
            </td>
            <td>${formatearMoneda(producto.precio)}</td>
            <td>
                <button class="btn-tabla entrada" onclick="abrirModalMovimiento(${producto.id}, 'entrada')">
                    + Entrada
                </button>
                <button class="btn-tabla salida" onclick="abrirModalMovimiento(${producto.id}, 'salida')">
                    - Salida
                </button>
            </td>
        `;
        
        return fila;
    }

    // Obtener estado del stock
    function obtenerEstadoStock(stockActual, stockMinimo) {
        if (stockActual === 0) {
            return { clase: 'agotado', texto: 'Sin stock' };
        } else if (stockActual <= stockMinimo) {
            return { clase: 'bajo', texto: 'Stock bajo' };
        } else {
            return { clase: 'disponible', texto: 'Disponible' };
        }
    }

    // Mostrar indicador de carga
    function mostrarCargando() {
        elementos.tbodyProductos.innerHTML = `
            <tr class="fila-cargando">
                <td colspan="8">
                    <div class="indicador-carga">
                        <svg class="spinner" viewBox="0 0 50 50">
                            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke="#007bff" stroke-width="5"></circle>
                        </svg>
                        Cargando productos...
                    </div>
                </td>
            </tr>
        `;
    }

    // Mostrar mensaje de error
    function mostrarError(mensaje) {
        elementos.tbodyProductos.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 2rem; color: #dc2626;">
                    ⚠️ ${mensaje}
                </td>
            </tr>
        `;
    }

    // Actualizar paginación
    function actualizarPaginacion(totalProductos) {
        const totalPaginas = Math.ceil(totalProductos / productosPorPagina);
        
        // Actualizar info de registros
        const inicio = totalProductos === 0 ? 0 : ((paginaActual - 1) * productosPorPagina) + 1;
        const fin = Math.min(paginaActual * productosPorPagina, totalProductos);
        elementos.infoRegistros.textContent = `Mostrando ${inicio} a ${fin} de ${totalProductos} productos`;
        
        // Actualizar botones anterior/siguiente
        elementos.btnAnterior.disabled = paginaActual <= 1;
        elementos.btnSiguiente.disabled = paginaActual >= totalPaginas;
        
        // Actualizar números de página
        actualizarNumerosPagina(totalPaginas);
    }

    // Actualizar números de página
    function actualizarNumerosPagina(totalPaginas) {
        elementos.numerosPagina.innerHTML = '';
        
        const maxPaginas = 5;
        let inicio = Math.max(1, paginaActual - Math.floor(maxPaginas / 2));
        let fin = Math.min(totalPaginas, inicio + maxPaginas - 1);
        
        if (fin - inicio + 1 < maxPaginas) {
            inicio = Math.max(1, fin - maxPaginas + 1);
        }
        
        for (let i = inicio; i <= fin; i++) {
            const boton = document.createElement('button');
            boton.className = `numero-pagina ${i === paginaActual ? 'activa' : ''}`;
            boton.textContent = i;
            boton.onclick = () => cambiarPagina(i);
            elementos.numerosPagina.appendChild(boton);
        }
    }

    // Cambiar página
    function cambiarPagina(nuevaPagina) {
        paginaActual = nuevaPagina;
        aplicarFiltros();
    }

    // Formatear moneda
    function formatearMoneda(valor) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor);
    }

    // Configurar event listeners
    function configurarEventListeners() {
        // Filtros
        elementos.buscarProducto.addEventListener('input', debounce((e) => {
            filtros.busqueda = e.target.value;
            paginaActual = 1;
            aplicarFiltros();
        }, 300));

        elementos.filtroCategoria.addEventListener('change', (e) => {
            filtros.categoria = e.target.value;
            paginaActual = 1;
            aplicarFiltros();
        });

        elementos.filtroEstado.addEventListener('change', (e) => {
            filtros.estado = e.target.value;
            paginaActual = 1;
            aplicarFiltros();
        });

        // Botones
        elementos.btnActualizar.addEventListener('click', () => {
            location.reload();
        });

        elementos.btnRegistrarMovimiento.addEventListener('click', () => {
            abrirModalMovimiento();
        });

        // Paginación
        elementos.btnAnterior.addEventListener('click', () => {
            if (paginaActual > 1) {
                cambiarPagina(paginaActual - 1);
            }
        });

        elementos.btnSiguiente.addEventListener('click', () => {
            cambiarPagina(paginaActual + 1);
        });

        // Modal
        elementos.btnCerrarModal.addEventListener('click', cerrarModal);
        elementos.btnCancelarMovimiento.addEventListener('click', cerrarModal);
        elementos.modal.addEventListener('click', (e) => {
            if (e.target === elementos.modal) {
                // Verificar si hay datos en el formulario
                const cantidad = elementos.inputCantidad.value.trim();
                const motivo = elementos.inputMotivo.value.trim();
                
                if (cantidad !== '' || motivo !== '') {
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

        // Formulario de movimiento
        elementos.formMovimiento.addEventListener('submit', manejarMovimiento);
    }

    // Función debounce para búsqueda
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Abrir modal de movimiento
    window.abrirModalMovimiento = function(productoId = null, tipo = null) {
        if (productoId) {
            elementos.productoMovimiento.value = productoId;
        }
        if (tipo) {
            elementos.tipoMovimiento.value = tipo;
        }
        
        elementos.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    };

    // Cerrar modal
    function cerrarModal() {
        elementos.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        elementos.formMovimiento.reset();
    }

    // Manejar envío de formulario de movimiento
    async function manejarMovimiento(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const datosMovimiento = {
            producto_id: parseInt(formData.get('producto')),
            tipo_movimiento: formData.get('tipo'),
            cantidad: parseInt(formData.get('cantidad')),
            motivo: formData.get('motivo') || null,
            observaciones: formData.get('observaciones') || null
        };
        
        // Validaciones básicas
        if (!datosMovimiento.producto_id || !datosMovimiento.tipo_movimiento || !datosMovimiento.cantidad) {
            mostrarNotificacion('Por favor completa todos los campos obligatorios', 'error');
            return;
        }
        
        if (datosMovimiento.cantidad <= 0) {
            mostrarNotificacion('La cantidad debe ser mayor a 0', 'error');
            return;
        }
        
        try {
            const response = await fetch('/api/movimientos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosMovimiento)
            });
            
            const result = await response.json();
            
            if (result.success) {
                mostrarNotificacion(result.message, 'success');
                cerrarModal();
                
                // Recargar datos para reflejar los cambios
                await cargarProductos();
                await cargarEstadisticas();
                
            } else {
                mostrarNotificacion(result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error procesando movimiento:', error);
            mostrarNotificacion('Error de conexión al procesar el movimiento', 'error');
        }
    }

    // Función para mostrar notificaciones
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Crear elemento de notificación
        const notificacion = document.createElement('div');
        notificacion.className = `notificacion ${tipo}`;
        notificacion.innerHTML = `
            <span>${mensaje}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Agregar estilos dinámicos
        notificacion.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${tipo === 'success' ? '#28a745' : tipo === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Agregar al DOM
        document.body.appendChild(notificacion);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    notificacion.remove();
                }, 300);
            }
        }, 5000);
    }
    
    // Agregar estilos de animación al head si no existen
    if (!document.querySelector('#notificacion-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notificacion-styles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notificacion button {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .notificacion button:hover {
                opacity: 0.7;
            }
        `;
        document.head.appendChild(styles);
    }
});
