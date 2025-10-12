//==== configuraciones y variables globales ====//

let clientesData = [];
let clientesFiltrados = [];
let paginaActual = 1;
let clientesPorPagina = 10;
let clienteEditando = null;

//==== elementos del DOM ====//
const elements = {
    //filtros
    filtroDocumento: document.getElementById('filtro-documento'),
    filtroNombre: document.getElementById('filtro-nombre'),
    filtroEstado: document.getElementById('filtro-estados'),

    //tabla
    tablaClientes: document.getElementById('tabla-clientes'),
    tbodyClientes: document.getElementById('tbody-clientes'),
    paginacionClientes: document.getElementById('paginacion-clientes'),

    //modal 
    modalCliente: document.getElementById('modal-cliente'),
    modalConfirmacion: document.getElementById('modal-confirmacion'),

    //formulario
    formCliente: document.getElementById('formulario-grid'),
    modalTitulo: document.getElementById('modal-titulo'),

    //campos del formulario
    clienteId: document.getElementById('cliente-id'),
    tipoDocumento: document.getElementById('tipo-documento'),
    numeroDocumento: document.getElementById('numero-documento'),
    nombre: document.getElementById('nombre'),
    apellido: document.getElementById('apellido'),
    telefono: document.getElementById('telefono'),
    email: document.getElementById('email'),
    direccion: document.getElementById('direccion'),
    ciudad: document.getElementById('ciudad'),
    fechaNacimiento: document.getElementById('fecha-nacimiento'),
    estado: document.getElementById('estado'),
    notas: document.getElementById('notas'),

    //botones 
    btnNuevoCliente: document.querySelector('[data-action="nuevo-cliente"]'),
    btnLimpiarFiltros: document.querySelector('[data-action="limpiar-filtros"]'),
    btnCerrarModal: document.querySelectorAll('[data-action="cerrar-modal"]'),
    btnGuardarCliente: document.querySelector('[data-action="guardar-cliente"]'),
    btnCancelarConfirmacion: document.querySelector('[data-action="cancelar-confirmacion"]'),
    btnConfirmarAccion: document.querySelector('[data-action="confirmar-accion"]'),
    
//mensajes
    mensajeConfirmacion: document.getElementById('mensaje-confirmacion')
};

//==== inicialización ====//
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Inicializando página de clientes...');
    
    inicializarEventListeners();
    cargarClientes();
});

//==== eventos de los botones y formularios ====//
function inicializarEventListeners() {
    // boton nuevo cliente
    if (elements.btnNuevoCliente) {
        console.log('✅ Botón nuevo cliente encontrado:', elements.btnNuevoCliente);
        elements.btnNuevoCliente.addEventListener('click', function(e) {
            console.log('🖱️ Click en botón nuevo cliente');
            e.preventDefault();
            abrirModalNuevoCliente();
        });
    } else {
        console.error('❌ No se encontró el botón nuevo cliente');
    }

    // Filtros
    if (elements.filtroDocumento) {
        elements.filtroDocumento.addEventListener('input', debounce(aplicarFiltros, 300));
    }
    
    if (elements.filtroNombre) {
        elements.filtroNombre.addEventListener('input', debounce(aplicarFiltros, 300));
    }
    
    if (elements.filtroEstado) {
        elements.filtroEstado.addEventListener('change', aplicarFiltros);
    }
    
    // Botón limpiar filtros
    if (elements.btnLimpiarFiltros) {
        elements.btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
    }
    
    // Botones cerrar modal
    elements.btnCerrarModal.forEach(btn => {
        btn.addEventListener('click', cerrarModal);
    });
    
    // Formulario de cliente
    if (elements.formCliente) {
        elements.formCliente.addEventListener('submit', guardarCliente);
    }
    
    // Modal overlay (cerrar al hacer click fuera)
    if (elements.modalCliente) {
        elements.modalCliente.addEventListener('click', function(e) {
            if (e.target === elements.modalCliente) {
                cerrarModal();
            }
        });
    }
    
    if (elements.modalConfirmacion) {
        elements.modalConfirmacion.addEventListener('click', function(e) {
            if (e.target === elements.modalConfirmacion) {
                cerrarModalConfirmacion();
            }
        });
    }
    
    // Botones de confirmación
    if (elements.btnCancelarConfirmacion) {
        elements.btnCancelarConfirmacion.addEventListener('click', cerrarModalConfirmacion);
    }
    
    // Tecla ESC para cerrar modales
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            cerrarModal();
            cerrarModalConfirmacion();
        }
    });


    
    console.log('✅ Event listeners inicializados');
}

