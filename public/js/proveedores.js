// ===== SISTEMA DE GESTIÓN DE PROVEEDORES - FERRETERÍA J&L =====

class SistemaProveedores {
    constructor() {
        this.proveedores = [];
        this.proveedorActual = null;
        this.paginaActual = 1;
        this.proveedoresPorPagina = 10;
        this.totalProveedores = 0;
        this.filtrosActivos = {
            documento: '',
            nombre: '',
            estado: 'activo'
        };
        this.init();
    }

    // ===== INICIALIZACIÓN =====
    init() {
        this.configurarEventListeners();
        this.cargarProveedores();
    }

    // ===== CONFIGURACIÓN DE EVENTOS =====
    configurarEventListeners() {
        // Botón nuevo proveedor
        const btnNuevo = document.querySelector('[data-action="nuevo-cliente"]');
        if (btnNuevo) {
            btnNuevo.addEventListener('click', () => this.abrirModalNuevo());
        }

        // Botones del modal
        const btnCerrarModal = document.querySelector('[data-action="cerrar-modal"]');
        if (btnCerrarModal) {
            btnCerrarModal.addEventListener('click', () => this.cerrarModal());
        }

        const botonCerrar = document.querySelector('.boton-cerrar');
        if (botonCerrar) {
            botonCerrar.addEventListener('click', () => this.cerrarModal());
        }

        // Formulario
        const formulario = document.getElementById('formulario-grid');
        if (formulario) {
            formulario.addEventListener('submit', (e) => this.guardarProveedor(e));
        }

        // Validación en tiempo real del NIT
        const nitInput = document.getElementById('numero-documento');
        if (nitInput) {
            nitInput.addEventListener('input', (e) => this.validarNITTiempoReal(e));
            // Comentado para evitar falsos positivos
            // nitInput.addEventListener('blur', (e) => this.verificarNITExistente(e));
        }

        // Filtros
        const filtroDocumento = document.getElementById('filtro-documento');
        const filtroNombre = document.getElementById('filtro-nombre');
        const filtroEstado = document.getElementById('filtro-estados');

        if (filtroDocumento) {
            filtroDocumento.addEventListener('input', (e) => this.aplicarFiltro('documento', e.target.value));
        }
        if (filtroNombre) {
            filtroNombre.addEventListener('input', (e) => this.aplicarFiltro('nombre', e.target.value));
        }
        if (filtroEstado) {
            filtroEstado.addEventListener('change', (e) => this.aplicarFiltro('estado', e.target.value));
        }

        // Limpiar filtros
        const btnLimpiar = document.querySelector('[data-action="limpiar-filtros"]');
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => this.limpiarFiltros());
        }

        // Cerrar modal con ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cerrarModal();
            }
        });

        // Cerrar modal al hacer click fuera
        const modal = document.getElementById('modal-proveedores');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.cerrarModal();
                }
            });
        }
    }

    // ===== GESTIÓN DE MODAL =====
    abrirModalNuevo() {
        this.proveedorActual = null;
        this.limpiarFormulario();
        document.getElementById('modal-titulo').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/>
            </svg>
            Nuevo Proveedor
        `;
        document.getElementById('btn-guardar-proveedor').textContent = 'Guardar Proveedor';
        this.mostrarModal();
    }

    abrirModalEditar(proveedor) {
        this.proveedorActual = proveedor;
        this.llenarFormulario(proveedor);
        document.getElementById('modal-titulo').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-737L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
            </svg>
            Editar Proveedor
        `;
        document.getElementById('btn-guardar-proveedor').textContent = 'Actualizar Proveedor';
        this.mostrarModal();
    }

    mostrarModal() {
        const modal = document.getElementById('modal-proveedores');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    cerrarModal() {
        const modal = document.getElementById('modal-proveedores');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        this.limpiarFormulario();
        this.proveedorActual = null;
    }

    // ===== GESTIÓN DE FORMULARIO =====
    limpiarFormulario() {
        const formulario = document.getElementById('formulario-grid');
        if (formulario) {
            formulario.reset();
            document.getElementById('proveedor-id').value = '';
            
            // Resetear a valores por defecto
            document.getElementById('tipo-documento').value = 'NIT';
            document.getElementById('estado').value = 'activo';
            
            // Limpiar errores de validación
            const inputs = formulario.querySelectorAll('input, select, textarea');
            inputs.forEach(input => this.limpiarErrorInput(input));
        }
    }

    llenarFormulario(proveedor) {
        document.getElementById('proveedor-id').value = proveedor.id || '';
        document.getElementById('tipo-documento').value = proveedor.tipo_documento || 'NIT';
        document.getElementById('numero-documento').value = proveedor.numero_documento || '';
        document.getElementById('nombre').value = proveedor.nombre || '';
        document.getElementById('telefono').value = proveedor.telefono || '';
        document.getElementById('email').value = proveedor.email || '';
        document.getElementById('ciudad').value = proveedor.ciudad || '';
        document.getElementById('direccion').value = proveedor.direccion || '';
        document.getElementById('estado').value = proveedor.estado || 'activo';
        document.getElementById('nota').value = proveedor.nota || '';
    }

    async guardarProveedor(evento) {
        evento.preventDefault();
        
        const formulario = evento.target;
        const formData = new FormData(formulario);
        
        const proveedor = {
            tipo_documento: formData.get('tipo-documento'),
            numero_documento: formData.get('numero-documento'),
            nombre: formData.get('nombre'),
            telefono: formData.get('telefono'),
            email: formData.get('email'),
            ciudad: formData.get('ciudad'),
            direccion: formData.get('direccion'),
            estado: formData.get('estado'),
            nota: formData.get('nota')
        };

        // Validaciones
        if (!this.validarProveedor(proveedor)) {
            return;
        }

        try {
            const botonGuardar = document.getElementById('btn-guardar-proveedor');
            const textoOriginal = botonGuardar.textContent;
            botonGuardar.textContent = 'Guardando...';
            botonGuardar.disabled = true;

            let resultado;
            if (this.proveedorActual) {
                // Editar proveedor existente
                proveedor.id = this.proveedorActual.id;
                resultado = await this.actualizarProveedor(proveedor);
            } else {
                // Crear nuevo proveedor
                resultado = await this.crearProveedor(proveedor);
            }

            if (resultado.exito) {
                this.mostrarAlerta(resultado.mensaje, 'success');
                this.cerrarModal();
                this.cargarProveedores();
            } else {
                this.mostrarAlerta(resultado.mensaje, 'error');
            }

        } catch (error) {
            console.error('Error al guardar proveedor:', error);
            this.mostrarAlerta('Error al guardar el proveedor', 'error');
        } finally {
            const botonGuardar = document.getElementById('btn-guardar-proveedor');
            botonGuardar.textContent = this.proveedorActual ? 'Actualizar Proveedor' : 'Guardar Proveedor';
            botonGuardar.disabled = false;
        }
    }

    validarProveedor(proveedor) {
        // NIT/Documento es opcional - solo validar formato si está presente
        if (proveedor.numero_documento && proveedor.numero_documento.trim()) {
            const nitRegex = /^[0-9\-]+$/;
            if (!nitRegex.test(proveedor.numero_documento)) {
                this.mostrarAlerta('El NIT debe contener solo números y guiones', 'error');
                return false;
            }
        }

        // Validar campos requeridos
        if (!proveedor.nombre.trim()) {
            this.mostrarAlerta('El nombre del proveedor es requerido', 'error');
            return false;
        }
        if (!proveedor.telefono.trim()) {
            this.mostrarAlerta('El teléfono es requerido', 'error');
            return false;
        }
        if (!proveedor.email.trim()) {
            this.mostrarAlerta('El email es requerido', 'error');
            return false;
        }
        if (!proveedor.ciudad.trim()) {
            this.mostrarAlerta('La ciudad es requerida', 'error');
            return false;
        }
        if (!proveedor.direccion.trim()) {
            this.mostrarAlerta('La dirección es requerida', 'error');
            return false;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(proveedor.email)) {
            this.mostrarAlerta('El formato del email no es válido', 'error');
            return false;
        }

        // Validar teléfono (solo números y caracteres especiales básicos)
        const telefonoRegex = /^[0-9+\-\s()]+$/;
        if (!telefonoRegex.test(proveedor.telefono)) {
            this.mostrarAlerta('El formato del teléfono no es válido', 'error');
            return false;
        }

        return true;
    }

    // ===== API CALLS =====
    async cargarProveedores() {
        try {
            this.mostrarCargando(true);
            
            // Construir parámetros de consulta
            const params = new URLSearchParams({
                page: this.paginaActual,
                limit: this.proveedoresPorPagina
            });

            // Agregar filtros activos
            if (this.filtrosActivos.documento) {
                params.append('documento', this.filtrosActivos.documento);
            }
            if (this.filtrosActivos.nombre) {
                params.append('nombre', this.filtrosActivos.nombre);
            }
            if (this.filtrosActivos.estado && this.filtrosActivos.estado !== 'todos') {
                params.append('estado', this.filtrosActivos.estado);
            }

            const response = await fetch(`/api/proveedores?${params}`);
            const datos = await response.json();
            
            if (datos.exito) {
                this.proveedores = datos.proveedores;
                this.totalProveedores = datos.paginacion.total;
                this.renderizarTabla();
                this.renderizarPaginacion();
            } else {
                throw new Error(datos.mensaje);
            }
            
        } catch (error) {
            console.error('Error al cargar proveedores:', error);
            this.mostrarAlerta('Error al cargar los proveedores: ' + error.message, 'error');
        } finally {
            this.mostrarCargando(false);
        }
    }

    async crearProveedor(proveedor) {
        try {
            const response = await fetch('/api/proveedores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(proveedor)
            });

            const resultado = await response.json();
            
            // Manejar diferentes tipos de respuesta
            if (!response.ok) {
                return {
                    exito: false,
                    mensaje: resultado.mensaje || `Error del servidor: ${response.status}`
                };
            }

            return {
                exito: resultado.exito,
                mensaje: resultado.mensaje
            };

        } catch (error) {
            console.error('Error al crear proveedor:', error);
            return {
                exito: false,
                mensaje: 'Error de conexión: ' + error.message
            };
        }
    }

    async actualizarProveedor(proveedor) {
        try {
            const response = await fetch(`/api/proveedores/${proveedor.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(proveedor)
            });

            const resultado = await response.json();
            
            // Manejar diferentes tipos de respuesta
            if (!response.ok) {
                return {
                    exito: false,
                    mensaje: resultado.mensaje || `Error del servidor: ${response.status}`
                };
            }

            return {
                exito: resultado.exito,
                mensaje: resultado.mensaje
            };

        } catch (error) {
            console.error('Error al actualizar proveedor:', error);
            return {
                exito: false,
                mensaje: 'Error de conexión: ' + error.message
            };
        }
    }

    async eliminarProveedor(id) {
        // Usar el sistema de confirmación personalizado
        try {
            let confirmar = false;
            
            if (window.customAlert && typeof window.customAlert.confirm === 'function') {
                confirmar = await window.customAlert.confirm(
                    '¿Está seguro de que desea eliminar este proveedor?',
                    'Confirmar eliminación'
                );
            } else {
                // Fallback al confirm nativo si no está disponible
                confirmar = confirm('¿Está seguro de que desea eliminar este proveedor?');
            }
            
            if (!confirmar) {
                return;
            }

            const response = await fetch(`/api/proveedores/${id}`, {
                method: 'DELETE'
            });

            const resultado = await response.json();
            
            if (resultado.exito) {
                this.mostrarAlerta(resultado.mensaje, 'success');
                this.cargarProveedores();
            } else {
                this.mostrarAlerta(resultado.mensaje, 'error');
            }

        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            this.mostrarAlerta('Error al eliminar el proveedor: ' + error.message, 'error');
        }
    }

    // ===== FILTROS Y BÚSQUEDA =====
    aplicarFiltro(tipo, valor) {
        this.filtrosActivos[tipo] = valor.toLowerCase();
        this.paginaActual = 1; // Resetear a primera página
        this.cargarProveedores(); // Cargar desde el servidor con filtros
    }

    limpiarFiltros() {
        this.filtrosActivos = {
            documento: '',
            nombre: '',
            estado: 'todos'
        };
        
        document.getElementById('filtro-documento').value = '';
        document.getElementById('filtro-nombre').value = '';
        document.getElementById('filtro-estados').value = 'todos';
        
        this.paginaActual = 1;
        this.cargarProveedores(); // Recargar sin filtros
    }

    obtenerProveedoresFiltrados() {
        // Esta función ya no es necesaria porque el filtrado se hace en el servidor
        return this.proveedores;
    }

    // ===== RENDERIZACIÓN =====
    renderizarTabla() {
        const tbody = document.getElementById('tbody-clientes');
        
        if (this.proveedores.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center" style="padding: 40px; color: #6c757d;">
                        No se encontraron proveedores
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.proveedores.map(proveedor => `
            <tr>
                <td>${proveedor.numero_documento}</td>
                <td>${proveedor.nombre}</td>
                <td>${proveedor.telefono}</td>
                <td>${proveedor.email}</td>
                <td>${proveedor.ciudad}</td>
                <td>
                    <span class="estado-badge estado-${proveedor.estado}">
                        ${proveedor.estado}
                    </span>
                </td>
                <td>${this.formatearFecha(proveedor.fecha_registro)}</td>
                <td>
                    <div class="acciones-tabla">
                        <button class="btn-accion btn-editar" onclick="sistemaProveedores.abrirModalEditar(${JSON.stringify(proveedor).replace(/"/g, '&quot;')})" title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-737L290-120H120Z"/>
                            </svg>
                        </button>
                        <button class="btn-accion btn-eliminar" onclick="sistemaProveedores.eliminarProveedor(${proveedor.id})" title="Eliminar">
                            <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderizarPaginacion() {
        const contenedor = document.getElementById('paginacion-clientes');
        const totalPaginas = Math.ceil(this.totalProveedores / this.proveedoresPorPagina);

        if (totalPaginas <= 1) {
            contenedor.innerHTML = '';
            return;
        }

        let html = `
            <button class="btn-paginacion ${this.paginaActual === 1 ? 'disabled' : ''}" 
                    onclick="sistemaProveedores.cambiarPagina(${this.paginaActual - 1})"
                    ${this.paginaActual === 1 ? 'disabled' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                    <path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/>
                </svg>
            </button>
        `;

        // Mostrar páginas alrededor de la actual
        const rango = 2; // Páginas a cada lado de la actual
        let inicio = Math.max(1, this.paginaActual - rango);
        let fin = Math.min(totalPaginas, this.paginaActual + rango);

        if (inicio > 1) {
            html += `<button class="btn-paginacion" onclick="sistemaProveedores.cambiarPagina(1)">1</button>`;
            if (inicio > 2) {
                html += `<span style="padding: 0 8px;">...</span>`;
            }
        }

        for (let i = inicio; i <= fin; i++) {
            html += `
                <button class="btn-paginacion ${i === this.paginaActual ? 'active' : ''}" 
                        onclick="sistemaProveedores.cambiarPagina(${i})">
                    ${i}
                </button>
            `;
        }

        if (fin < totalPaginas) {
            if (fin < totalPaginas - 1) {
                html += `<span style="padding: 0 8px;">...</span>`;
            }
            html += `<button class="btn-paginacion" onclick="sistemaProveedores.cambiarPagina(${totalPaginas})">${totalPaginas}</button>`;
        }

        html += `
            <button class="btn-paginacion ${this.paginaActual === totalPaginas ? 'disabled' : ''}" 
                    onclick="sistemaProveedores.cambiarPagina(${this.paginaActual + 1})"
                    ${this.paginaActual === totalPaginas ? 'disabled' : ''}>
                <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                    <path d="m384-240-56-56 184-184-184-184 56-56 240 240-240 240Z"/>
                </svg>
            </button>
        `;

        contenedor.innerHTML = html;
    }

    cambiarPagina(pagina) {
        const totalPaginas = Math.ceil(this.totalProveedores / this.proveedoresPorPagina);
        
        if (pagina >= 1 && pagina <= totalPaginas) {
            this.paginaActual = pagina;
            this.cargarProveedores(); // Recargar desde el servidor
        }
    }

    // ===== UTILIDADES =====
    mostrarCargando(mostrar) {
        const tbody = document.getElementById('tbody-clientes');
        if (mostrar) {
            tbody.innerHTML = `
                <tr class="fila-cargando">
                    <td colspan="8" class="text-center">
                        <div class="spinner-carga">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z"/>
                            </svg>
                            Cargando proveedores...
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    mostrarAlerta(mensaje, tipo = 'info') {
        // Usar el sistema de alertas personalizado
        if (window.customAlert && typeof window.customAlert.alert === 'function') {
            window.customAlert.alert(mensaje, 'Información', tipo);
        } else {
            // Fallback básico
            alert(mensaje);
        }
    }

    formatearFecha(fecha) {
        if (!fecha) return 'N/A';
        const opciones = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Date(fecha).toLocaleDateString('es-ES', opciones);
    }

    // ===== VALIDACIONES EN TIEMPO REAL =====
    validarNITTiempoReal(event) {
        const input = event.target;
        const valor = input.value;
        
        // Limpiar caracteres no válidos
        const valorLimpio = valor.replace(/[^0-9\-]/g, '');
        
        if (valor !== valorLimpio) {
            input.value = valorLimpio;
        }
        
        // Quitar cualquier mensaje de error anterior
        this.limpiarErrorInput(input);
    }

    async verificarNITExistente(event) {
        const input = event.target;
        const nit = input.value.trim();
        
        // Solo verificar NITs con longitud mínima y formato válido
        if (!nit || nit.length < 8) return;
        
        try {
            // Solo verificar si estamos creando (no editando)
            if (!this.proveedorActual) {
                const response = await fetch(`/api/proveedores?documento=${encodeURIComponent(nit)}&limit=1`);
                
                if (!response.ok) {
                    return; // Si hay error, no mostrar mensaje de duplicado
                }
                
                const resultado = await response.json();
                
                if (resultado.exito && resultado.proveedores && resultado.proveedores.length > 0) {
                    // Verificar que realmente coincida exactamente
                    const proveedorEncontrado = resultado.proveedores.find(p => p.numero_documento === nit);
                    if (proveedorEncontrado) {
                        this.mostrarErrorInput(input, `Ya existe un proveedor con este NIT: ${proveedorEncontrado.nombre}`);
                    }
                }
            }
        } catch (error) {
            // En caso de error, no mostrar mensaje de duplicado
        }
    }

    mostrarErrorInput(input, mensaje) {
        this.limpiarErrorInput(input);
        
        input.style.borderColor = '#dc3545';
        input.style.backgroundColor = '#fff5f5';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'input-error-message';
        errorDiv.style.cssText = `
            color: #dc3545;
            font-size: 12px;
            margin-top: 4px;
            display: block;
        `;
        errorDiv.textContent = mensaje;
        
        input.parentNode.appendChild(errorDiv);
    }

    limpiarErrorInput(input) {
        input.style.borderColor = '';
        input.style.backgroundColor = '';
        
        const errorMsg = input.parentNode.querySelector('.input-error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    }
}

// Inicializar el sistema cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaProveedores = new SistemaProveedores();
    
    // Hacer funciones disponibles globalmente
    window.cerrarModal = () => window.sistemaProveedores.cerrarModal();
});