// Sistema de alertas personalizadas
class CustomAlert {
    constructor() {
        this.createAlertHTML();
        this.createPreviewHTML();
    }

    createAlertHTML() {
        const alertHTML = `
            <div id="custom-alert-overlay" class="alert-overlay">
                <div class="alert-container">
                    <div class="alert-header">
                        <div class="alert-icon warning" id="alert-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <h3 class="alert-title" id="alert-title">Confirmar acción</h3>
                        <p class="alert-message" id="alert-message">¿Estás seguro de realizar esta acción?</p>
                    </div>
                    <div class="alert-buttons" id="alert-buttons">
                        <button class="alert-btn secondary" id="alert-cancel">Cancelar</button>
                        <button class="alert-btn primary" id="alert-confirm">Confirmar</button>
                    </div>
                </div>
            </div>
        `;
        
        if (!document.getElementById('custom-alert-overlay')) {
            document.body.insertAdjacentHTML('beforeend', alertHTML);
        }
    }

    createPreviewHTML() {
        const previewHTML = `
            <div id="preview-overlay" class="preview-overlay">
                <div class="preview-container">
                    <div class="preview-header">
                        <h3 class="preview-title" id="preview-title">Vista Previa</h3>
                        <button class="preview-close" id="preview-close">&times;</button>
                    </div>
                    <div class="preview-body" id="preview-body">
                        <!-- Contenido dinámico -->
                    </div>
                </div>
            </div>
        `;
        
        if (!document.getElementById('preview-overlay')) {
            document.body.insertAdjacentHTML('beforeend', previewHTML);
        }
    }

    // Método para mostrar confirmación personalizada
    confirm(message, title = 'Confirmar acción', type = 'warning') {
        return new Promise((resolve) => {
            const overlay = document.getElementById('custom-alert-overlay');
            const titleEl = document.getElementById('alert-title');
            const messageEl = document.getElementById('alert-message');
            const iconEl = document.getElementById('alert-icon');
            const confirmBtn = document.getElementById('alert-confirm');
            const cancelBtn = document.getElementById('alert-cancel');

            // Configurar contenido
            titleEl.textContent = title;
            messageEl.textContent = message;
            
            // Configurar icono según tipo
            iconEl.className = `alert-icon ${type}`;
            
            // Mostrar overlay
            overlay.style.display = 'block';
            
            // Event listeners
            const handleConfirm = () => {
                overlay.style.display = 'none';
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                resolve(true);
            };
            
            const handleCancel = () => {
                overlay.style.display = 'none';
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                resolve(false);
            };
            
            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
            
            // Cerrar con Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    // Método para mostrar alerta simple
    alert(message, title = 'Información', type = 'success') {
        return new Promise((resolve) => {
            const overlay = document.getElementById('custom-alert-overlay');
            const titleEl = document.getElementById('alert-title');
            const messageEl = document.getElementById('alert-message');
            const iconEl = document.getElementById('alert-icon');
            const buttonsEl = document.getElementById('alert-buttons');
            
            // Configurar contenido
            titleEl.textContent = title;
            messageEl.textContent = message;
            iconEl.className = `alert-icon ${type}`;
            
            // Solo mostrar botón OK
            buttonsEl.innerHTML = `
                <button class="alert-btn primary" id="alert-ok">Entendido</button>
            `;
            
            // Mostrar overlay
            overlay.style.display = 'block';
            
            // Event listener
            const okBtn = document.getElementById('alert-ok');
            const handleOk = () => {
                overlay.style.display = 'none';
                okBtn.removeEventListener('click', handleOk);
                resolve();
            };
            
            okBtn.addEventListener('click', handleOk);
            
            // Cerrar con Escape
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    handleOk();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        });
    }

    // Método para vista previa de categorías
    showCategoryPreview(categoria) {
        const overlay = document.getElementById('preview-overlay');
        const titleEl = document.getElementById('preview-title');
        const bodyEl = document.getElementById('preview-body');
        const closeBtn = document.getElementById('preview-close');
        
        titleEl.textContent = 'Vista Previa - Categoría';
        
        bodyEl.innerHTML = `
            <div class="preview-field">
                <label class="preview-label">Nombre de la Categoría</label>
                <div class="preview-value">${categoria.nombre || 'Sin nombre'}</div>
            </div>
            <div class="preview-field">
                <label class="preview-label">Descripción</label>
                <div class="preview-value ${!categoria.descripcion ? 'empty' : ''}">${categoria.descripcion || 'Sin descripción proporcionada'}</div>
            </div>
            <div class="preview-field">
                <label class="preview-label">Fecha de Creación</label>
                <div class="preview-value">${categoria.created_at ? new Date(categoria.created_at).toLocaleString('es-ES') : 'No disponible'}</div>
            </div>
            <div class="preview-field">
                <label class="preview-label">Última Actualización</label>
                <div class="preview-value">${categoria.updated_at ? new Date(categoria.updated_at).toLocaleString('es-ES') : 'No disponible'}</div>
            </div>
        `;
        
        overlay.style.display = 'block';
        
        // Event listeners para cerrar
        const handleClose = () => {
            overlay.style.display = 'none';
            closeBtn.removeEventListener('click', handleClose);
            overlay.removeEventListener('click', handleOverlayClick);
        };
        
        const handleOverlayClick = (e) => {
            if (e.target === overlay) {
                handleClose();
            }
        };
        
        closeBtn.addEventListener('click', handleClose);
        overlay.addEventListener('click', handleOverlayClick);
        
        // Cerrar con Escape
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleClose();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }
}

// Crear instancia global
const customAlert = new CustomAlert();

// Exportar para uso global
window.customAlert = customAlert;
