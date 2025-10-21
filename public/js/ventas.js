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
        // Asegurar que los modales estén cerrados al inicializar
        this.forzarCierreInicial();
        
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
    
    // *** FUNCIÓN DE EMERGENCIA TOTAL ***
    emergenciaTotal() {
        // 1. Remover TODAS las clases que puedan mantener modales abiertos
        document.querySelectorAll('*[class*="modal"], *[class*="active"], *[class*="open"], *[class*="show"]').forEach(el => {
            el.classList.remove('active', 'open', 'show', 'visible');
            el.style.display = 'none';
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
        });
        
        // 2. Resetear específicamente todos los modales conocidos
        const modalIds = ['modal-factura', 'modal-nuevo-cliente', 'modal-historial', 'modal-detalle-venta', 'modal-venta-exitosa'];
        modalIds.forEach(id => {
            const modal = document.getElementById(id);
            if (modal) {
                modal.style.display = 'none';
                modal.style.visibility = 'hidden';
                modal.style.opacity = '0';
                modal.classList.remove('active', 'open', 'show');
                modal.classList.add('modal-force-close');
            }
        });
        
        // 3. Restaurar body
        document.body.style.overflow = 'auto';
        document.body.style.position = 'static';
        
        // 4. Limpiar estilos de emergencia después de resetear
        setTimeout(() => {
            document.querySelectorAll('.modal-force-close').forEach(modal => {
                modal.classList.remove('modal-force-close');
            });
        }, 1000);
        
        // 5. Mostrar confirmación
        setTimeout(() => {
            if (window.customAlert) {
                window.customAlert.alert('✅ Emergencia Total Ejecutada - Todos los modales han sido reseteados', 'Sistema', 'success');
            } else {
                alert('✅ EMERGENCIA TOTAL: Todos los modales reseteados');
            }
        }, 100);
    }
    
    // Función específica para el cierre inicial (más simple y directa)
    forzarCierreInicial() {
        // Método directo sin timeouts ni observadores
        const modalFactura = document.getElementById('modal-factura');
        const modalNuevoCliente = document.getElementById('modal-nuevo-cliente');
        const modalHistorial = document.getElementById('modal-historial');
        const modalVentaExitosa = document.getElementById('modal-venta-exitosa');
        
        if (modalFactura) {
            modalFactura.classList.remove('show');
            modalFactura.style.display = 'none';
            modalFactura.style.visibility = 'hidden';
        }
        
        if (modalNuevoCliente) {
            modalNuevoCliente.classList.remove('active');
            modalNuevoCliente.style.display = 'none';
            modalNuevoCliente.style.visibility = 'hidden';
        }
        
        if (modalHistorial) {
            modalHistorial.classList.remove('active');
            modalHistorial.style.display = 'none';
            modalHistorial.style.visibility = 'hidden';
        }
        
        if (modalVentaExitosa) {
            modalVentaExitosa.classList.remove('active');
            modalVentaExitosa.style.display = 'none';
            modalVentaExitosa.style.visibility = 'hidden';
        }
        
        // Limpiar cualquier modal dinámico
        const modalDetalle = document.getElementById('modal-detalle-venta');
        if (modalDetalle) {
            modalDetalle.remove();
        }
        
        // Restaurar después de limpiar
        setTimeout(() => {
            if (modalNuevoCliente) {
                modalNuevoCliente.style.display = '';
                modalNuevoCliente.style.visibility = '';
            }
            if (modalHistorial) {
                modalHistorial.style.display = '';
                modalHistorial.style.visibility = '';
            }
            if (modalVentaExitosa) {
                modalVentaExitosa.style.display = '';
                modalVentaExitosa.style.visibility = '';
            }
        }, 100);
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
        
        // *** TECLAS DE EMERGENCIA ***
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F11') {
                e.preventDefault();
                this.emergenciaTotal();
            } else if (e.key === 'F10') {
                e.preventDefault();
                this.cerrarModalForzado();
            }
        });
        
        // Modal
        document.getElementById('btn-imprimir').addEventListener('click', () => this.imprimirFactura());
        document.getElementById('btn-nueva-venta-modal').addEventListener('click', () => this.nuevaVentaDesdeModal());
        document.getElementById('btn-cerrar-modal').addEventListener('click', () => this.cerrarModal());
        
        // Modal Venta Exitosa
        document.getElementById('btn-imprimir-inmediato').addEventListener('click', () => this.imprimirFacturaInmediato());
        document.getElementById('btn-nueva-venta-inmediato').addEventListener('click', () => this.nuevaVentaInmediato());
        document.getElementById('btn-cerrar-venta-exitosa').addEventListener('click', () => this.cerrarModalVentaExitosa());
        
        // Cerrar modal con ESC (mejorado para todos los modales)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modalFactura = document.getElementById('modal-factura');
                const modalNuevoCliente = document.getElementById('modal-nuevo-cliente');
                const modalHistorial = document.getElementById('modal-historial');
                const modalDetalle = document.getElementById('modal-detalle-venta');
                
                // Verificar si algún modal está abierto
                const modalFacturaAbierto = modalFactura && modalFactura.style.display === 'block';
                const modalClienteAbierto = modalNuevoCliente && modalNuevoCliente.classList.contains('active');
                const modalHistorialAbierto = modalHistorial && modalHistorial.classList.contains('active');
                const modalDetalleAbierto = modalDetalle && modalDetalle.style.display !== 'none';
                
                if (modalFacturaAbierto || modalClienteAbierto || modalHistorialAbierto || modalDetalleAbierto) {
                    this.cerrarModal();
                }
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
            
            console.log('🔍 Respuesta de búsqueda:', response.status, response.statusText);
            
            if (!response.ok) {
                // Intentar leer el error como texto primero
                const errorText = await response.text();
                console.error('❌ Error del servidor:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error al buscar productos'}`);
            }
            
            // Verificar que la respuesta es JSON válido
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const responseText = await response.text();
                console.error('❌ Respuesta no es JSON:', responseText);
                throw new Error('El servidor no devolvió datos JSON válidos');
            }
            
            const productos = await response.json();
            console.log('✅ Productos encontrados:', productos.length);
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
                    <div class="producto-stock">Stock: ${producto.stock} ${producto.unidad_medida || 'unidades'}</div>
                    <div class="producto-precio">$${this.formatearPrecio(producto.precio)}</div>
                </div>
                <div class="producto-acciones">
                    <div class="cantidad-container">
                        <label for="cantidad-${producto.id}">Cantidad:</label>
                        <input type="number" 
                               id="cantidad-${producto.id}"
                               class="input-cantidad" 
                               min="1" 
                               max="${producto.stock}" 
                               value="1"
                               step="1">
                    </div>
                    <button class="btn btn-agregar" 
                            onclick="sistemaVentas.agregarAlCarritoConCantidad(${producto.id})"
                            ${producto.stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
            </div>
        `).join('');
        
        resultados.style.display = 'block';
        
        // Agregar event listeners para validación de cantidad
        resultados.querySelectorAll('.input-cantidad').forEach(input => {
            input.addEventListener('input', (e) => {
                const valor = parseInt(e.target.value);
                const max = parseInt(e.target.max);
                
                if (valor > max) {
                    e.target.value = max;
                    mostrarAlerta(`Cantidad máxima disponible: ${max}`, 'warning');
                } else if (valor < 1) {
                    e.target.value = 1;
                }
            });
            
            // Permitir usar Enter para agregar al carrito
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const productId = input.id.replace('cantidad-', '');
                    this.agregarAlCarritoConCantidad(parseInt(productId));
                }
            });
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

    agregarAlCarritoConCantidad(productoId) {
        console.log('📦 Agregando producto con cantidad:', productoId);
        
        // Buscar el producto en los resultados de búsqueda
        const resultadoItem = document.querySelector(`[data-producto*='"id":${productoId}']`);
        if (!resultadoItem) {
            mostrarAlerta('Error: No se pudo encontrar el producto', 'error');
            return;
        }
        
        const producto = JSON.parse(resultadoItem.dataset.producto);
        const inputCantidad = document.getElementById(`cantidad-${productoId}`);
        const cantidad = parseInt(inputCantidad.value) || 1;
        
        console.log('📊 Datos del producto:', {
            id: producto.id,
            nombre: producto.nombre,
            cantidad: cantidad,
            stock: producto.stock
        });
        
        // Validar cantidad
        if (cantidad < 1) {
            mostrarAlerta('La cantidad debe ser mayor a 0', 'warning');
            inputCantidad.value = 1;
            return;
        }
        
        if (cantidad > producto.stock) {
            mostrarAlerta(`Stock insuficiente. Disponible: ${producto.stock}`, 'warning');
            inputCantidad.value = producto.stock;
            return;
        }
        
        // Usar la función existente agregarAlCarrito
        this.agregarAlCarrito(producto, cantidad);
        
        // Resetear la cantidad del input a 1 para la próxima vez
        inputCantidad.value = 1;
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
        
        // Crear indicador de progreso mejorado
        this.mostrarIndicadorProgreso();
        
        try {
            // Mostrar estado de carga
            console.log('⏳ Cambiando estado del botón a "Procesando..."');
            btnProcesar.textContent = 'Procesando...';
            btnProcesar.disabled = true;
            
            // Pequeña pausa para que la UI se actualice
            await new Promise(resolve => setTimeout(resolve, 50));
            
            this.actualizarProgreso('Preparando datos de venta...', 25);
            
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
            
            this.actualizarProgreso('Enviando venta al servidor...', 50);
            
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ventas', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ventaData)
            });
            
            this.actualizarProgreso('Procesando respuesta...', 75);
            
            console.log('📡 Respuesta recibida:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                url: response.url
            });
            
            // Verificar el content-type antes de intentar parsear JSON
            const contentType = response.headers.get("content-type");
            console.log('📄 Content-Type:', contentType);
            
            if (!response.ok) {
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                
                try {
                    if (contentType && contentType.includes("application/json")) {
                        const error = await response.json();
                        errorMessage = error.message || errorMessage;
                    } else {
                        // Si no es JSON, leer como texto para debugging
                        const errorText = await response.text();
                        console.error('❌ Respuesta de error (no JSON):', errorText.substring(0, 500));
                        errorMessage = `Error del servidor: ${errorText.substring(0, 100)}...`;
                    }
                } catch (parseError) {
                    console.error('❌ Error parseando respuesta de error:', parseError);
                }
                
                throw new Error(errorMessage);
            }
            
            // Verificar que la respuesta exitosa sea JSON válido
            if (!contentType || !contentType.includes("application/json")) {
                const responseText = await response.text();
                console.error('❌ Respuesta exitosa no es JSON:', responseText.substring(0, 500));
                throw new Error('El servidor devolvió una respuesta no válida (no JSON)');
            }
            
            const resultado = await response.json();
            console.log('✅ Respuesta del servidor:', resultado);
            
            this.actualizarProgreso('Generando factura...', 90);
            
            // Guardar información de la venta para la factura
            this.clienteActual = ventaData.cliente;
            this.ventaActual = {
                ...ventaData,
                numero: resultado.numeroVenta || resultado.numeroFactura,
                fecha: new Date().toLocaleDateString(),
                hora: new Date().toLocaleTimeString()
            };
            
            console.log('📋 Datos de venta actual preparados:', {
                numero: this.ventaActual.numero,
                cliente: this.clienteActual.nombre,
                total: this.ventaActual.total
            });
            
            this.actualizarProgreso('Completando...', 100);
            
            // Pequeña pausa antes de mostrar el modal de éxito
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Ocultar indicador de progreso
            this.ocultarIndicadorProgreso();
            
            // Mostrar modal de venta exitosa con opción de imprimir
            this.mostrarModalVentaExitosa();
            
            // Limpiar estado después de mostrar modal
            setTimeout(() => {
                this.limpiarEstadoPostVenta();
            }, 300);
            
        } catch (error) {
            console.error('Error:', error);
            this.ocultarIndicadorProgreso();
            mostrarAlerta(error.message || 'Error al procesar la venta', 'error');
        } finally {
            // Restaurar botón
            console.log('🔄 Restaurando botón:', textoOriginal);
            btnProcesar.textContent = textoOriginal;
            btnProcesar.disabled = false;
            this.ocultarIndicadorProgreso();
        }
    }

    mostrarFactura() {
        console.log('🎫 Iniciando mostrarFactura()');
        console.log('📋 Datos para factura:', {
            ventaActual: this.ventaActual,
            clienteActual: this.clienteActual,
            carrito: this.carrito
        });

        try {
            // Llenar información de la factura
            console.log('📝 Llenando información básica...');
            document.getElementById('numero-factura').textContent = this.ventaActual.numero || this.numeroFactura;
            document.getElementById('fecha-factura').textContent = this.ventaActual.fecha;
            document.getElementById('hora-factura').textContent = this.ventaActual.hora;
            
            // Información del cliente
            console.log('👤 Llenando información del cliente...');
            document.getElementById('factura-documento').textContent = this.clienteActual.documento || 'N/A';
            document.getElementById('factura-nombre').textContent = this.clienteActual.nombre;
            document.getElementById('factura-telefono').textContent = this.clienteActual.telefono || 'N/A';
            
            // Productos
            console.log('🛒 Llenando productos del carrito...');
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
            console.log('💰 Llenando totales...');
            document.getElementById('factura-subtotal').textContent = `$${this.formatearPrecio(this.ventaActual.subtotal)}`;
            document.getElementById('factura-iva').textContent = `$${this.formatearPrecio(this.ventaActual.iva)}`;
            document.getElementById('factura-total').textContent = `$${this.formatearPrecio(this.ventaActual.total)}`;
            
            // Información de pago
            console.log('💳 Configurando método de pago...');
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
            console.log('🖥️ Mostrando modal de factura...');
            const modalFactura = document.getElementById('modal-factura');
            
            if (!modalFactura) {
                console.error('❌ Modal de factura no encontrado en el DOM');
                throw new Error('Modal de factura no encontrado');
            }
            
            modalFactura.classList.add('show');
            console.log('✅ Clase "show" agregada al modal');
            
            // Verificar botón de imprimir
            const btnImprimir = document.getElementById('btn-imprimir');
            if (btnImprimir) {
                console.log('✅ Botón de imprimir encontrado y disponible');
                btnImprimir.style.display = 'flex'; // Asegurar que esté visible
            } else {
                console.error('❌ Botón de imprimir no encontrado');
            }
            
            // Verificar que el modal esté visible
            setTimeout(() => {
                const isVisible = modalFactura.classList.contains('show');
                console.log('🔍 Estado del modal después de 100ms:', {
                    hasShowClass: isVisible,
                    display: modalFactura.style.display,
                    visibility: modalFactura.style.visibility
                });
            }, 100);
            
            // NO bloquear scroll aquí - el modal de factura debe permitir scroll de fondo
            
            console.log('✅ mostrarFactura() completado exitosamente');
            
        } catch (error) {
            console.error('❌ Error en mostrarFactura():', error);
            mostrarAlerta('Error al mostrar la factura: ' + error.message, 'error');
        }
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

    cerrarModal(modalEspecifico = null) {
        console.log('🔒 Cerrando modales...', modalEspecifico ? `específico: ${modalEspecifico}` : 'todos');
        
        if (modalEspecifico) {
            // Cerrar solo un modal específico
            const modal = document.getElementById(modalEspecifico);
            if (modal) {
                modal.style.display = 'none';
                modal.classList.remove('active');
                console.log(`✅ Modal ${modalEspecifico} cerrado`);
            }
            return;
        }
        
        // Cerrar todos los modales (método suave)
        const modalFactura = document.getElementById('modal-factura');
        if (modalFactura && modalFactura.classList.contains('show')) {
            modalFactura.classList.remove('show');
            // Si se está cerrando la factura, preparar para nueva venta
            setTimeout(() => {
                this.prepararNuevaVenta();
            }, 300);
        }

        const modalNuevoCliente = document.getElementById('modal-nuevo-cliente');
        if (modalNuevoCliente && modalNuevoCliente.classList.contains('active')) {
            modalNuevoCliente.classList.remove('active');
        }

        const modalHistorial = document.getElementById('modal-historial');
        if (modalHistorial && modalHistorial.classList.contains('active')) {
            modalHistorial.classList.remove('active');
        }

        // Cerrar cualquier modal de detalle de venta que haya sido creado dinámicamente
        const modalDetalle = document.getElementById('modal-detalle-venta');
        if (modalDetalle) {
            modalDetalle.remove();
        }

        // Restaurar scroll del body
        document.body.style.overflow = 'auto';

        console.log('✅ Modales cerrados (método suave)');
    }
    
    // Nueva función para cierre forzado (solo para emergencias)
    cerrarModalForzado() {
        console.log('🚨 Iniciando cierre FORZADO de todos los modales...');
        
        // *** MÉTODO AGRESIVO: Usar clases de emergencia CSS ***
        document.querySelectorAll('.modal-overlay, .modal, [id*="modal"]').forEach(modal => {
            modal.classList.remove('active');
            modal.classList.add('modal-force-close');
            if (modal.style) {
                modal.style.display = 'none';
            }
        });

        // Restaurar scroll del body
        document.body.style.overflow = 'auto';

        // Limpiar clases de emergencia después de un momento
        setTimeout(() => {
            document.querySelectorAll('.modal-force-close').forEach(modal => {
                modal.classList.remove('modal-force-close');
            });
        }, 500);

        console.log('✅ Cierre FORZADO completado');
    }

    // Función auxiliar para verificar modales abiertos (útil para debugging)
    verificarModalesAbiertos() {
        const modalFactura = document.getElementById('modal-factura');
        const modalNuevoCliente = document.getElementById('modal-nuevo-cliente');
        const modalHistorial = document.getElementById('modal-historial');
        const modalDetalle = document.getElementById('modal-detalle-venta');
        
        const estados = {
            factura: modalFactura ? modalFactura.style.display === 'block' : false,
            nuevoCliente: modalNuevoCliente ? modalNuevoCliente.classList.contains('active') : false,
            historial: modalHistorial ? modalHistorial.classList.contains('active') : false,
            detalle: modalDetalle ? true : false
        };
        
        console.log('📋 Estado de modales:', estados);
        return estados;
    }

    nuevaVentaDesdeModal() {
        this.cerrarModal();
        this.nuevaVenta();
    }

    limpiarEstadoPostVenta() {
        console.log('🧹 Limpiando estado post-venta...');
        
        try {
            // Asegurar que no hay estados pendientes
            const btnProcesar = document.getElementById('btn-procesar');
            if (btnProcesar) {
                btnProcesar.disabled = false;
                if (btnProcesar.textContent === 'Procesando...') {
                    btnProcesar.textContent = 'Procesar Venta';
                }
            }
            
            // Limpiar cualquier timeout pendiente
            clearTimeout(this.timeoutId);
            
            // Verificar que el modal de factura esté visible
            const modalFactura = document.getElementById('modal-factura');
            if (modalFactura && !modalFactura.classList.contains('show')) {
                console.log('⚠️ Modal de factura no visible, reintentando...');
                modalFactura.classList.add('show');
            }
            
            console.log('✅ Estado post-venta limpiado');
            
        } catch (error) {
            console.error('❌ Error limpiando estado post-venta:', error);
        }
    }

    prepararNuevaVenta() {
        console.log('🆕 Preparando para nueva venta...');
        
        try {
            // Limpiar datos de venta anterior
            this.ventaActual = null;
            this.clienteActual = {};
            
            // Asegurar que el botón de procesar esté disponible
            const btnProcesar = document.getElementById('btn-procesar');
            if (btnProcesar) {
                btnProcesar.disabled = false;
                btnProcesar.textContent = 'Procesar Venta';
            }
            
            // Reset del cliente al estado por defecto
            this.cambiarTipoCliente();
            
            console.log('✅ Preparación para nueva venta completada');
            
        } catch (error) {
            console.error('❌ Error preparando nueva venta:', error);
        }
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
        console.log('📊 Abriendo modal de historial...');
        
        // *** CERRAR SOLO OTROS MODALES, NO ESTE ***
        const modalFactura = document.getElementById('modal-factura');
        const modalNuevoCliente = document.getElementById('modal-nuevo-cliente');
        
        if (modalFactura) {
            modalFactura.style.display = 'none';
            modalFactura.classList.remove('modal-force-close');
        }
        if (modalNuevoCliente) {
            modalNuevoCliente.classList.remove('active');
            modalNuevoCliente.classList.remove('modal-force-close');
        }
        
        const modal = document.getElementById('modal-historial');
        
        // Asegurar que el modal esté limpio
        modal.classList.remove('modal-force-close');
        
        // Configurar fechas por defecto (últimos 30 días)
        const hoy = new Date();
        const hace30Dias = new Date();
        hace30Dias.setDate(hoy.getDate() - 30);
        
        document.getElementById('filtro-fecha-desde').value = hace30Dias.toISOString().split('T')[0];
        document.getElementById('filtro-fecha-hasta').value = hoy.toISOString().split('T')[0];
        
        // Mostrar modal
        modal.classList.add('active');
        console.log('✅ Modal historial abierto');
        
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
            
            // Obtener detalles de la venta desde el servidor
            const response = await fetch(`/api/ventas/${ventaId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message);
            }
            
            const venta = data.venta;
            this.mostrarModalDetalles(venta);
            
        } catch (error) {
            console.error('Error viendo detalle:', error);
            mostrarAlerta('Error al cargar detalle de la venta', 'error');
        }
    }

    async reimprimirVenta(ventaId) {
        try {
            console.log('🖨️ Reimprimir venta:', ventaId);
            
            // Obtener detalles de la venta para reimprimir
            const response = await fetch(`/api/ventas/${ventaId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message);
            }
            
            const venta = data.venta;
            this.imprimirFacturaVenta(venta);
            mostrarAlerta('Factura enviada a imprimir', 'success');
            
        } catch (error) {
            console.error('Error reimprimiendo:', error);
            mostrarAlerta('Error al reimprimir la venta', 'error');
        }
    }

    mostrarModalDetalles(venta) {
        // Crear el modal de detalles
        const modalHTML = `
            <div id="modal-detalle-venta" class="modal-overlay">
                <div class="modal-detalle">
                    <div class="modal-header">
                        <h3>Detalle de Venta #${venta.numero_factura || venta.numero_venta}</h3>
                        <button class="btn-cerrar-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="info-venta">
                            <div class="info-grupo">
                                <h4>Información General</h4>
                                <p><strong>Fecha:</strong> ${new Date(venta.fecha_venta).toLocaleString()}</p>
                                <p><strong>Estado:</strong> <span class="estado-${venta.estado}">${venta.estado}</span></p>
                                <p><strong>Método de Pago:</strong> ${venta.metodo_pago}</p>
                            </div>
                            <div class="info-grupo">
                                <h4>Cliente</h4>
                                <p><strong>Documento:</strong> ${venta.cliente_documento || 'N/A'}</p>
                                <p><strong>Nombre:</strong> ${venta.cliente_nombre || 'Cliente General'}</p>
                                <p><strong>Teléfono:</strong> ${venta.cliente_telefono || 'N/A'}</p>
                            </div>
                            <div class="info-grupo">
                                <h4>Totales</h4>
                                <p><strong>Subtotal:</strong> $${this.formatearPrecio(venta.subtotal)}</p>
                                ${venta.descuento ? `<p><strong>Descuento:</strong> $${this.formatearPrecio(venta.descuento)}</p>` : ''}
                                <p><strong>IVA:</strong> $${this.formatearPrecio(venta.iva)}</p>
                                <p><strong>Total:</strong> $${this.formatearPrecio(venta.total)}</p>
                                ${venta.monto_recibido ? `<p><strong>Recibido:</strong> $${this.formatearPrecio(venta.monto_recibido)}</p>` : ''}
                                ${venta.cambio ? `<p><strong>Cambio:</strong> $${this.formatearPrecio(venta.cambio)}</p>` : ''}
                            </div>
                        </div>
                        
                        <div class="productos-detalle">
                            <h4>Productos</h4>
                            <table class="tabla-productos-detalle">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Producto</th>
                                        <th>Cantidad</th>
                                        <th>Precio Unit.</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${venta.detalle_ventas?.map(item => `
                                        <tr>
                                            <td>${item.codigo || item.producto_id}</td>
                                            <td>${item.nombre}</td>
                                            <td>${item.cantidad}</td>
                                            <td>$${this.formatearPrecio(item.precio_unitario)}</td>
                                            <td>$${this.formatearPrecio(item.subtotal)}</td>
                                        </tr>
                                    `).join('') || '<tr><td colspan="5">No hay productos registrados</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-reimprimir-modal" data-venta-id="${venta.id}">
                            🖨️ Imprimir
                        </button>
                        <button class="btn-cerrar">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        
        // Insertar modal en el DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Event listeners
        const modal = document.getElementById('modal-detalle-venta');
        const btnCerrar = modal.querySelector('.btn-cerrar-modal');
        const btnCerrarFooter = modal.querySelector('.btn-cerrar');
        const btnReimprimir = modal.querySelector('.btn-reimprimir-modal');
        
        // Cerrar modal
        [btnCerrar, btnCerrarFooter].forEach(btn => {
            btn.addEventListener('click', () => {
                modal.remove();
            });
        });
        
        // Cerrar al hacer clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Reimprimir desde el modal
        btnReimprimir.addEventListener('click', () => {
            this.imprimirFacturaVenta(venta);
            mostrarAlerta('Factura enviada a imprimir', 'success');
        });
    }

    imprimirFacturaVenta(venta) {
        // Crear ventana de impresión
        const ventanaImpresion = window.open('', '_blank');
        
        const facturaHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Factura #${venta.numero_factura || venta.numero_venta}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
                    .factura-header { text-align: center; margin-bottom: 20px; }
                    .empresa-info { margin-bottom: 15px; }
                    .venta-info { display: flex; justify-content: space-between; margin-bottom: 15px; }
                    .cliente-info { margin-bottom: 15px; }
                    .productos-tabla { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                    .productos-tabla th, .productos-tabla td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .productos-tabla th { background-color: #f5f5f5; }
                    .totales { margin-top: 20px; text-align: right; }
                    .total-final { font-size: 16px; font-weight: bold; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="factura-header">
                    <h2>FERRETERÍA J&L</h2>
                    <p>Sistema de Ventas</p>
                </div>
                
                <div class="venta-info">
                    <div>
                        <strong>Factura #:</strong> ${venta.numero_factura || venta.numero_venta}<br>
                        <strong>Fecha:</strong> ${new Date(venta.fecha_venta).toLocaleString()}<br>
                        <strong>Estado:</strong> ${venta.estado}
                    </div>
                    <div>
                        <strong>Método de Pago:</strong> ${venta.metodo_pago}<br>
                        ${venta.monto_recibido ? `<strong>Recibido:</strong> $${this.formatearPrecio(venta.monto_recibido)}<br>` : ''}
                        ${venta.cambio ? `<strong>Cambio:</strong> $${this.formatearPrecio(venta.cambio)}` : ''}
                    </div>
                </div>
                
                <div class="cliente-info">
                    <h3>Información del Cliente</h3>
                    <p><strong>Documento:</strong> ${venta.cliente_documento || 'N/A'}</p>
                    <p><strong>Nombre:</strong> ${venta.cliente_nombre || 'Cliente General'}</p>
                    <p><strong>Teléfono:</strong> ${venta.cliente_telefono || 'N/A'}</p>
                </div>
                
                <table class="productos-tabla">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Producto</th>
                            <th>Cant.</th>
                            <th>Precio Unit.</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${venta.detalle_ventas?.map(item => `
                            <tr>
                                <td>${item.codigo || item.producto_id}</td>
                                <td>${item.nombre}</td>
                                <td>${item.cantidad}</td>
                                <td>$${this.formatearPrecio(item.precio_unitario)}</td>
                                <td>$${this.formatearPrecio(item.subtotal)}</td>
                            </tr>
                        `).join('') || '<tr><td colspan="5">No hay productos registrados</td></tr>'}
                    </tbody>
                </table>
                
                <div class="totales">
                    <p><strong>Subtotal:</strong> $${this.formatearPrecio(venta.subtotal)}</p>
                    ${venta.descuento ? `<p><strong>Descuento:</strong> $${this.formatearPrecio(venta.descuento)}</p>` : ''}
                    <p><strong>IVA:</strong> $${this.formatearPrecio(venta.iva)}</p>
                    <p class="total-final"><strong>TOTAL:</strong> $${this.formatearPrecio(venta.total)}</p>
                </div>
                
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()">Imprimir</button>
                    <button onclick="window.close()">Cerrar</button>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;
        
        ventanaImpresion.document.write(facturaHTML);
        ventanaImpresion.document.close();
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
            // Consumidor final - Campos editables con valores por defecto
            documento.value = '';
            nombre.value = '';
            telefono.value = '';
            
            // PERMITIR EDICIÓN - NO deshabilitar campos
            documento.disabled = false;
            nombre.disabled = false;
            telefono.disabled = false;
            
            // Agregar placeholders informativos
            documento.placeholder = 'Documento (opcional)';
            nombre.placeholder = 'Nombre del cliente (opcional)';
            telefono.placeholder = 'Teléfono (opcional)';
            
            grupoBuscador.style.display = 'none';
            panelInfo.style.display = 'none';
            
            // Limpiar datos del cliente
            this.clienteActual = {
                tipo: 'consumidor_final',
                nombre: '',
                documento: '',
                telefono: ''
            };
            
            console.log('✅ Modo Consumidor Final activado - Campos editables');
        } else {
            // Cliente registrado
            documento.disabled = false;
            nombre.disabled = false;
            telefono.disabled = false;
            nombre.value = '';
            documento.value = '';
            telefono.value = '';
            
            // Restaurar placeholders normales
            documento.placeholder = 'Documento del cliente';
            nombre.placeholder = 'Nombre del cliente';
            telefono.placeholder = 'Teléfono del cliente';
            
            grupoBuscador.style.display = 'block';
            
            // Limpiar datos del cliente
            this.clienteActual = {};
            
            console.log('✅ Modo Cliente Registrado activado - Buscador habilitado');
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
        console.log('👤 Abriendo modal de nuevo cliente...');
        
        // *** CERRAR SOLO OTROS MODALES, NO ESTE ***
        const modalFactura = document.getElementById('modal-factura');
        const modalHistorial = document.getElementById('modal-historial');
        
        if (modalFactura) {
            modalFactura.style.display = 'none';
            modalFactura.classList.remove('modal-force-close');
        }
        if (modalHistorial) {
            modalHistorial.classList.remove('active');
            modalHistorial.classList.remove('modal-force-close');
        }
        
        const modal = document.getElementById('modal-nuevo-cliente');
        const form = document.getElementById('form-nuevo-cliente');
        
        // Asegurar que el modal esté limpio
        modal.classList.remove('modal-force-close');
        
        // Limpiar formulario
        form.reset();
        
        // Mostrar modal
        modal.classList.add('active');
        console.log('✅ Modal nuevo cliente abierto');
        
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

    // Funciones para indicador de progreso
    mostrarIndicadorProgreso() {
        // Eliminar indicador existente si hay uno
        this.ocultarIndicadorProgreso();
        
        const indicador = document.createElement('div');
        indicador.id = 'indicador-progreso-venta';
        indicador.innerHTML = `
            <div class="overlay-progreso">
                <div class="modal-progreso">
                    <div class="progreso-contenido">
                        <h3 style="margin: 0 0 15px 0; color: #007bff; font-size: 20px;">Procesando Venta</h3>
                        <div class="spinner"></div>
                        <div class="progreso-texto">Iniciando procesamiento...</div>
                        <div class="progreso-barra">
                            <div class="progreso-relleno" style="width: 0%"></div>
                        </div>
                        <div class="progreso-porcentaje">0%</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(indicador);
        
        // Aplicar estilos inline optimizados para centrado perfecto
        const overlay = indicador.querySelector('.overlay-progreso');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 99999;
            pointer-events: none;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const modal = indicador.querySelector('.modal-progreso');
        modal.style.cssText = `
            background: white;
            padding: 40px 50px;
            border-radius: 16px;
            text-align: center;
            min-width: 400px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 15px 40px rgba(0,0,0,0.4);
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 100000;
            pointer-events: auto;
            border: 3px solid #007bff;
            animation: aparecerProgreso 0.4s ease-out;
        `;
    }

    actualizarProgreso(texto, porcentaje) {
        const indicador = document.getElementById('indicador-progreso-venta');
        if (!indicador) return;
        
        const textoElement = indicador.querySelector('.progreso-texto');
        const rellenoElement = indicador.querySelector('.progreso-relleno');
        const porcentajeElement = indicador.querySelector('.progreso-porcentaje');
        
        if (textoElement) textoElement.textContent = texto;
        if (rellenoElement) rellenoElement.style.width = `${porcentaje}%`;
        if (porcentajeElement) porcentajeElement.textContent = `${porcentaje}%`;
    }

    ocultarIndicadorProgreso() {
        const indicador = document.getElementById('indicador-progreso-venta');
        if (indicador) {
            indicador.remove();
        }
    }

    // ===== FUNCIONES PARA MODAL DE VENTA EXITOSA =====
    
    mostrarModalVentaExitosa() {
        // Llenar información del modal
        document.getElementById('numero-venta-exitosa').textContent = this.ventaActual.numero;
        document.getElementById('cliente-venta-exitosa').textContent = this.clienteActual.nombre;
        document.getElementById('total-venta-exitosa').textContent = `$${this.formatearPrecio(this.ventaActual.total)}`;
        document.getElementById('fecha-venta-exitosa').textContent = this.ventaActual.fecha + ' ' + this.ventaActual.hora;
        
        // Mostrar modal
        const modalVentaExitosa = document.getElementById('modal-venta-exitosa');
        
        // Limpiar cualquier estilo inline que pueda interferir
        modalVentaExitosa.style.display = '';
        modalVentaExitosa.style.visibility = '';
        
        // Activar el modal
        modalVentaExitosa.classList.add('active');
    }

    imprimirFacturaInmediato() {
        // Verificar que tenemos la venta actual disponible
        if (!this.ventaActual || !this.ventaActual.numero) {
            console.error('❌ No hay venta actual para imprimir');
            mostrarAlerta('Error: No hay venta disponible para imprimir', 'error');
            return;
        }

        // Cerrar el modal de venta exitosa
        this.cerrarModalVentaExitosa();
        
        // Construir objeto venta compatible con imprimirFacturaVenta
        const ventaParaImprimir = {
            numero_factura: this.ventaActual.numero,
            numero_venta: this.ventaActual.numero,
            fecha_venta: this.ventaActual.fecha + ' ' + this.ventaActual.hora,
            estado: 'Completada',
            metodo_pago: this.ventaActual.metodoPago || 'Efectivo',
            monto_recibido: this.ventaActual.montoRecibido,
            cambio: this.ventaActual.cambio,
            cliente_documento: this.clienteActual.documento,
            cliente_nombre: this.clienteActual.nombre,
            cliente_telefono: this.clienteActual.telefono,
            detalle_ventas: this.carrito.map(item => ({
                codigo: item.codigo,
                producto_id: item.id,
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                subtotal: item.precio * item.cantidad
            })),
            subtotal: this.ventaActual.subtotal || this.ventaActual.total,
            descuento: this.ventaActual.descuento || 0,
            iva: this.ventaActual.iva || 0,
            total: this.ventaActual.total
        };
        
        // Usar la función específica para imprimir facturas
        this.imprimirFacturaVenta(ventaParaImprimir);
        
        console.log('✅ Factura enviada a imprimir');
    }

    nuevaVentaInmediato() {
        // Cerrar modal de venta exitosa
        this.cerrarModalVentaExitosa();
        
        // Iniciar nueva venta
        this.nuevaVenta();
        
        mostrarAlerta('Nueva venta iniciada', 'success');
    }

    cerrarModalVentaExitosa() {
        const modalVentaExitosa = document.getElementById('modal-venta-exitosa');
        modalVentaExitosa.classList.remove('active');
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
    
    // FUNCIÓN DE EMERGENCIA: Cerrar todos los modales con Ctrl+F12
    document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' && e.ctrlKey) {
            e.preventDefault();
            console.log('🚨 EMERGENCIA: Cerrando todos los modales (Ctrl+F12)');
            sistemaVentas.cerrarModal();
        }
    });
});
