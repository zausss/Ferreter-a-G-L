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
        // Filtros en tiempo real
        ['filtro-numero', 'filtro-cliente'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', 
                this.debounce(() => this.filtrarFacturas(), 500)
            );
        });

        // Formulario de empresa
        document.getElementById('form-empresa')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarConfiguracionEmpresa();
        });

        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarModalEmpresa();
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
        this.mostrarLoading(true);
        
        try {
            const params = new URLSearchParams({
                page: this.paginaActual,
                limit: this.facturasPorPagina,
                ...this.filtros
            });

            const token = localStorage.getItem('token');
            const response = await fetch(`/api/facturas?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar facturas');
            }

            const data = await response.json();
            this.mostrarFacturas(data.facturas);
            this.actualizarPaginacion(data.pagination);

        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar facturas', 'error');
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
                        <button class="btn btn-primary" onclick="sistemaFacturas.verFactura(${factura.id})" title="Ver Factura">
                            👁️
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
        document.getElementById('facturas-contenido').style.display = 'none';
        document.getElementById('empty-state').style.display = 'block';
    }

    mostrarLoading(mostrar) {
        document.getElementById('loading').style.display = mostrar ? 'block' : 'none';
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
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/facturas/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar factura');
            }

            const data = await response.json();
            this.mostrarDetalleFactura(data.factura);

        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al cargar los detalles de la factura', 'error');
        }
    }

    mostrarDetalleFactura(factura) {
        // Crear modal con detalles de la factura
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-contenido" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>📄 Factura ${factura.numero_factura}</h3>
                    <button class="btn-cerrar" onclick="this.closest('.modal').remove()">×</button>
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
                            ${factura.detalles.map(detalle => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #ddd;">${detalle.producto_codigo}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd;">${detalle.producto_nombre}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${detalle.cantidad}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${this.formatearPrecio(detalle.precio_unitario)}</td>
                                    <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${this.formatearPrecio(detalle.subtotal_linea)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div style="text-align: right; background: #f8f9fa; padding: 15px; border-radius: 8px;">
                        <p><strong>Subtotal: $${this.formatearPrecio(factura.subtotal)}</strong></p>
                        <p><strong>IVA: $${this.formatearPrecio(factura.iva)}</strong></p>
                        <p style="font-size: 18px; color: #007bff;"><strong>TOTAL: $${this.formatearPrecio(factura.total)}</strong></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-success" onclick="sistemaFacturas.imprimirFactura(${factura.id})">🖨️ Imprimir</button>
                    <button class="btn btn-warning" onclick="this.closest('.modal').remove()">❌ Cerrar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    async anularFactura(id) {
        const razon = prompt('¿Por qué desea anular esta factura?');
        if (!razon) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/facturas/${id}/anular`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ razon })
            });

            if (!response.ok) {
                throw new Error('Error al anular factura');
            }

            mostrarAlerta('Factura anulada exitosamente', 'success');
            this.cargarFacturas();

        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al anular la factura', 'error');
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
                throw new Error('Error al guardar configuración');
            }

            mostrarAlerta('Configuración de empresa guardada exitosamente', 'success');
            this.cerrarModalEmpresa();

        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta('Error al guardar la configuración', 'error');
        }
    }

    abrirConfiguracionEmpresa() {
        document.getElementById('modal-empresa').style.display = 'block';
    }

    cerrarModalEmpresa() {
        document.getElementById('modal-empresa').style.display = 'none';
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
}

// Funciones globales para los botones
function filtrarFacturas() {
    sistemaFacturas.filtrarFacturas();
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

// Inicializar sistema cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaFacturas = new SistemaFacturas();
});
