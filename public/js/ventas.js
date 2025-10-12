// ===== SISTEMA DE VENTAS - FERRETERÍA J&L =====

class SistemaVentas {
    constructor() {
        this.carrito = [];
        this.productos = [];
        this.clienteActual = {};
        this.numeroFactura = this.generarNumeroFactura();
        this.init();
    }

    init() {
        this.configurarEventListeners();
        this.configurarFormularioCliente();
        this.configurarBuscadorProductos();
        this.configurarCarrito();
        this.configurarPagos();
        this.configurarModal();
        this.configurarModalNuevoCliente();
        this.configurarModalHistorial();
        this.actualizarTotales();
    }

    configurarEventListeners() {
        // Botones principales
        document.getElementById('btn-nueva-venta').addEventListener('click', () => this.nuevaVenta());
        document.getElementById('btn-historial').addEventListener('click', () => this.mostrarHistorial());
        
        // Búsqueda de productos
        document.getElementById('buscar-producto').addEventListener('input', (e) => this.buscarProductos(e.target.value));
        document.getElementById('btn-buscar').addEventListener('click', () => this.buscarProductos());
        
        // Procesar venta
        document.getElementById('btn-procesar').addEventListener('click', () => this.procesarVenta());
        document.getElementById('btn-cancelar').addEventListener('click', () => this.cancelarVenta());
        
        // Método de pago
        document.querySelectorAll('input[name="metodo-pago"]').forEach(radio => {
            radio.addEventListener('change', () => this.cambiarMetodoPago());
        });
        
        // Monto recibido
        document.getElementById('monto-recibido').addEventListener('input', () => this.calcularCambio());
        
        // Modal
        document.getElementById('btn-imprimir').addEventListener('click', () => this.imprimirFactura());
        document.getElementById('btn-nueva-venta-modal').addEventListener('click', () => this.nuevaVentaDesdeModal());
        document.getElementById('btn-cerrar-modal').addEventListener('click', () => this.cerrarModal());
        
        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('modal-factura').style.display === 'block') {
                this.cerrarModal();
            }
        });
    }

    configurarFormularioCliente() {
        const tipoCliente = document.getElementById('tipo-cliente');
        const documento = document.getElementById('documento-cliente');
        const nombre = document.getElementById('nombre-cliente');
        const telefono = document.getElementById('telefono-cliente');
        const buscadorCliente = document.getElementById('buscar-cliente');
        const resultadosClientes = document.getElementById('resultados-clientes');
        const grupoBuscador = document.getElementById('grupo-buscador');
        const btnNuevoCliente = document.getElementById('btn-nuevo-cliente');
        const btnLimpiarCliente = document.getElementById('btn-limpiar-cliente');
        
        // Cambio de tipo de cliente
        tipoCliente.addEventListener('change', () => {
            this.cambiarTipoCliente();
        });
        
        // Búsqueda de clientes registrados
        if (buscadorCliente) {
            buscadorCliente.addEventListener('input', (e) => {
                this.buscarClientesRegistrados(e.target.value);
            });
            
            // Ocultar resultados al hacer clic fuera
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.buscador-cliente-container')) {
                    resultadosClientes.style.display = 'none';
                }
            });
        }
        
        // Botón nuevo cliente
        if (btnNuevoCliente) {
            btnNuevoCliente.addEventListener('click', () => {
                this.abrirModalNuevoCliente();
            });
        }
        
        // Botón limpiar cliente
        if (btnLimpiarCliente) {
            btnLimpiarCliente.addEventListener('click', () => {
                this.limpiarClienteSeleccionado();
            });
        }
        
        // Configuración inicial
        this.cambiarTipoCliente();
    }

    configurarBuscadorProductos() {
        const buscador = document.getElementById('buscar-producto');
        const resultados = document.getElementById('resultados-busqueda');
        
        buscador.addEventListener('focus', () => {
            if (this.productos.length > 0) {
                resultados.style.display = 'block';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.buscador-producto') && !e.target.closest('.resultados-busqueda')) {
                resultados.style.display = 'none';
            }
        });
    }

    configurarCarrito() {
        // Los event listeners se agregarán dinámicamente cuando se agreguen productos
    }

    configurarPagos() {
        // Ya configurado en configurarEventListeners
        this.cambiarMetodoPago(); // Configurar estado inicial
    }

    configurarModal() {
        const modal = document.getElementById('modal-factura');
        
        // Cerrar modal al hacer click fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.cerrarModal();
            }
        });
    }

    async buscarProductos(termino = '') {
        const buscador = document.getElementById('buscar-producto');
        const resultados = document.getElementById('resultados-busqueda');
        
        if (!termino) {
            termino = buscador.value.trim();
        }
        
        if (termino.length < 2) {
            resultados.style.display = 'none';
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/ventas/productos/buscar?q=${encodeURIComponent(termino)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Error al buscar productos');
            }
            
            const productos = await response.json();
            this.mostrarResultadosBusqueda(productos);
            
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al buscar productos', 'error');
        }
    }

    mostrarResultadosBusqueda(productos) {
        const resultados = document.getElementById('resultados-busqueda');
        
        if (productos.length === 0) {
            resultados.innerHTML = '<div class="resultado-item">No se encontraron productos</div>';
            resultados.style.display = 'block';
            return;
        }
        
        resultados.innerHTML = productos.map(producto => `
            <div class="resultado-item ${producto.stock <= 0 ? 'producto-sin-stock' : ''}" 
                 data-producto='${JSON.stringify(producto)}'>
                <div class="producto-info">
                    <div class="producto-nombre">${producto.nombre}</div>
                    <div class="producto-codigo">Código: ${producto.codigo}</div>
                    <div class="producto-stock">Stock: ${producto.stock} ${producto.unidad_medida}</div>
                </div>
                <div class="producto-precio">$${this.formatearPrecio(producto.precio)}</div>
            </div>
        `).join('');
        
        resultados.style.display = 'block';
        
        // Agregar event listeners a los resultados
        resultados.querySelectorAll('.resultado-item').forEach(item => {
            if (!item.classList.contains('producto-sin-stock')) {
                item.addEventListener('click', () => {
                    const producto = JSON.parse(item.dataset.producto);
                    this.agregarAlCarrito(producto);
                });
            }
        });
    }

    agregarAlCarrito(producto, cantidad = 1) {
        // Verificar si el producto ya está en el carrito
        const productoExistente = this.carrito.find(item => item.id === producto.id);
        
        if (productoExistente) {
            const nuevaCantidad = productoExistente.cantidad + cantidad;
            
            if (nuevaCantidad > producto.stock) {
                mostrarAlerta(`Stock insuficiente. Disponible: ${producto.stock} ${producto.unidad_medida}`, 'warning');
                return;
            }
            
            productoExistente.cantidad = nuevaCantidad;
            productoExistente.subtotal = productoExistente.cantidad * productoExistente.precio;
        } else {
            if (cantidad > producto.stock) {
                mostrarAlerta(`Stock insuficiente. Disponible: ${producto.stock} ${producto.unidad_medida}`, 'warning');
                return;
            }
            
            this.carrito.push({
                id: producto.id,
                codigo: producto.codigo,
                nombre: producto.nombre,
                precio: producto.precio,
                cantidad: cantidad,
                stock: producto.stock,
                unidad_medida: producto.unidad_medida,
                subtotal: cantidad * producto.precio
            });
        }
        
        this.actualizarCarrito();
        this.actualizarTotales();
        
        // Limpiar búsqueda
        document.getElementById('buscar-producto').value = '';
        document.getElementById('resultados-busqueda').style.display = 'none';
        
        mostrarAlerta('Producto agregado al carrito', 'success');
    }

    actualizarCarrito() {
        const carritoBody = document.getElementById('carrito-body');
        
        if (this.carrito.length === 0) {
            carritoBody.innerHTML = `
                <tr class="carrito-vacio">
                    <td colspan="6">No hay productos en el carrito</td>
                </tr>
            `;
            return;
        }
        
        carritoBody.innerHTML = this.carrito.map(item => `
            <tr data-id="${item.id}">
                <td>${item.codigo}</td>
                <td>${item.nombre}</td>
                <td>$${this.formatearPrecio(item.precio)}</td>
                <td>
                    <input type="number" class="cantidad-input" 
                           value="${item.cantidad}" 
                           min="1" 
                           max="${item.stock}"
                           data-id="${item.id}">
                </td>
                <td>$${this.formatearPrecio(item.subtotal)}</td>
                <td>
                    <button class="btn-eliminar" data-id="${item.id}">Eliminar</button>
                </td>
            </tr>
        `).join('');
        
        // Agregar event listeners
        carritoBody.querySelectorAll('.cantidad-input').forEach(input => {
            input.addEventListener('change', (e) => {
                this.cambiarCantidad(parseInt(e.target.dataset.id), parseInt(e.target.value));
            });
        });
        
        carritoBody.querySelectorAll('.btn-eliminar').forEach(button => {
            button.addEventListener('click', (e) => {
                this.eliminarDelCarrito(parseInt(e.target.dataset.id));
            });
        });
    }

    cambiarCantidad(productoId, nuevaCantidad) {
        const item = this.carrito.find(item => item.id === productoId);
        
        if (!item) return;
        
        if (nuevaCantidad <= 0) {
            this.eliminarDelCarrito(productoId);
            return;
        }
        
        if (nuevaCantidad > item.stock) {
            mostrarAlerta(`Stock insuficiente. Disponible: ${item.stock} ${item.unidad_medida}`, 'warning');
            // Restaurar valor anterior
            document.querySelector(`input[data-id="${productoId}"]`).value = item.cantidad;
            return;
        }
        
        item.cantidad = nuevaCantidad;
        item.subtotal = item.cantidad * item.precio;
        
        this.actualizarCarrito();
        this.actualizarTotales();
    }

    eliminarDelCarrito(productoId) {
        this.carrito = this.carrito.filter(item => item.id !== productoId);
        this.actualizarCarrito();
        this.actualizarTotales();
        mostrarAlerta('Producto eliminado del carrito', 'info');
    }

    actualizarTotales() {
        const subtotal = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = subtotal * 0.19; // 19% de IVA
        const total = subtotal + iva;
        
        document.getElementById('subtotal').textContent = `$${this.formatearPrecio(subtotal)}`;
        document.getElementById('iva').textContent = `$${this.formatearPrecio(iva)}`;
        document.getElementById('total').textContent = `$${this.formatearPrecio(total)}`;
        
        // Actualizar cambio si es pago en efectivo
        this.calcularCambio();
    }

    cambiarMetodoPago() {
        const metodoPago = document.querySelector('input[name="metodo-pago"]:checked').value;
        const pagoEfectivo = document.getElementById('pago-efectivo');
        
        if (metodoPago === 'efectivo') {
            pagoEfectivo.style.display = 'grid';
        } else {
            pagoEfectivo.style.display = 'none';
            document.getElementById('monto-recibido').value = '';
            document.getElementById('cambio').value = '';
        }
    }

    calcularCambio() {
        const metodoPago = document.querySelector('input[name="metodo-pago"]:checked').value;
        
        if (metodoPago !== 'efectivo') return;
        
        const montoRecibido = parseFloat(document.getElementById('monto-recibido').value) || 0;
        const subtotal = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = subtotal * 0.19;
        const total = subtotal + iva;
        const cambio = montoRecibido - total;
        
        console.log('💰 Calculando cambio:', {
            montoRecibido,
            subtotal,
            iva,
            total,
            cambio
        });
        
        document.getElementById('cambio').value = cambio >= 0 ? `$${this.formatearPrecio(cambio)}` : 'Saldo insuficiente';
    }

    async buscarCliente(documento) {
        if (!documento || documento.length < 5) return;
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/ventas/clientes/buscar/${documento}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const cliente = await response.json();
                document.getElementById('nombre-cliente').value = cliente.nombre;
                document.getElementById('telefono-cliente').value = cliente.telefono || '';
            }
        } catch (error) {
            console.error('Error al buscar cliente:', error);
        }
    }

    validarVenta() {
        // Validar carrito no vacío
        if (this.carrito.length === 0) {
            mostrarAlerta('Debe agregar al menos un producto al carrito', 'warning');
            return false;
        }
        
        // Validar información del cliente
        const tipoCliente = document.getElementById('tipo-cliente').value;
        const documento = document.getElementById('documento-cliente').value.trim();
        const nombre = document.getElementById('nombre-cliente').value.trim();
        
        if (tipoCliente === 'registrado' && (!documento || !nombre)) {
            mostrarAlerta('Debe completar los datos del cliente', 'warning');
            return false;
        }
        
        // Validar método de pago
        const metodoPago = document.querySelector('input[name="metodo-pago"]:checked').value;
        
        if (metodoPago === 'efectivo') {
            const montoRecibido = parseFloat(document.getElementById('monto-recibido').value) || 0;
            const total = this.carrito.reduce((sum, item) => sum + item.subtotal, 0) * 1.19;
            
            if (montoRecibido < total) {
                mostrarAlerta('El monto recibido es insuficiente', 'warning');
                return false;
            }
        }
        
        return true;
    }

    async procesarVenta() {
        console.log('🚀 Iniciando procesamiento de venta...');
        if (!this.validarVenta()) {
            console.log('❌ Validación de venta falló');
            return;
        }
        
        // Obtener referencia al botón y guardar texto original
        const btnProcesar = document.getElementById('btn-procesar');
        const textoOriginal = btnProcesar.textContent;
        
        try {
            // Mostrar estado de carga
            console.log('⏳ Cambiando estado del botón a "Procesando..."');
            btnProcesar.textContent = 'Procesando...';
            btnProcesar.disabled = true;
            
            // Preparar datos de la venta con números correctamente formateados
            const subtotalCalculado = this.carrito.reduce((sum, item) => sum + item.subtotal, 0);
            const ivaCalculado = subtotalCalculado * 0.19;
            const totalCalculado = subtotalCalculado + ivaCalculado;
            
            const ventaData = {
                cliente: {
                    tipo: document.getElementById('tipo-cliente').value,
                    documento: document.getElementById('documento-cliente').value.trim(),
                    nombre: document.getElementById('nombre-cliente').value.trim(),
                    telefono: document.getElementById('telefono-cliente').value.trim()
                },
                productos: this.carrito.map(item => ({
                    id: item.id,
                    nombre: item.nombre, // Agregar nombre para debug
                    cantidad: parseInt(item.cantidad),
                    precio: parseFloat(item.precio)
                })),
                tipo_pago: document.querySelector('input[name="metodo-pago"]:checked').value,
                montoRecibido: parseFloat(document.getElementById('monto-recibido').value) || null,
                subtotal: Math.round(subtotalCalculado * 100) / 100, // Redondear a 2 decimales
                iva: Math.round(ivaCalculado * 100) / 100,
                total: Math.round(totalCalculado * 100) / 100
            };
            
            console.log('📊 Datos de venta calculados:', {
                subtotal: ventaData.subtotal,
                iva: ventaData.iva,
                total: ventaData.total,
                montoRecibido: ventaData.montoRecibido
            });
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ventas', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ventaData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al procesar la venta');
            }
            
            const resultado = await response.json();
            console.log('✅ Respuesta del servidor:', resultado);
            
            // Guardar información de la venta para la factura
            this.clienteActual = ventaData.cliente;
            this.ventaActual = {
                ...ventaData,
                numero: resultado.numeroVenta,
                fecha: new Date().toLocaleDateString(),
                hora: new Date().toLocaleTimeString()
            };
            
            // Mostrar factura
            this.mostrarFactura();
            
            mostrarAlerta('Venta procesada exitosamente', 'success');
            
        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta(error.message || 'Error al procesar la venta', 'error');
        } finally {
            // Restaurar botón
            console.log('🔄 Restaurando botón:', textoOriginal);
            btnProcesar.textContent = textoOriginal;
            btnProcesar.disabled = false;
        }
    }

    mostrarFactura() {
        // Llenar información de la factura
        document.getElementById('numero-factura').textContent = this.ventaActual.numero || this.numeroFactura;
        document.getElementById('fecha-factura').textContent = this.ventaActual.fecha;
        document.getElementById('hora-factura').textContent = this.ventaActual.hora;
        
        // Información del cliente
        document.getElementById('factura-documento').textContent = this.clienteActual.documento || 'N/A';
        document.getElementById('factura-nombre').textContent = this.clienteActual.nombre;
        document.getElementById('factura-telefono').textContent = this.clienteActual.telefono || 'N/A';
        
        // Productos
        const productosFactura = document.getElementById('factura-productos');
        productosFactura.innerHTML = this.carrito.map(item => `
            <tr>
                <td>${item.codigo}</td>
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>$${this.formatearPrecio(item.precio)}</td>
                <td>$${this.formatearPrecio(item.subtotal)}</td>
            </tr>
        `).join('');
        
        // Totales
        document.getElementById('factura-subtotal').textContent = `$${this.formatearPrecio(this.ventaActual.subtotal)}`;
        document.getElementById('factura-iva').textContent = `$${this.formatearPrecio(this.ventaActual.iva)}`;
        document.getElementById('factura-total').textContent = `$${this.formatearPrecio(this.ventaActual.total)}`;
        
        // Información de pago
        const metodoPago = this.ventaActual.tipo_pago || this.ventaActual.metodoPago || 'efectivo';
        let textoMetodo = metodoPago.charAt(0).toUpperCase() + metodoPago.slice(1);
        document.getElementById('factura-metodo-pago').textContent = textoMetodo;
        
        const infoEfectivo = document.getElementById('info-efectivo');
        if (metodoPago === 'efectivo') {
            document.getElementById('factura-recibido').textContent = `$${this.formatearPrecio(this.ventaActual.montoRecibido)}`;
            document.getElementById('factura-cambio').textContent = `$${this.formatearPrecio(this.ventaActual.montoRecibido - this.ventaActual.total)}`;
            infoEfectivo.style.display = 'block';
        } else {
            infoEfectivo.style.display = 'none';
        }
        
        // Mostrar modal
        document.getElementById('modal-factura').style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    imprimirFactura() {
        // Ocultar botones para la impresión
        const acciones = document.querySelector('.acciones-factura');
        acciones.style.display = 'none';
        
        window.print();
        
        // Restaurar botones después de imprimir
        setTimeout(() => {
            acciones.style.display = 'flex';
        }, 1000);
    }

    cerrarModal() {
        document.getElementById('modal-factura').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    nuevaVentaDesdeModal() {
        this.cerrarModal();
        this.nuevaVenta();
    }

    nuevaVenta() {
        // Limpiar carrito
        this.carrito = [];
        this.clienteActual = {};
        
        // Resetear formulario
        document.getElementById('tipo-cliente').value = 'consumidor_final';
        document.getElementById('documento-cliente').value = '';
        document.getElementById('nombre-cliente').value = 'Consumidor Final';
        document.getElementById('telefono-cliente').value = '';
        document.getElementById('documento-cliente').disabled = true;
        document.getElementById('nombre-cliente').disabled = true;
        
        // Resetear búsqueda
        document.getElementById('buscar-producto').value = '';
        document.getElementById('resultados-busqueda').style.display = 'none';
        
        // Resetear método de pago
        document.querySelector('input[name="metodo-pago"][value="efectivo"]').checked = true;
        document.getElementById('monto-recibido').value = '';
        document.getElementById('cambio').value = '';
        this.cambiarMetodoPago();
        
        // Actualizar vista
        this.actualizarCarrito();
        this.actualizarTotales();
        
        // Generar nuevo número de factura
        this.numeroFactura = this.generarNumeroFactura();
        
        mostrarAlerta('Nueva venta iniciada', 'info');
    }

    cancelarVenta() {
        if (this.carrito.length > 0) {
            mostrarConfirmacion(
                '¿Está seguro de cancelar esta venta?',
                'Se perderán todos los productos agregados al carrito',
                () => {
                    this.nuevaVenta();
                }
            );
        } else {
            mostrarAlerta('No hay ninguna venta en proceso', 'info');
        }
    }

    mostrarHistorial() {
        const modal = document.getElementById('modal-historial');
        
        // Configurar fechas por defecto (últimos 30 días)
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);
        
        document.getElementById('filtro-fecha-desde').value = hace30Dias.toISOString().split('T')[0];
        document.getElementById('filtro-fecha-hasta').value = hoy.toISOString().split('T')[0];
        
        // Mostrar modal
        modal.classList.add('active');
        
        // Configurar event listeners
        this.configurarModalHistorial();
        
        // Cargar datos iniciales
        this.cargarHistorialVentas();
    }

    configurarModalHistorial() {
        const modal = document.getElementById('modal-historial');
        const btnCerrar = document.getElementById('btn-cerrar-modal-historial');
        const btnFiltrar = document.getElementById('btn-filtrar-historial');
        
        // Solo configurar una vez
        if (modal && modal.dataset.configured) return;
        if (modal) modal.dataset.configured = 'true';
        
        // Cerrar modal
        const cerrarModal = () => {
            modal.classList.remove('active');
        };
        
        // Event listeners
        if (btnCerrar && !btnCerrar.dataset.configured) {
            btnCerrar.dataset.configured = 'true';
            btnCerrar.addEventListener('click', cerrarModal);
        }
        
        if (btnFiltrar && !btnFiltrar.dataset.configured) {
            btnFiltrar.dataset.configured = 'true';
            btnFiltrar.addEventListener('click', () => {
                this.cargarHistorialVentas();
            });
        }
        
        // Cerrar al hacer clic fuera del modal
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cerrarModal();
                }
            });
        }
    }

    async cargarHistorialVentas() {
        const historialBody = document.getElementById('historial-body');
        const fechaDesde = document.getElementById('filtro-fecha-desde').value;
        const fechaHasta = document.getElementById('filtro-fecha-hasta').value;
        
        try {
            // Mostrar estado de carga
            historialBody.innerHTML = `
                <tr>
                    <td colspan="6" class="cargando">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="m12 1 0 6"></path>
                            <path d="m12 17 0 6"></path>
                        </svg>
                        Cargando historial...
                    </td>
                </tr>
            `;
            
            console.log('📊 Cargando historial de ventas...');
            
            // Construir URL con filtros
            let url = '/api/ventas?limit=50';
            if (fechaDesde) url += `&fecha_desde=${fechaDesde}`;
            if (fechaHasta) url += `&fecha_hasta=${fechaHasta}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success && data.ventas) {
                this.mostrarHistorialEnTabla(data.ventas);
            } else {
                throw new Error(data.message || 'Error al cargar historial');
            }
            
        } catch (error) {
            console.error('Error cargando historial:', error);
            historialBody.innerHTML = `
                <tr>
                    <td colspan="6" class="cargando" style="color: #dc3545;">
                        Error al cargar el historial: ${error.message}
                    </td>
                </tr>
            `;
        }
    }

    mostrarHistorialEnTabla(ventas) {
        const historialBody = document.getElementById('historial-body');
        
        if (ventas.length === 0) {
            historialBody.innerHTML = `
                <tr>
                    <td colspan="6" class="cargando">No se encontraron ventas en el período seleccionado</td>
                </tr>
            `;
            return;
        }
        
        historialBody.innerHTML = ventas.map(venta => `
            <tr>
                <td>${new Date(venta.fecha_venta).toLocaleDateString('es-CO')}</td>
                <td>${venta.numero_factura || venta.numero_venta}</td>
                <td>${venta.cliente_nombre || 'Consumidor Final'}</td>
                <td>$${this.formatearPrecio(venta.total)}</td>
                <td>
                    <span class="estado-${venta.estado || 'completada'}">
                        ${venta.estado ? venta.estado.charAt(0).toUpperCase() + venta.estado.slice(1) : 'Completada'}
                    </span>
                </td>
                <td>
                    <button class="btn-ver-detalle" data-venta-id="${venta.id}" title="Ver detalle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
                    <button class="btn-reimprimir" data-venta-id="${venta.id}" title="Reimprimir">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6,9 6,2 18,2 18,9"></polyline>
                            <path d="m6 18 4 4 4-4"></path>
                            <rect x="2" y="9" width="20" height="9"></rect>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Agregar event listeners a los botones de acción
        historialBody.querySelectorAll('.btn-ver-detalle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ventaId = e.currentTarget.dataset.ventaId;
                this.verDetalleVenta(ventaId);
            });
        });
        
        historialBody.querySelectorAll('.btn-reimprimir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ventaId = e.currentTarget.dataset.ventaId;
                this.reimprimirVenta(ventaId);
            });
        });
    }

    async verDetalleVenta(ventaId) {
        try {
            console.log('👁️ Ver detalle de venta:', ventaId);
            mostrarAlerta('Función de detalle en desarrollo', 'info');
        } catch (error) {
            console.error('Error viendo detalle:', error);
            mostrarAlerta('Error al cargar detalle de la venta', 'error');
        }
    }

    async reimprimirVenta(ventaId) {
        try {
            console.log('🖨️ Reimprimir venta:', ventaId);
            mostrarAlerta('Función de reimpresión en desarrollo', 'info');
        } catch (error) {
            console.error('Error reimprimiendo:', error);
            mostrarAlerta('Error al reimprimir la venta', 'error');
        }
    }

    generarNumeroFactura() {
        const fecha = new Date();
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const numero = Math.floor(Math.random() * 10000).toString().padStart(6, '0');
        
        return `${año}${mes}${dia}-${numero}`;
    }

    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(precio);
    }

    // ===== MÉTODOS DE GESTIÓN AVANZADA DE CLIENTES =====
    
    cambiarTipoCliente() {
        const tipoCliente = document.getElementById('tipo-cliente').value;
        const documento = document.getElementById('documento-cliente');
        const nombre = document.getElementById('nombre-cliente');
        const telefono = document.getElementById('telefono-cliente');
        const grupoBuscador = document.getElementById('grupo-buscador');
        const panelInfo = document.getElementById('panel-cliente-info');
        
        if (tipoCliente === 'consumidor_final') {
            // Consumidor final
            documento.value = '';
            nombre.value = 'Consumidor Final';
            telefono.value = '';
            documento.disabled = true;
            nombre.disabled = true;
            telefono.disabled = true;
            
            grupoBuscador.style.display = 'none';
            panelInfo.style.display = 'none';
            
            // Limpiar datos del cliente
            this.clienteActual = {
                tipo: 'consumidor_final',
                nombre: 'Consumidor Final',
                documento: '',
                telefono: ''
            };
        } else {
            // Cliente registrado
            documento.disabled = false;
            nombre.disabled = false;
            telefono.disabled = false;
            nombre.value = '';
            documento.value = '';
            telefono.value = '';
            
            grupoBuscador.style.display = 'block';
            
            // Limpiar datos del cliente
            this.clienteActual = {};
        }
    }
    
    async buscarClientesRegistrados(termino) {
        const resultadosDiv = document.getElementById('resultados-clientes');
        
        if (!termino || termino.length < 2) {
            resultadosDiv.style.display = 'none';
            return;
        }
        
        try {
            const response = await fetch(`/api/ventas/clientes/buscar?q=${encodeURIComponent(termino)}`);
            const data = await response.json();
            
            if (data.success && data.clientes.length > 0) {
                this.mostrarResultadosClientes(data.clientes);
            } else {
                resultadosDiv.innerHTML = '<div class="resultado-cliente">No se encontraron clientes</div>';
                resultadosDiv.style.display = 'block';
            }
        } catch (error) {
            console.error('Error buscando clientes:', error);
            mostrarAlerta('Error al buscar clientes', 'error');
        }
    }
    
    mostrarResultadosClientes(clientes) {
        const resultadosDiv = document.getElementById('resultados-clientes');
        
        resultadosDiv.innerHTML = clientes.map(cliente => `
            <div class="resultado-cliente" data-cliente='${JSON.stringify(cliente)}'>
                <div class="cliente-nombre">${cliente.nombre}</div>
                <div class="cliente-documento">${cliente.documento}</div>
            </div>
        `).join('');
        
        // Agregar event listeners a los resultados
        resultadosDiv.querySelectorAll('.resultado-cliente').forEach(elemento => {
            elemento.addEventListener('click', () => {
                const clienteData = JSON.parse(elemento.dataset.cliente);
                this.seleccionarCliente(clienteData);
            });
        });
        
        resultadosDiv.style.display = 'block';
    }
    
    async seleccionarCliente(cliente) {
        try {
            // Llenar campos del formulario
            document.getElementById('documento-cliente').value = cliente.documento;
            document.getElementById('nombre-cliente').value = cliente.nombre;
            document.getElementById('telefono-cliente').value = cliente.telefono || '';
            
            // Ocultar buscador y mostrar panel de info
            document.getElementById('resultados-clientes').style.display = 'none';
            document.getElementById('buscar-cliente').value = cliente.nombre;
            
            // Cargar estadísticas del cliente
            await this.cargarEstadisticasCliente(cliente.id);
            
            // Actualizar cliente actual
            this.clienteActual = {
                id: cliente.id,
                tipo: 'registrado',
                documento: cliente.documento,
                nombre: cliente.nombre,
                telefono: cliente.telefono || ''
            };
            
            mostrarAlerta('Cliente seleccionado correctamente', 'success');
            
        } catch (error) {
            console.error('Error seleccionando cliente:', error);
            mostrarAlerta('Error al seleccionar cliente', 'error');
        }
    }
    
    async cargarEstadisticasCliente(clienteId) {
        try {
            const response = await fetch(`/api/ventas/clientes/${clienteId}/estadisticas`);
            const data = await response.json();
            
            if (data.success) {
                this.mostrarInfoCliente(data.cliente, data.estadisticas);
            }
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }
    
    mostrarInfoCliente(cliente, estadisticas) {
        const panelInfo = document.getElementById('panel-cliente-info');
        
        document.getElementById('cliente-nombre-display').textContent = cliente.nombre_completo;
        document.getElementById('cliente-documento-display').textContent = `Doc: ${cliente.numero_documento}`;
        document.getElementById('cliente-contacto-display').textContent = 
            cliente.telefono ? `Tel: ${cliente.telefono}` : 'Sin teléfono';
        
        document.getElementById('cliente-total-compras').textContent = estadisticas.total_compras;
        
        if (estadisticas.ultima_compra) {
            const fecha = new Date(estadisticas.ultima_compra).toLocaleDateString('es-CO');
            document.getElementById('cliente-ultima-compra').textContent = fecha;
        } else {
            document.getElementById('cliente-ultima-compra').textContent = 'Primera compra';
        }
        
        panelInfo.style.display = 'block';
    }
    
    limpiarClienteSeleccionado() {
        // Limpiar formulario
        document.getElementById('buscar-cliente').value = '';
        document.getElementById('documento-cliente').value = '';
        document.getElementById('nombre-cliente').value = '';
        document.getElementById('telefono-cliente').value = '';
        
        // Ocultar panel de información
        document.getElementById('panel-cliente-info').style.display = 'none';
        document.getElementById('resultados-clientes').style.display = 'none';
        
        // Limpiar cliente actual
        this.clienteActual = {};
        
        mostrarAlerta('Cliente removido de la venta', 'info');
    }
    
    abrirModalNuevoCliente() {
        const modal = document.getElementById('modal-nuevo-cliente');
        const form = document.getElementById('form-nuevo-cliente');
        
        // Limpiar formulario
        form.reset();
        
        // Mostrar modal
        modal.classList.add('active');
        
        // Focus en el primer campo
        document.getElementById('nuevo-documento').focus();
        
        // Configurar event listeners si no están configurados
        this.configurarModalNuevoCliente();
    }

    configurarModalNuevoCliente() {
        const modal = document.getElementById('modal-nuevo-cliente');
        const form = document.getElementById('form-nuevo-cliente');
        const btnCerrar = document.getElementById('btn-cerrar-modal-cliente');
        const btnCancelar = document.getElementById('btn-cancelar-cliente');
        
        // Solo configurar una vez
        if (modal && modal.dataset.configured) return;
        if (modal) modal.dataset.configured = 'true';
        
        // Cerrar modal
        const cerrarModal = () => {
            modal.classList.remove('active');
        };
        
        // Event listeners
        if (btnCerrar && !btnCerrar.dataset.configured) {
            btnCerrar.dataset.configured = 'true';
            btnCerrar.addEventListener('click', cerrarModal);
        }
        
        if (btnCancelar && !btnCancelar.dataset.configured) {
            btnCancelar.dataset.configured = 'true';
            btnCancelar.addEventListener('click', cerrarModal);
        }
        
        // Cerrar al hacer clic fuera del modal
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    cerrarModal();
                }
            });
        }
        
        // Envío del formulario
        if (form && !form.dataset.configured) {
            form.dataset.configured = 'true';
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.guardarNuevoCliente(form);
            });
        }
    }

    async guardarNuevoCliente(form) {
        const btnGuardar = document.getElementById('btn-guardar-cliente');
        const textoOriginal = btnGuardar.innerHTML;
        
        try {
            // Mostrar estado de carga
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="m12 1 0 6"></path>
                    <path d="m12 17 0 6"></path>
                </svg>
                Guardando...
            `;
            
            // Recopilar datos del formulario
            const formData = new FormData(form);
            const clienteData = {
                tipo_documento: formData.get('tipo_documento'),
                numero_documento: formData.get('numero_documento'),
                nombre: formData.get('nombres'),
                apellido: formData.get('apellidos') || '',
                telefono: formData.get('telefono') || '',
                email: formData.get('email') || '',
                direccion: formData.get('direccion') || ''
            };
            
            console.log('📝 Creando nuevo cliente:', clienteData);
            
            // Enviar al servidor
            const response = await fetch('/api/clientes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(clienteData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                // Cliente creado exitosamente
                mostrarAlerta('Cliente creado correctamente', 'success');
                
                // Seleccionar el nuevo cliente automáticamente
                const nuevoCliente = {
                    id: result.cliente.id,
                    documento: clienteData.numero_documento,
                    nombre: `${clienteData.nombre} ${clienteData.apellido}`.trim(),
                    nombres: clienteData.nombre,
                    apellidos: clienteData.apellido,
                    telefono: clienteData.telefono
                };
                
                // Cambiar a cliente registrado y seleccionarlo
                document.getElementById('tipo-cliente').value = 'registrado';
                this.cambiarTipoCliente();
                await this.seleccionarCliente(nuevoCliente);
                
                // Cerrar modal
                document.getElementById('modal-nuevo-cliente').classList.remove('active');
                
            } else {
                throw new Error(result.message || 'Error al crear cliente');
            }
            
        } catch (error) {
            console.error('Error creando cliente:', error);
            mostrarAlerta('Error al crear cliente: ' + error.message, 'error');
        } finally {
            // Restaurar botón
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = textoOriginal;
        }
    }
}

// Función global para mostrar alertas
function mostrarAlerta(mensaje, tipo = 'info') {
    console.log(`${tipo.toUpperCase()}: ${mensaje}`);
    
    // Usar el sistema de alertas personalizado si está disponible
    if (window.customAlert && typeof window.customAlert.alert === 'function') {
        const tipoAlerta = tipo === 'error' ? 'warning' : (tipo === 'success' ? 'success' : 'info');
        const titulo = tipo === 'error' ? 'Error' : (tipo === 'success' ? 'Éxito' : 'Información');
        return window.customAlert.alert(mensaje, titulo, tipoAlerta);
    }
    
    // Fallback: usar alert nativo
    alert(`${tipo.toUpperCase()}: ${mensaje}`);
    return Promise.resolve();
}

// Inicializar sistema cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    const sistemaVentas = new SistemaVentas();
    
    // Hacer la instancia accesible globalmente para debugging
    window.sistemaVentas = sistemaVentas;
});