// ===== FUNCIONES PRINCIPALES =====

// Cargar clientes desde el servidor
async function cargarClientes() {
    try {
        mostrarCargando();
        
        const response = await fetch('/api/clientes');
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            clientesData = data.clientes || [];
            clientesFiltrados = [...clientesData];
            
            console.log(`📊 ${clientesData.length} clientes cargados`);
            
            aplicarFiltros();
            mostrarClientes();
            actualizarPaginacion();
        } else {
            throw new Error(data.message || 'Error al cargar clientes');
        }
        
    } catch (error) {
        console.error('❌ Error al cargar clientes:', error);
        mostrarError('Error al cargar los clientes: ' + error.message);
        mostrarTablaVacia('Error al cargar los datos');
    }
}

// Mostrar clientes en la tabla
function mostrarClientes() {
    const inicio = (paginaActual - 1) * clientesPorPagina;
    const fin = inicio + clientesPorPagina;
    const clientesPagina = clientesFiltrados.slice(inicio, fin);
    
    if (clientesPagina.length === 0) {
        mostrarTablaVacia();
        return;
    }
    
    const html = clientesPagina.map(cliente => `
        <tr>
            <td>
                <strong>${cliente.tipo_documento}</strong><br>
                ${cliente.numero_documento}
            </td>
            <td>
                <strong>${cliente.nombre} ${cliente.apellido || ''}</strong>
            </td>
            <td>${cliente.telefono || '-'}</td>
            <td>${cliente.email || '-'}</td>
            <td>${cliente.ciudad || '-'}</td>
            <td>
                <span class="estado-badge estado-${cliente.estado}">
                    ${formatearEstado(cliente.estado)}
                </span>
            </td>
            <td>${formatearFecha(cliente.fecha_creacion)}</td>
            <td>
                <div class="acciones-grupo">
                    <button class="boton boton-info boton-sm" 
                            onclick="editarCliente(${cliente.id})" 
                            title="Editar cliente">
                        <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
                        </svg>
                        Editar
                    </button>
                    <button class="boton boton-warning boton-sm" 
                            onclick="console.log('🖱️ Botón de estado clickeado para cliente:', ${cliente.id}); cambiarEstadoCliente(${cliente.id}, '${cliente.estado === 'activo' ? 'inactivo' : 'activo'}')" 
                            title="${cliente.estado === 'activo' ? 'Desactivar' : 'Activar'} cliente">
                        <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                            <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
                        </svg>
                        ${cliente.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="boton boton-peligro boton-sm" 
                            onclick="eliminarCliente(${cliente.id})" 
                            title="Eliminar cliente">
                        <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                            <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
                        </svg>
                        Eliminar
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    elements.tbodyClientes.innerHTML = html;
}

// Mostrar estado de carga
function mostrarCargando() {
    elements.tbodyClientes.innerHTML = `
        <tr class="fila-cargando">
            <td colspan="8" class="text-center">
                <div class="spinner-carga">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                        <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z"/>
                    </svg>
                    Cargando clientes...
                </div>
            </td>
        </tr>
    `;
}

// Mostrar tabla vacía
function mostrarTablaVacia(mensaje = 'No se encontraron clientes') {
    elements.tbodyClientes.innerHTML = `
        <tr>
            <td colspan="8" class="text-center" style="padding: 50px;">
                <div style="color: #6c757d; font-size: 16px;">
                    <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="currentColor" style="margin-bottom: 15px;">
                        <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/>
                    </svg><br>
                    <strong>${mensaje}</strong><br>
                    <small>Los clientes aparecerán aquí una vez que los agregues</small>
                </div>
            </td>
        </tr>
    `;
}

// ===== FUNCIONES DE FILTROS =====
function aplicarFiltros() {
    const documento = elements.filtroDocumento.value.toLowerCase().trim();
    const nombre = elements.filtroNombre.value.toLowerCase().trim();
    const estado = elements.filtroEstado.value;
    

    
    clientesFiltrados = clientesData.filter(cliente => {
        const cumpleDocumento = !documento || 
            cliente.numero_documento.toLowerCase().includes(documento);
        
        const cumpleNombre = !nombre || 
            `${cliente.nombre} ${cliente.apellido || ''}`.toLowerCase().includes(nombre);
        
        // Usar el campo estado que ya viene mapeado del backend
        let cumpleEstado = false;
        if (estado === 'todos') {
            cumpleEstado = true;
        } else if (estado === 'suspendido') {
            // Por ahora tratamos suspendido como inactivo
            cumpleEstado = cliente.estado === 'inactivo';
        } else {
            // Para 'activo' e 'inactivo' comparamos directamente
            cumpleEstado = cliente.estado === estado;
        }
        
        return cumpleDocumento && cumpleNombre && cumpleEstado;
    });
    
    paginaActual = 1;
    mostrarClientes();
    actualizarPaginacion();
    
    console.log(`🔍 Filtros aplicados: ${clientesFiltrados.length} de ${clientesData.length} clientes`);
}

function limpiarFiltros() {
    elements.filtroDocumento.value = '';
    elements.filtroNombre.value = '';
    elements.filtroEstado.value = 'activo';
    
    aplicarFiltros();
    
    mostrarExito('Filtros limpiados correctamente');
}

// ===== FUNCIONES DE PAGINACIÓN =====
function actualizarPaginacion() {
    const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
    const inicio = (paginaActual - 1) * clientesPorPagina + 1;
    const fin = Math.min(paginaActual * clientesPorPagina, clientesFiltrados.length);
    
    if (totalPaginas <= 1) {
        elements.paginacionClientes.innerHTML = '';
        return;
    }
    
    let html = `
        <div class="paginacion-info">
            Mostrando ${inicio} - ${fin} de ${clientesFiltrados.length} clientes
        </div>
        <div class="paginacion-controles">
    `;
    
    // Botón anterior
    html += `
        <button class="paginacion-btn" ${paginaActual === 1 ? 'disabled' : ''} 
                onclick="cambiarPagina(${paginaActual - 1})">
            ‹ Anterior
        </button>
    `;
    
    // Números de página
    const rango = 2;
    let inicioRango = Math.max(1, paginaActual - rango);
    let finRango = Math.min(totalPaginas, paginaActual + rango);
    
    if (inicioRango > 1) {
        html += `<button class="paginacion-btn" onclick="cambiarPagina(1)">1</button>`;
        if (inicioRango > 2) {
            html += `<span style="padding: 10px;">...</span>`;
        }
    }
    
    for (let i = inicioRango; i <= finRango; i++) {
        html += `
            <button class="paginacion-btn ${i === paginaActual ? 'activo' : ''}" 
                    onclick="cambiarPagina(${i})">
                ${i}
            </button>
        `;
    }
    
    if (finRango < totalPaginas) {
        if (finRango < totalPaginas - 1) {
            html += `<span style="padding: 10px;">...</span>`;
        }
        html += `<button class="paginacion-btn" onclick="cambiarPagina(${totalPaginas})">${totalPaginas}</button>`;
    }
    
    // Botón siguiente
    html += `
        <button class="paginacion-btn" ${paginaActual === totalPaginas ? 'disabled' : ''} 
                onclick="cambiarPagina(${paginaActual + 1})">
            Siguiente ›
        </button>
    `;
    
    html += '</div>';
    elements.paginacionClientes.innerHTML = html;
}

function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(clientesFiltrados.length / clientesPorPagina);
    
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActual = nuevaPagina;
        mostrarClientes();
        actualizarPaginacion();
        
        // Scroll suave hacia arriba
        document.querySelector('.tabla-contenedor').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// ===== FUNCIONES DE MODAL =====
function abrirModalNuevoCliente() {
    console.log('🔄 Abriendo modal nuevo cliente...');
    
    clienteEditando = null;
    
    if (!elements.modalTitulo) {
        console.error('❌ No se encontró el elemento modal-titulo');
        return;
    }
    
    elements.modalTitulo.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
            <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Z"/>
        </svg>
        Nuevo Cliente
    `;
    
    limpiarFormulario();
    
    // El campo de estado siempre está visible en el formulario
    
    if (elements.btnGuardarCliente) {
        elements.btnGuardarCliente.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                <path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/>
            </svg>
            Guardar Cliente
        `;
    }
    
    abrirModal(elements.modalCliente);
    console.log('✅ Modal abierto correctamente');
}

function abrirModal(modal) {
    console.log('🔄 Abriendo modal...', modal);
    
    if (!modal) {
        console.error('❌ Modal no encontrado');
        return;
    }
    
    modal.classList.add('mostrar');
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal mostrado, clases:', modal.classList.toString());
}

function cerrarModal() {
    elements.modalCliente.classList.remove('mostrar');
    document.body.style.overflow = '';
    
    setTimeout(() => {
        limpiarFormulario();
    }, 300);
}

function cerrarModalConfirmacion() {
    elements.modalConfirmacion.classList.remove('mostrar');
    document.body.style.overflow = '';
}

// ===== FUNCIONES DE FORMULARIO =====
function limpiarFormulario() {
    elements.formCliente.reset();
    elements.clienteId.value = '';
    elements.tipoDocumento.value = 'CC';
    
    // Limpiar clases de error
    const campos = elements.formCliente.querySelectorAll('.campo-grupo input, .campo-grupo select, .campo-grupo textarea');
    campos.forEach(campo => {
        campo.classList.remove('error');
    });
}

async function guardarCliente(e) {
    e.preventDefault();
    
    if (!validarFormulario()) {
        return;
    }
    
    const formData = new FormData(elements.formCliente);
    const clienteData = {
        tipo_documento: formData.get('tipo-documento'),
        numero_documento: formData.get('numero-documento'),
        nombre: formData.get('nombre'),
        apellido: formData.get('apellido') || null,
        telefono: formData.get('telefono') || null,
        email: formData.get('email') || null,
        direccion: formData.get('direccion') || null,
        ciudad: formData.get('ciudad') || null,
        fecha_nacimiento: formData.get('fecha-nacimiento') || null,
        estado: formData.get('estado') || 'activo',
        notas: formData.get('notas') || null
    };
    
    try {
        elements.btnGuardarCliente.disabled = true;
        elements.btnGuardarCliente.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                <path d="M480-80q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-155.5t86-127Q252-817 325-848.5T480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480-80Z"/>
            </svg>
            Guardando...
        `;
        
        const esEdicion = !!elements.clienteId.value;
        const url = esEdicion ? `/api/clientes/${elements.clienteId.value}` : '/api/clientes';
        const method = esEdicion ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clienteData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            cerrarModal();
            cargarClientes();
            
            mostrarExito(esEdicion ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente');
            
            console.log(`✅ Cliente ${esEdicion ? 'actualizado' : 'creado'}:`, result.cliente);
        } else {
            throw new Error(result.message || 'Error al guardar el cliente');
        }
        
    } catch (error) {
        console.error('❌ Error al guardar cliente:', error);
        mostrarError('Error al guardar el cliente: ' + error.message);
    } finally {
        elements.btnGuardarCliente.disabled = false;
        elements.btnGuardarCliente.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                <path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/>
            </svg>
            Guardar Cliente
        `;
    }
}

function validarFormulario() {
    let esValido = true;
    
    // Validar documento
    if (!elements.numeroDocumento.value.trim()) {
        mostrarErrorCampo(elements.numeroDocumento, 'El número de documento es requerido');
        esValido = false;
    } else {
        limpiarErrorCampo(elements.numeroDocumento);
    }
    
    // Validar nombre
    if (!elements.nombre.value.trim()) {
        mostrarErrorCampo(elements.nombre, 'El nombre es requerido');
        esValido = false;
    } else {
        limpiarErrorCampo(elements.nombre);
    }
    
    // Validar email si se proporciona
    if (elements.email.value && !validarEmail(elements.email.value)) {
        mostrarErrorCampo(elements.email, 'El email no tiene un formato válido');
        esValido = false;
    } else {
        limpiarErrorCampo(elements.email);
    }
    
    return esValido;
}

function mostrarErrorCampo(campo, mensaje) {
    campo.classList.add('error');
    campo.style.borderColor = '#dc3545';
    campo.title = mensaje;
}

function limpiarErrorCampo(campo) {
    campo.classList.remove('error');
    campo.style.borderColor = '';
    campo.title = '';
}

// ===== FUNCIONES DE ACCIONES =====
async function editarCliente(id) {
    try {
        console.log(`🔍 Editando cliente con ID: ${id}`);
        
        // Primero buscar en los datos locales
        let cliente = clientesData.find(c => c.id === parseInt(id));
        
        // Si no se encuentra localmente, cargar desde la API
        if (!cliente) {
            console.log('📡 Cliente no encontrado localmente, cargando desde API...');
            
            const response = await fetch(`/api/clientes/${id}`);
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error al cargar cliente');
            }
            
            cliente = data.cliente;
        }
        
        if (!cliente) {
            mostrarError('Cliente no encontrado');
            return;
        }
        
        console.log('✅ Cliente encontrado:', cliente);
        console.log('🔍 Campos disponibles:', Object.keys(cliente));
        clienteEditando = cliente;
        
        // Verificar que todos los elementos del formulario existan
        const elementosFaltantes = [];
        if (!elements.clienteId) elementosFaltantes.push('cliente-id');
        if (!elements.tipoDocumento) elementosFaltantes.push('tipo-documento');
        if (!elements.numeroDocumento) elementosFaltantes.push('numero-documento');
        if (!elements.nombre) elementosFaltantes.push('nombre');
        if (!elements.apellido) elementosFaltantes.push('apellido');
        
        if (elementosFaltantes.length > 0) {
            console.error('❌ Elementos del formulario no encontrados:', elementosFaltantes);
            throw new Error(`Elementos del formulario faltantes: ${elementosFaltantes.join(', ')}`);
        }
        
        console.log('✅ Todos los elementos del formulario encontrados');
        
        // Llenar formulario con validación de campos
        elements.clienteId.value = cliente.id || '';
        elements.tipoDocumento.value = cliente.tipo_documento || 'CC';
        elements.numeroDocumento.value = cliente.numero_documento || '';
        elements.nombre.value = cliente.nombre || '';
        elements.apellido.value = cliente.apellido || '';
        
        if (elements.telefono) elements.telefono.value = cliente.telefono || '';
        if (elements.email) elements.email.value = cliente.email || '';
        if (elements.direccion) elements.direccion.value = cliente.direccion || '';
        if (elements.ciudad) elements.ciudad.value = cliente.ciudad || '';
        if (elements.fechaNacimiento) {
            // Formatear fecha para input date
            if (cliente.fecha_nacimiento) {
                const fecha = new Date(cliente.fecha_nacimiento);
                if (!isNaN(fecha)) {
                    elements.fechaNacimiento.value = fecha.toISOString().split('T')[0];
                }
            } else {
                elements.fechaNacimiento.value = '';
            }
        }
        if (elements.estado) elements.estado.value = cliente.estado || 'activo';
        if (elements.notas) elements.notas.value = cliente.notas || '';
        
        console.log('✅ Formulario llenado correctamente');
        
        // El campo de estado ya está visible en el formulario
        
        // Cambiar título del modal
        elements.modalTitulo.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
            </svg>
            Editar Cliente
        `;
        
        elements.btnGuardarCliente.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                <path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/>
            </svg>
            Actualizar Cliente
        `;
        
        // Mostrar modal
        console.log('📱 Abriendo modal de edición...');
        abrirModal(elements.modalCliente);
        
    } catch (error) {
        console.error('❌ Error al editar cliente:', error);
        console.error('💥 Stack trace:', error.stack);
        mostrarError('Error al cargar los datos del cliente: ' + error.message);
    }
}

async function cambiarEstadoCliente(id, nuevoEstado) {
    console.log(`🔄 FUNCIÓN CAMBIAR ESTADO LLAMADA:`);
    console.log(`   - ID: ${id} (tipo: ${typeof id})`);
    console.log(`   - Nuevo estado: ${nuevoEstado}`);
    console.log(`   - Total clientes en memoria: ${clientesData.length}`);
    
    const cliente = clientesData.find(c => c.id === parseInt(id));
    
    if (!cliente) {
        console.error(`❌ Cliente con ID ${id} no encontrado en clientesData`);
        mostrarError('Cliente no encontrado');
        return;
    }
    
    console.log('✅ Cliente encontrado:', cliente);
    const accion = nuevoEstado === 'activo' ? 'activar' : 'desactivar';
    
    // Verificar elementos del modal
    if (!elements.mensajeConfirmacion) {
        console.error('❌ Elemento mensajeConfirmacion no encontrado');
        mostrarError('Error en el modal de confirmación');
        return;
    }
    
    if (!elements.btnConfirmarAccion) {
        console.error('❌ Elemento btnConfirmarAccion no encontrado');
        mostrarError('Error en el botón de confirmación');
        return;
    }
    
    elements.mensajeConfirmacion.textContent = 
        `¿Estás seguro de que deseas ${accion} al cliente ${cliente.nombre} ${cliente.apellido || ''}?`;
    
    elements.btnConfirmarAccion.onclick = async function() {
        try {
            const activoValue = nuevoEstado === 'activo';
            console.log(`🔄 Cambiando estado del cliente ${id} a: ${nuevoEstado} (activo: ${activoValue})`);
            
            const response = await fetch(`/api/clientes/${id}/estado`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ activo: activoValue })
            });
            
            const result = await response.json();
            
            console.log('📡 Respuesta del servidor:', result);
            
            if (response.ok && result.success) {
                console.log(`✅ Estado cambiado exitosamente a: ${nuevoEstado}`);
                cerrarModalConfirmacion();
                cargarClientes();
                
                mostrarExito(`Cliente ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`);
            } else {
                console.error('❌ Error en la respuesta del servidor:', result);
                throw new Error(result.message || `Error al ${accion} el cliente`);
            }
            
        } catch (error) {
            console.error(`❌ Error al ${accion} cliente:`, error);
            mostrarError(`Error al ${accion} el cliente: ` + error.message);
            cerrarModalConfirmacion();
        }
    };
    
    abrirModal(elements.modalConfirmacion);
}

function eliminarCliente(id) {
    const cliente = clientesData.find(c => c.id === id);
    
    if (!cliente) {
        mostrarError('Cliente no encontrado');
        return;
    }
    
    elements.mensajeConfirmacion.innerHTML = 
        `¿Estás seguro de que deseas eliminar al cliente <strong>${cliente.nombre} ${cliente.apellido || ''}</strong>?<br><br>
        <small style="color: #dc3545;">Esta acción no se puede deshacer.</small>`;
    
    elements.btnConfirmarAccion.onclick = async function() {
        try {
            const response = await fetch(`/api/clientes/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                cerrarModalConfirmacion();
                cargarClientes();
                
                mostrarExito('Cliente eliminado correctamente');
            } else {
                throw new Error(result.message || 'Error al eliminar el cliente');
            }
            
        } catch (error) {
            console.error('❌ Error al eliminar cliente:', error);
            mostrarError('Error al eliminar el cliente: ' + error.message);
            cerrarModalConfirmacion();
        }
    };
    
    abrirModal(elements.modalConfirmacion);
}

