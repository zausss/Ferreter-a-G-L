class SistemaFacturas {
    constructor() {
        this.paginaActual = 1;
        this.facturasPorPagina = 20;
        this.filtros = {};
        this.init();
    }

    init() {
        this.configurarEventListeners();
        this.cargarFacturas();
        this.cargarConfiguracionEmpresa();
    }

    configurarEventListeners() {
        // Filtros en tiempo real para inputs de texto
        ['filtro-numero', 'filtro-cliente'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', 
                this.debounce(() => this.filtrarFacturas(), 500)
            );
        });

        // Filtros inmediatos para selects y fechas
        ['filtro-estado', 'filtro-fecha-desde', 'filtro-fecha-hasta'].forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                console.log(`🔍 Filtro ${id} cambió`);
                this.filtrarFacturas();
            });
        });

        // Botón configurar empresa
        document.getElementById('btn-configurar-empresa')?.addEventListener('click', () => {
            console.log('🏢 Abriendo configuración de empresa');
            this.abrirConfiguracionEmpresa();
        });

        // Formulario de empresa
        document.getElementById('form-empresa')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarConfiguracionEmpresa();
        });

        // Event listener para botones de ver factura (delegación de eventos)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-ver-factura')) {
                const facturaId = e.target.getAttribute('data-id');
                console.log('🔍 Haciendo clic en ver factura:', facturaId);
                this.verFactura(facturaId);
            }
            
            // Manejar cierre de modales de forma global
            if (e.target.classList.contains('modal-factura')) {
                console.log('🔴 Cerrando modal por clic en overlay');
                e.target.remove();
            }
        });

        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Cerrar modal de empresa si está abierto
                this.cerrarModalEmpresa();
                
                // Cerrar modal de factura si está abierto
                const modalFactura = document.querySelector('.modal-factura');
                if (modalFactura) {
                    console.log('🔴 Cerrando modal de factura con ESC');
                    modalFactura.remove();
                }
            }
        });
    }

    debounce(func, wait) {
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

    async cargarFacturas() {
        console.log('🔄 Cargando facturas...', this.filtros);
        this.mostrarLoading(true);
        
        try {
            const params = new URLSearchParams({
                page: this.paginaActual,
                limit: this.facturasPorPagina,
                ...this.filtros
            });

            // Usar credentials para cookies automáticamente
            const response = await fetch(`/api/facturas?${params}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Facturas cargadas:', data.facturas?.length || 0);
            
            this.mostrarFacturas(data.facturas);
            this.actualizarPaginacion(data.pagination);

        } catch (error) {
            console.error('❌ Error cargando facturas:', error);
            this.mostrarAlerta('Error al cargar facturas: ' + error.message, 'error');
            this.mostrarEstadoVacio();
        } finally {
            this.mostrarLoading(false);
        }
    }

    mostrarFacturas(facturas) {
        const tbody = document.getElementById('facturas-tbody');
        const contenido = document.getElementById('facturas-contenido');
        const estadoVacio = document.getElementById('empty-state');

        if (!facturas || facturas.length === 0) {
            contenido.style.display = 'none';
            estadoVacio.style.display = 'block';
            return;
        }

        contenido.style.display = 'block';
        estadoVacio.style.display = 'none';

        tbody.innerHTML = facturas.map(factura => `
            <tr>
                <td>
                    <strong>${factura.numero_factura}</strong>
                    <br><small>${factura.total_items} items</small>
                </td>
                <td>
                    <strong>${factura.cliente_nombre}</strong>
                    ${factura.cliente_documento ? `<br><small>Doc: ${factura.cliente_documento}</small>` : ''}
                </td>
                <td>
                    <strong>$${this.formatearPrecio(factura.total)}</strong>
                    <br><small>${factura.metodo_pago}</small>
                </td>
                <td>${this.capitalize(factura.metodo_pago)}</td>
                <td>
                    ${this.formatearFecha(factura.fecha_creacion)}
                    <br><small>${this.formatearHora(factura.fecha_creacion)}</small>
                </td>
                <td>
                    <span class="estado-badge estado-${factura.estado}">
                        ${this.capitalize(factura.estado)}
                    </span>
                </td>
                <td>
                    <div class="acciones-facturas">
                                                <button class="btn btn-primary btn-ver-factura" data-id="${factura.id}" title="Ver Factura">
                            👁️ Ver
                        </button>
                        <button class="btn btn-success" onclick="sistemaFacturas.imprimirFactura(${factura.id})" title="Imprimir">
                            🖨️
                        </button>
                        ${factura.estado === 'activa' ? `
                            <button class="btn btn-danger" onclick="sistemaFacturas.anularFactura(${factura.id})" title="Anular">
                                ❌
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    mostrarEstadoVacio() {
        const contenido = document.getElementById('facturas-contenido');
        const estadoVacio = document.getElementById('empty-state');
        
        if (contenido) {
            contenido.style.display = 'none';
        }
        if (estadoVacio) {
            estadoVacio.style.display = 'block';
        }
        console.log('📭 Mostrando estado vacío - no hay facturas');
    }

    mostrarLoading(mostrar) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = mostrar ? 'block' : 'none';
        } else {
            console.log(mostrar ? '🔄 Cargando...' : '✅ Carga completada');
        }
    }

    actualizarPaginacion(pagination) {
        const infoPagina = document.getElementById('info-pagina');
        const btnAnterior = document.getElementById('btn-anterior');
        const btnSiguiente = document.getElementById('btn-siguiente');

        if (infoPagina) {
            infoPagina.textContent = `Página ${pagination.page} de ${pagination.totalPages} (${pagination.total} facturas)`;
        }

        if (btnAnterior) {
            btnAnterior.disabled = pagination.page <= 1;
        }

        if (btnSiguiente) {
            btnSiguiente.disabled = pagination.page >= pagination.totalPages;
        }
    }

    filtrarFacturas() {
        const numeroInput = document.getElementById('filtro-numero')?.value || '';
        
        this.filtros = {
            cliente: document.getElementById('filtro-cliente')?.value || '',
            estado: document.getElementById('filtro-estado')?.value || '',
            fechaDesde: document.getElementById('filtro-fecha-desde')?.value || '',
            fechaHasta: document.getElementById('filtro-fecha-hasta')?.value || ''
        };

        // Manejo inteligente del filtro de número/ID
        if (numeroInput) {
            // Si es solo números, buscar por ID
            if (/^\d+$/.test(numeroInput)) {
                this.filtros.facturaId = numeroInput;
            } else {
                // Si contiene letras/guiones, buscar por número de factura
                this.filtros.numeroFactura = numeroInput;
            }
        }

        // Limpiar filtros vacíos
        Object.keys(this.filtros).forEach(key => {
            if (!this.filtros[key]) {
                delete this.filtros[key];
            }
        });

        this.paginaActual = 1;
        this.cargarFacturas();
    }

    limpiarFiltros() {
        document.getElementById('filtro-numero').value = '';
        document.getElementById('filtro-cliente').value = '';
        document.getElementById('filtro-estado').value = '';
        document.getElementById('filtro-fecha-desde').value = '';
        document.getElementById('filtro-fecha-hasta').value = '';
        
        this.filtros = {};
        this.paginaActual = 1;
        this.cargarFacturas();
    }

    cambiarPagina(direccion) {
        this.paginaActual += direccion;
        if (this.paginaActual < 1) this.paginaActual = 1;
        this.cargarFacturas();
    }

    async verFactura(id) {
        try {
            console.log(`👁️  Viendo factura ID: ${id}`);
            
            // Usar credentials para cookies automáticamente
            const response = await fetch(`/api/facturas/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('✅ Factura cargada:', data.factura?.numero_factura);
            
            this.mostrarDetalleFactura(data.factura);

        } catch (error) {
            console.error('❌ Error cargando factura:', error);
            this.mostrarAlerta('Error al cargar los detalles de la factura: ' + error.message, 'error');
        }
    }

    mostrarDetalleFactura(factura) {
        console.log('📄 Mostrando modal de factura:', factura.numero_factura);
        console.log('🔍 Datos de factura:', factura);
        
        // Crear modal con detalles de la factura
        const modal = document.createElement('div');
        modal.className = 'modal-factura';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-contenido" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>📄 Factura ${factura.numero_factura}</h3>
                    <button class="btn-cerrar" data-action="cerrar-modal">×</button>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                        <div>
                            <h4>🏢 Empresa</h4>
                            <p><strong>${factura.empresa_nombre}</strong></p>
                            <p>NIT: ${factura.empresa_nit}</p>
                            <p>${factura.empresa_direccion}</p>
                            <p>${factura.empresa_telefono}</p>
                        </div>
                        <div>
                            <h4>👤 Cliente</h4>
                            <p><strong>${factura.cliente_nombre}</strong></p>
                            ${factura.cliente_documento ? `<p>Doc: ${factura.cliente_documento}</p>` : ''}
                            ${factura.cliente_telefono ? `<p>Tel: ${factura.cliente_telefono}</p>` : ''}
                        </div>
                    </div>
                    
                    <h4>📦 Productos</h4>
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                            <tr style="background: #f8f9fa;">
                                <th style="padding: 10px; border: 1px solid #ddd;">Código</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Producto</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Cant.</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">V. Unit.</th>
                                <th style="padding: 10px; border: 1px solid #ddd;">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${factura.detalles && factura.detalles.length > 0 ? factura.detalles.map(detalle => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #ddd;">${detalle.codigo || detalle.producto_codigo}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd;">${detalle.nombre || detalle.producto_nombre}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${detalle.cantidad}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${this.formatearPrecio(detalle.precio || detalle.precio_unitario)}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${this.formatearPrecio(detalle.subtotal || detalle.subtotal_linea)}</td>
                                </tr>
                            `).join('') : '<tr><td colspan="5" style="text-align: center; padding: 20px;">No hay productos en esta factura</td></tr>'}
                        </tbody>
                    </table>
                    
                    <div style="text-align: right; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <p><strong>Subtotal: $${this.formatearPrecio(factura.subtotal)}</strong></p>
                        <p><strong>IVA: $${this.formatearPrecio(factura.iva)}</strong></p>
                        <p style="font-size: 18px; color: #007bff;"><strong>TOTAL: $${this.formatearPrecio(factura.total)}</strong></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-success" data-action="imprimir-factura" data-id="${factura.id}">🖨️ Imprimir</button>
                    <button class="btn btn-warning" data-action="cerrar-modal">❌ Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        console.log('✅ Modal agregado al DOM');

        // Configurar event listeners para el modal
        const btnCerrar = modal.querySelectorAll('[data-action="cerrar-modal"]');
        btnCerrar.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('🔴 Cerrando modal de factura');
                modal.remove();
            });
        });

        const btnImprimir = modal.querySelector('[data-action="imprimir-factura"]');
        if (btnImprimir) {
            btnImprimir.addEventListener('click', () => {
                const facturaId = btnImprimir.getAttribute('data-id');
                console.log('🖨️ Imprimiendo factura:', facturaId);
                this.imprimirFactura(facturaId);
            });
        }

        // Cerrar modal al hacer clic fuera de él
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('🔴 Cerrando modal por clic fuera');
                modal.remove();
            }
        });
    }

    async anularFactura(id) {
        console.log('🔍 Iniciando anulación de factura:', id);
        
        const razon = prompt('¿Por qué desea anular esta factura?');
        console.log('📝 Razón proporcionada:', razon);
        
        if (!razon) {
            console.log('❌ Cancelado: No se proporcionó razón');
            return;
        }

        try {
            console.log(`❌ Anulando factura ID: ${id} - Razón: ${razon}`);
            
            const token = localStorage.getItem('token');
            console.log('🔐 Token disponible:', !!token);
            
            const response = await fetch(`/api/facturas/${id}/anular`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ razon })
            });

            console.log('📡 Respuesta del servidor:', response.status, response.statusText);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Error del servidor:', errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const resultado = await response.json();
            console.log('✅ Factura anulada exitosamente:', resultado);
            
            this.mostrarAlerta('Factura anulada exitosamente', 'success');
            this.cargarFacturas();

        } catch (error) {
            console.error('❌ Error completo:', error);
            this.mostrarAlerta('Error al anular la factura: ' + error.message, 'error');
        }
    }

    imprimirFactura(id) {
        // Abrir factura en nueva ventana para imprimir
        window.open(`/api/facturas/${id}/imprimir`, '_blank');
    }

    async cargarConfiguracionEmpresa() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/facturas/empresa/info', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const empresa = data.empresa;
                
                if (empresa) {
                    document.getElementById('empresa-nombre').value = empresa.nombre_empresa || '';
                    document.getElementById('empresa-nit').value = empresa.nit || '';
                    document.getElementById('empresa-direccion').value = empresa.direccion || '';
                    document.getElementById('empresa-telefono').value = empresa.telefono || '';
                    document.getElementById('empresa-email').value = empresa.email || '';
                    document.getElementById('empresa-ciudad').value = empresa.ciudad || '';
                    document.getElementById('empresa-eslogan').value = empresa.eslogan || '';
                }
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
    }

    async guardarConfiguracionEmpresa() {
        try {
            const datos = {
                nombre_empresa: document.getElementById('empresa-nombre').value,
                nit: document.getElementById('empresa-nit').value,
                direccion: document.getElementById('empresa-direccion').value,
                telefono: document.getElementById('empresa-telefono').value,
                email: document.getElementById('empresa-email').value,
                ciudad: document.getElementById('empresa-ciudad').value,
                eslogan: document.getElementById('empresa-eslogan').value
            };

            const token = localStorage.getItem('token');

            const response = await fetch('/api/facturas/empresa/info', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                let errorText;
                try {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorJson = await response.json();
                        errorText = errorJson.message || JSON.stringify(errorJson);
                    } else {
                        errorText = await response.text();
                    }
                } catch (parseError) {
                    errorText = `No se pudo leer el error del servidor. Status: ${response.status}`;
                }
                console.error('❌ Error del servidor:', errorText);
                throw new Error(`Error ${response.status}: ${errorText}`);
            }

            const resultado = await response.json();

            this.mostrarAlerta('Configuración de empresa guardada exitosamente', 'success');
            this.cerrarModalEmpresa();

        } catch (error) {
            console.error('❌ Error completo:', error);
            this.mostrarAlerta('Error al guardar la configuración: ' + error.message, 'error');
        }
    }

    abrirConfiguracionEmpresa() {
        document.getElementById('modal-empresa').style.display = 'block';
    }

    cerrarModalEmpresa() {
        document.getElementById('modal-empresa').style.display = 'none';
    }

    // Método específico para cerrar modal de factura
    cerrarModalFactura() {
        const modal = document.querySelector('.modal-factura');
        if (modal) {
            console.log('🔴 Cerrando modal de factura');
            modal.remove();
            return true;
        }
        return false;
    }

    // Método global para cerrar cualquier modal
    cerrarTodosLosModales() {
        // Cerrar modal de empresa
        this.cerrarModalEmpresa();
        
        // Cerrar modal de factura
        this.cerrarModalFactura();
        
        console.log('🔄 Todos los modales cerrados');
    }

    // Funciones utilitarias
    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-CO', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(precio);
    }

    formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-CO');
    }

    formatearHora(fecha) {
        return new Date(fecha).toLocaleTimeString('es-CO', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Método para mostrar alertas (compatible con sistema de alertas)
    mostrarAlerta(mensaje, tipo = 'info') {
        console.log(`${tipo.toUpperCase()}: ${mensaje}`);
        
        // Si existe la función global mostrarAlerta, usarla
        if (typeof mostrarAlerta === 'function') {
            mostrarAlerta(mensaje, tipo);
            return;
        }
        
        // Fallback: mostrar alert simple
        alert(mensaje);
    }
}

// Funciones globales para los botones
function filtrarFacturas() {
    sistemaFacturas.filtrarFacturas();
}

function cerrarModalFactura() {
    return sistemaFacturas.cerrarModalFactura();
}

function cerrarTodosLosModales() {
    sistemaFacturas.cerrarTodosLosModales();
}

function limpiarFiltros() {
    sistemaFacturas.limpiarFiltros();
}

function cambiarPagina(direccion) {
    sistemaFacturas.cambiarPagina(direccion);
}

function abrirConfiguracionEmpresa() {
    sistemaFacturas.abrirConfiguracionEmpresa();
}

function cerrarModalEmpresa() {
    sistemaFacturas.cerrarModalEmpresa();
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
    window.sistemaFacturas = new SistemaFacturas();
    
    // Hacer funciones disponibles globalmente
    window.cerrarModalFactura = () => window.sistemaFacturas.cerrarModalFactura();
    window.cerrarTodosLosModales = () => window.sistemaFacturas.cerrarTodosLosModales();
    window.mostrarAlerta = mostrarAlerta;
});
