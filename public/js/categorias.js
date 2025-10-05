     // ==========================================
            // GESTIÓN DE CATEGORÍAS - JavaScript
            // ==========================================

            let categorias = [];
            let categoriaEditando = null;
            let timeoutBusqueda = null;

            // Cargar categorías al iniciar la página
            document.addEventListener('DOMContentLoaded', function() {
                console.log('🚀 Inicializando sistema de categorías...');
                cargarCategorias();
                configurarEventListeners();
                console.log('✅ Sistema de categorías inicializado correctamente');
            });

            // Configurar event listeners
            function configurarEventListeners() {
                console.log('🔧 Configurando event listeners...');
                
                // Event listeners para botones de nueva categoría y acciones
                document.addEventListener('click', function(e) {
                    const target = e.target.closest('[data-action]');
                    if (!target) return;

                    const action = target.getAttribute('data-action');
                    const id = target.getAttribute('data-id');
                    const nombre = target.getAttribute('data-nombre');

                    switch(action) {
                        case 'nueva-categoria':
                            console.log('🆕 Abriendo modal para nueva categoría');
                            abrirModal();
                            break;
                            
                        case 'cerrar-modal':
                            console.log('🔴 Cerrando modal de categoría');
                            cerrarModal();
                            break;
                            
                        case 'ver-categoria':
                            console.log('👁️ Viendo categoría ID:', id);
                            verCategoria(parseInt(id));
                            break;
                            
                        case 'editar-categoria':
                            console.log('✏️ Editando categoría ID:', id);
                            editarCategoria(parseInt(id));
                            break;
                            
                        case 'eliminar-categoria':
                            console.log('🗑️ Eliminando categoría ID:', id, 'Nombre:', nombre);
                            eliminarCategoria(parseInt(id), nombre);
                            break;
                    }
                });

                // Cerrar modal con ESC
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        const modal = document.getElementById('modal-categoria');
                        if (modal && modal.classList.contains('mostrar')) {
                            console.log('🔴 Cerrando modal con ESC');
                            cerrarModal();
                        }
                    }
                });

                // Cerrar modal al hacer clic fuera
                document.addEventListener('click', function(e) {
                    const modal = document.getElementById('modal-categoria');
                    if (e.target === modal) {
                        console.log('🔴 Cerrando modal por clic fuera');
                        cerrarModal();
                    }
                });

                // Event listener para el campo de búsqueda
                const campoBusqueda = document.getElementById('campo-busqueda');
                if (campoBusqueda) {
                    campoBusqueda.addEventListener('input', function(e) {
                        console.log('🔍 Buscando categorías con término:', e.target.value);
                        buscarCategorias();
                    });
                    console.log('✅ Event listener de búsqueda configurado');
                } else {
                    console.error('❌ No se encontró el campo de búsqueda');
                }
            }

            // ==========================================
            // FUNCIONES DE CARGA DE DATOS
            // ==========================================

            async function cargarCategorias() {
                try {
                    mostrarLoading(true);
                    
                    const response = await fetch('/api/categorias', {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json'
                        },
                        credentials: 'include' // Importante: incluir cookies
                    });

                    if (!response.ok) {
                        if (response.status === 401) {
                            // No autenticado, redirigir al login
                            window.location.href = '/auth/login';
                            return;
                        }
                        throw new Error('Error al cargar categorías');
                    }

                    const data = await response.json();
                    
                    if (data.success) {
                        categorias = data.categorias;
                        mostrarCategorias(categorias);
                        actualizarEstadisticas();
                    } else {
                        mostrarError('Error al cargar las categorías');
                    }
                    
                } catch (error) {
                    console.error('Error:', error);
                    mostrarError('Error al conectar con el servidor');
                } finally {
                    mostrarLoading(false);
                }
            }

            // ==========================================
            // FUNCIONES DE INTERFAZ
            // ==========================================

            function mostrarCategorias(listaCategorias) {
                const cuerpoTabla = document.getElementById('cuerpo-tabla-categorias');
                const estadoVacio = document.getElementById('estado-vacio');
                const tabla = document.getElementById('tabla-categorias');

                if (listaCategorias.length === 0) {
                    tabla.style.display = 'none';
                    estadoVacio.style.display = 'block';
                    return;
                }

                tabla.style.display = 'table';
                estadoVacio.style.display = 'none';

                cuerpoTabla.innerHTML = '';

                listaCategorias.forEach(categoria => {
                    const fila = document.createElement('tr');
                    const fechaCreacion = new Date(categoria.fecha_creacion).toLocaleDateString('es-CO');
                    
                    fila.innerHTML = `
                        <td>
                            <span class="codigo-categoria">${categoria.codigo_categoria}</span>
                        </td>
                        <td>
                            <span class="nombre-categoria">${categoria.nombre_categoria}</span>
                        </td>
                        <td>
                            <span class="descripcion-categoria" title="${categoria.descripcion || 'Sin descripción'}">
                                ${categoria.descripcion || 'Sin descripción'}
                            </span>
                        </td>
                        <td>
                            <span class="${categoria.activo ? 'estado-activo' : 'estado-inactivo'}">
                                ${categoria.activo ? 'Activa' : 'Inactiva'}
                            </span>
                        </td>
                        <td>
                            <span class="fecha-categoria">${fechaCreacion}</span>
                        </td>
                        <td>
                            <div class="acciones-categoria">
                                <button class="btn-accion btn-ver" data-action="ver-categoria" data-id="${categoria.id}" title="Ver detalles">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                                        <path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                <button class="btn-accion btn-editar" data-action="editar-categoria" data-id="${categoria.id}" title="Editar">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32l8.4-8.4Z" />
                                        <path d="M5.25 5.25a3 3 0 0 0-3 3v10.5a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3V13.5a.75.75 0 0 0-1.5 0v5.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5V8.25a1.5 1.5 0 0 1 1.5-1.5h5.25a.75.75 0 0 0 0-1.5H5.25Z" />
                                    </svg>
                                </button>
                                <button class="btn-accion btn-eliminar" data-action="eliminar-categoria" data-id="${categoria.id}" data-nombre="${categoria.nombre_categoria}" title="Eliminar">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </td>
                    `;
                    
                    cuerpoTabla.appendChild(fila);
                });
            }

            function actualizarEstadisticas() {
                const totalCategorias = categorias.length;
                const categoriasActivas = categorias.filter(c => c.activo).length;
                
                document.getElementById('total-categorias').textContent = totalCategorias;
                document.getElementById('categorias-activas').textContent = categoriasActivas;
            }

            // ==========================================
            // FUNCIONES DE MODAL
            // ==========================================

            function abrirModal(categoria = null) {
                console.log('🔧 Intentando abrir modal de categoría...', categoria);
                
                const modal = document.getElementById('modal-categoria');
                const titulo = document.getElementById('titulo-modal');
                const formulario = document.getElementById('formulario-categoria');
                
                if (!modal) {
                    console.error('❌ No se encontró el modal con ID "modal-categoria"');
                    return;
                }
                
                if (!titulo) {
                    console.error('❌ No se encontró el título con ID "titulo-modal"');
                    return;
                }
                
                if (!formulario) {
                    console.error('❌ No se encontró el formulario con ID "formulario-categoria"');
                    return;
                }
                
                console.log('✅ Elementos del modal encontrados correctamente');
                categoriaEditando = categoria;
                
                if (categoria) {
                    // Modo edición
                    titulo.textContent = 'Editar Categoría';
                    document.getElementById('codigo-categoria').value = categoria.codigo_categoria;
                    document.getElementById('nombre-categoria').value = categoria.nombre_categoria;
                    document.getElementById('descripcion-categoria').value = categoria.descripcion || '';
                } else {
                    // Modo creación
                    titulo.textContent = 'Nueva Categoría';
                    formulario.reset();
                }
                
                console.log('🎪 Mostrando modal...');
                modal.classList.add('mostrar');
                
                const codigoInput = document.getElementById('codigo-categoria');
                if (codigoInput) {
                    codigoInput.focus();
                    console.log('✅ Focus establecido en código-categoria');
                } else {
                    console.error('❌ No se encontró el input código-categoria');
                }
                
                console.log('✅ Modal abierto exitosamente');
            }

            function cerrarModal() {
                const modal = document.getElementById('modal-categoria');
                modal.classList.remove('mostrar');
                categoriaEditando = null;
                
                // Limpiar formulario
                document.getElementById('formulario-categoria').reset();
            }

            // ==========================================
            // FUNCIONES DE ACCIONES
            // ==========================================

            async function verCategoria(id) {
                const categoria = categorias.find(c => c.id === id);
                if (categoria) {
                    customAlert.showCategoryPreview({
                        nombre: categoria.nombre_categoria,
                        descripcion: categoria.descripcion,
                        created_at: categoria.fecha_creacion,
                        updated_at: categoria.fecha_actualizacion
                    });
                }
            }

            function editarCategoria(id) {
                const categoria = categorias.find(c => c.id === id);
                if (categoria) {
                    abrirModal(categoria);
                }
            }

            async function eliminarCategoria(id, nombre) {
                const confirmed = await customAlert.confirm(
                    `Esta acción eliminará permanentemente la categoría "${nombre}" y no se puede deshacer.`,
                    '¿Eliminar categoría?',
                    'error'
                );
                
                if (confirmed) {
                    try {
                        const response = await fetch(`/api/categorias/${id}`, {
                            method: 'DELETE',
                            headers: {
                                'Accept': 'application/json'
                            },
                            credentials: 'include'
                        });

                        if (response.status === 401) {
                            window.location.href = '/auth/login';
                            return;
                        }

                        const data = await response.json();

                        if (data.success) {
                            mostrarExito(data.message);
                            cargarCategorias();
                        } else {
                            mostrarError(data.message);
                        }
                        
                    } catch (error) {
                        console.error('❌ Frontend Error:', error);
                        mostrarError('Error al eliminar la categoría');
                    }
                }
            }

            // ==========================================
            // MANEJO DE FORMULARIO
            // ==========================================

            document.getElementById('formulario-categoria').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const btnGuardar = document.getElementById('btn-guardar');
                const datosFormulario = new FormData(this);
                
                const categoria = {
                    codigo_categoria: datosFormulario.get('codigo_categoria').trim().toUpperCase(),
                    nombre_categoria: datosFormulario.get('nombre_categoria').trim(),
                    descripcion: datosFormulario.get('descripcion').trim() || null
                };

                // Validaciones
                if (!categoria.codigo_categoria || !categoria.nombre_categoria) {
                    mostrarError('El código y nombre son obligatorios');
                    return;
                }

                if (categoria.codigo_categoria.length > 10) {
                    mostrarError('El código no puede tener más de 10 caracteres');
                    return;
                }

                try {
                    console.log('🚀 Iniciando envío de categoría...', categoria);
                    btnGuardar.textContent = 'Guardando...';
                    btnGuardar.classList.add('btn-guardando');
                    btnGuardar.disabled = true;

                    const url = categoriaEditando 
                        ? `/api/categorias/${categoriaEditando.id}`
                        : '/api/categorias';
                    
                    const method = categoriaEditando ? 'PUT' : 'POST';
                    console.log(`📡 Enviando ${method} a ${url}`);

                    const response = await fetch(url, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        credentials: 'include', // Importante: incluir cookies
                        body: JSON.stringify(categoria)
                    });

                    console.log('📊 Response status:', response.status);
                    console.log('📊 Response headers:', [...response.headers.entries()]);

                    if (response.status === 401) {
                        console.log('🔒 Error 401: No autorizado, redirigiendo a login');
                        window.location.href = '/auth/login';
                        return;
                    }

                    const data = await response.json();
                    console.log('📦 Response data:', data);

                    if (data.success) {
                        console.log('✅ Categoría guardada exitosamente');
                        mostrarExito(data.message);
                        cerrarModal();
                        cargarCategorias();
                    } else {
                        const errorMessage = data.message || data.error || 'Error desconocido';
                        console.log('❌ Error del servidor:', errorMessage);
                        console.log('❌ Detalles del error:', data.details);
                        mostrarError(errorMessage);
                    }
                    
                } catch (error) {
                    console.error('❌ Error completo:', error);
                    console.error('❌ Error stack:', error.stack);
                    mostrarError('Error al guardar la categoría');
                } finally {
                    btnGuardar.textContent = categoriaEditando ? 'Actualizar Categoría' : 'Guardar Categoría';
                    btnGuardar.classList.remove('btn-guardando');
                    btnGuardar.disabled = false;
                }
            });

            // ==========================================
            // BÚSQUEDA
            // ==========================================

            function buscarCategorias() {
                const termino = document.getElementById('campo-busqueda').value.toLowerCase();
                
                if (timeoutBusqueda) {
                    clearTimeout(timeoutBusqueda);
                }
                
                timeoutBusqueda = setTimeout(() => {
                    const categoriasFiltradas = categorias.filter(categoria => 
                        categoria.codigo_categoria.toLowerCase().includes(termino) ||
                        categoria.nombre_categoria.toLowerCase().includes(termino) ||
                        (categoria.descripcion && categoria.descripcion.toLowerCase().includes(termino))
                    );
                    
                    mostrarCategorias(categoriasFiltradas);
                }, 300);
            }

            // ==========================================
            // FUNCIONES AUXILIARES
            // ==========================================

            function mostrarLoading(mostrar) {
                const loading = document.getElementById('loading');
                const tabla = document.getElementById('tabla-categorias');
                
                if (mostrar) {
                    loading.style.display = 'flex';
                    tabla.style.display = 'none';
                } else {
                    loading.style.display = 'none';
                    tabla.style.display = 'table';
                }
            }

            function mostrarExito(mensaje) {
                const elemento = document.getElementById('mensaje-exito');
                const texto = document.getElementById('texto-mensaje-exito');
                
                texto.textContent = mensaje;
                elemento.classList.add('mostrar');
                
                setTimeout(() => {
                    elemento.classList.remove('mostrar');
                }, 5000);
            }

            function mostrarError(mensaje) {
                const elemento = document.getElementById('mensaje-error');
                const texto = document.getElementById('texto-mensaje-error');
                
                texto.textContent = mensaje;
                elemento.classList.add('mostrar');
                
                setTimeout(() => {
                    elemento.classList.remove('mostrar');
                }, 5000);
            }

            // Cerrar modal con Escape
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    cerrarModal();
                }
            });

            // Cerrar modal al hacer clic fuera (con confirmación)
            document.getElementById('modal-categoria').addEventListener('click', function(e) {
                if (e.target === this) {
                    // Verificar si hay datos en el formulario
                    const nombre = document.getElementById('nombre-categoria').value.trim();
                    const descripcion = document.getElementById('descripcion-categoria').value.trim();
                    
                    if (nombre !== '' || descripcion !== '') {
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

            // Formatear código a mayúsculas mientras se escribe
            document.getElementById('codigo-categoria').addEventListener('input', function(e) {
                e.target.value = e.target.value.toUpperCase();
            });

            // Hacer funciones disponibles globalmente para debugging
            window.abrirModal = abrirModal;
            window.cerrarModal = cerrarModal;
            window.cargarCategorias = cargarCategorias;
            
            // Función de testing para verificar que todo funciona
            window.testModal = function() {
                console.log('🧪 Ejecutando test del modal...');
                
                // Verificar que los elementos existen
                const modal = document.getElementById('modal-categoria');
                const btnNueva = document.querySelector('[data-action="nueva-categoria"]');
                
                console.log('Modal encontrado:', !!modal);
                console.log('Botón nueva categoría encontrado:', !!btnNueva);
                
                if (btnNueva && modal) {
                    console.log('✅ Test exitoso: Modal puede abrirse');
                    abrirModal();
                } else {
                    console.error('❌ Test fallido: Elementos no encontrados');
                }
            };