// ===== FUNCIONES UTILITARIAS =====
function formatearFecha(fecha) {
    if (!fecha) return '-';
    
    try {
        return new Date(fecha).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    } catch (error) {
        return '-';
    }
}

function formatearEstado(estado) {
    const estados = {
        'activo': 'Activo',
        'inactivo': 'Inactivo',
        'suspendido': 'Suspendido'
    };
    
    return estados[estado] || estado;
}

function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

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

// ===== FUNCIONES DE MENSAJES =====
function mostrarExito(mensaje) {
    if (typeof mostrarAlert === 'function') {
        mostrarAlert(mensaje, 'success');
    } else {
        console.log('✅', mensaje);
    }
}

function mostrarError(mensaje) {
    if (typeof mostrarAlert === 'function') {
        mostrarAlert(mensaje, 'error');
    } else {
        console.error('❌', mensaje);
        alert('Error: ' + mensaje);
    }
}

function mostrarInfo(mensaje) {
    if (typeof mostrarAlert === 'function') {
        mostrarAlert(mensaje, 'info');
    } else {
        console.log('ℹ️', mensaje);
    }
}

// ===== EVENTOS GLOBALES =====
window.editarCliente = editarCliente;
window.cambiarEstadoCliente = cambiarEstadoCliente;
window.eliminarCliente = eliminarCliente;
window.cambiarPagina = cambiarPagina;

console.log('📄 Script de clientes cargado completamente');