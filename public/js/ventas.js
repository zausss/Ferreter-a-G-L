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
        
        tipoCliente.addEventListener('change', () => {
            if (tipoCliente.value === 'consumidor_final') {
                documento.value = '';
                nombre.value = 'Consumidor Final';
                documento.disabled = true;
                nombre.disabled = true;
            } else {
                documento.disabled = false;
                nombre.disabled = false;
                nombre.value = '';
            }
        });
        
        documento.addEventListener('input', () => this.buscarCliente(documento.value));
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
        // TODO: Implementar historial de ventas
        mostrarAlerta('Función de historial en desarrollo', 'info');
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
