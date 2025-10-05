// JavaScript para la página 404 - Separado del HTML
class Pagina404 {
    constructor() {
        this.redirectTimer = null;
        this.inicializar();
    }

    inicializar() {
        this.configurarAnimacionEntrada();
        this.configurarAutoRedirect();
        this.configurarEventos();
    }

    configurarAnimacionEntrada() {
        document.addEventListener('DOMContentLoaded', () => {
            const container = document.querySelector('.container');
            if (container) {
                container.classList.add('animate-in');
                
                setTimeout(() => {
                    container.classList.add('show');
                }, 100);
            }
        });
    }

    configurarAutoRedirect() {
        // Auto-redirect después de 30 segundos si no hay interacción
        this.redirectTimer = setTimeout(() => {
            this.redirigirADashboard();
        }, 30000);
    }

    configurarEventos() {
        // Cancelar auto-redirect si hay interacción del usuario
        document.addEventListener('click', () => {
            this.cancelarAutoRedirect();
        });

        document.addEventListener('keydown', () => {
            this.cancelarAutoRedirect();
        });

        // Configurar botón de volver atrás
        const btnVolver = document.querySelector('[data-action="back"]');
        if (btnVolver) {
            btnVolver.addEventListener('click', (e) => {
                e.preventDefault();
                this.volverAtras();
            });
        }
    }

    cancelarAutoRedirect() {
        if (this.redirectTimer) {
            clearTimeout(this.redirectTimer);
            this.redirectTimer = null;
            console.log('Auto-redirect cancelado por interacción del usuario');
        }
    }

    redirigirADashboard() {
        console.log('Redirigiendo al dashboard...');
        window.location.href = '/menu.html';
    }

    volverAtras() {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            this.redirigirADashboard();
        }
    }

    // Método para mostrar mensaje de debug (opcional)
    mostrarInfoDebug() {
        console.log('🔍 Página 404 cargada');
        console.log('📍 URL actual:', window.location.href);
        console.log('⏰ Auto-redirect en 30 segundos');
        console.log('👆 Haz clic en cualquier lugar para cancelar redirect');
    }
}

// Inicializar cuando se carga la página
const pagina404 = new Pagina404();

// Mostrar info de debug en consola (opcional)
// pagina404.mostrarInfoDebug();