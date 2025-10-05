const autocannon = require('autocannon');
const axios = require('axios');

// Configuración base para las pruebas
const BASE_URL = 'http://localhost:3000';
const CONCURRENT_USERS = 20;
const DURATION_SECONDS = 30;

// Datos de prueba
const testData = {
    usuario: {
        username: 'admin',
        password: 'admin123'
    },
    venta: {
        cliente: {
            tipo: 'natural',
            documento: '12345678',
            nombre: 'Cliente Test Performance',
            telefono: '3001234567'
        },
        productos: [
            { id: 1, cantidad: 2, precioUnitario: 25000 },
            { id: 2, cantidad: 1, precioUnitario: 15000 }
        ],
        subtotal: 65000,
        iva: 0,
        total: 65000,
        metodoPago: 'efectivo',
        montoRecibido: 70000,
        cambio: 5000
    }
};

class PerformanceTest {
    constructor() {
        this.authToken = null;
        this.results = {};
    }

    // Obtener token de autenticación
    async authenticate() {
        console.log('🔐 Obteniendo token de autenticación...');
        try {
            const response = await axios.post(`${BASE_URL}/api/auth/login`, testData.usuario);
            this.authToken = response.data.token;
            console.log('✅ Token obtenido exitosamente');
            return this.authToken;
        } catch (error) {
            console.error('❌ Error en autenticación:', error.message);
            throw error;
        }
    }

    // Crear headers con autenticación
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };
    }

    // Test de endpoint de productos (GET)
    async testProductosEndpoint() {
        console.log('📦 Iniciando prueba de desempeño - Endpoint Productos...');
        
        const result = await autocannon({
            url: `${BASE_URL}/api/productos`,
            connections: CONCURRENT_USERS,
            duration: DURATION_SECONDS,
            headers: this.getAuthHeaders(),
            requests: [
                {
                    method: 'GET',
                    path: '/api/productos?pagina=1&limite=10'
                },
                {
                    method: 'GET', 
                    path: '/api/productos?pagina=2&limite=10'
                },
                {
                    method: 'GET',
                    path: '/api/productos?busqueda=martillo'
                },
                {
                    method: 'GET',
                    path: '/api/productos/stock-bajo'
                }
            ]
        });

        this.results.productos = result;
        return result;
    }

    // Test de endpoint de ventas (POST)
    async testVentasEndpoint() {
        console.log('💰 Iniciando prueba de desempeño - Endpoint Ventas...');

        const result = await autocannon({
            url: `${BASE_URL}/api/ventas`,
            connections: CONCURRENT_USERS,
            duration: DURATION_SECONDS,
            headers: this.getAuthHeaders(),
            method: 'POST',
            body: JSON.stringify(testData.venta)
        });

        this.results.ventas = result;
        return result;
    }

    // Test de endpoint de facturas (GET)
    async testFacturasListEndpoint() {
        console.log('📄 Iniciando prueba de desempeño - Listado de Facturas...');

        const result = await autocannon({
            url: `${BASE_URL}/api/facturas`,
            connections: CONCURRENT_USERS,
            duration: DURATION_SECONDS,
            headers: this.getAuthHeaders(),
            requests: [
                {
                    method: 'GET',
                    path: '/api/facturas?pagina=1&limite=10'
                },
                {
                    method: 'GET',
                    path: '/api/facturas?fechaInicio=2024-01-01&fechaFin=2024-12-31'
                },
                {
                    method: 'GET',
                    path: '/api/facturas?estado=activa'
                }
            ]
        });

        this.results.facturasList = result;
        return result;
    }

    // Test mixto: consultas y creación
    async testMixedWorkload() {
        console.log('🔄 Iniciando prueba de carga mixta...');

        const result = await autocannon({
            url: BASE_URL,
            connections: CONCURRENT_USERS,
            duration: DURATION_SECONDS,
            headers: this.getAuthHeaders(),
            requests: [
                // 60% consultas de productos
                { method: 'GET', path: '/api/productos?pagina=1&limite=10', weight: 6 },
                { method: 'GET', path: '/api/productos/stock-bajo', weight: 2 },
                
                // 30% consultas de facturas  
                { method: 'GET', path: '/api/facturas?pagina=1&limite=5', weight: 3 },
                
                // 10% creación de ventas
                { method: 'POST', path: '/api/ventas', body: JSON.stringify(testData.venta), weight: 1 }
            ]
        });

        this.results.mixed = result;
        return result;
    }

    // Generar reporte de resultados
    generateReport() {
        console.log('\n📊 REPORTE DE PRUEBAS DE DESEMPEÑO');
        console.log('=====================================');
        
        Object.entries(this.results).forEach(([testName, result]) => {
            console.log(`\n🎯 ${testName.toUpperCase()}`);
            console.log('-'.repeat(30));
            console.log(`⚡ Requests/seg: ${result.requests.average.toFixed(2)}`);
            console.log(`📊 Total requests: ${result.requests.total}`);
            console.log(`⏱️  Latencia promedio: ${result.latency.average.toFixed(2)}ms`);
            console.log(`⏱️  Latencia p95: ${result.latency.p95.toFixed(2)}ms`);
            console.log(`⏱️  Latencia p99: ${result.latency.p99.toFixed(2)}ms`);
            console.log(`📈 Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/seg`);
            console.log(`❌ Errores: ${result.errors || 0}`);
            console.log(`🔄 Timeouts: ${result.timeouts || 0}`);
            
            // Análisis de rendimiento
            if (result.requests.average > 100) {
                console.log('✅ Rendimiento EXCELENTE (>100 req/seg)');
            } else if (result.requests.average > 50) {
                console.log('✅ Rendimiento BUENO (>50 req/seg)');
            } else if (result.requests.average > 20) {
                console.log('⚠️  Rendimiento REGULAR (>20 req/seg)');
            } else {
                console.log('❌ Rendimiento BAJO (<20 req/seg)');
            }

            if (result.latency.p95 < 100) {
                console.log('✅ Latencia EXCELENTE (<100ms p95)');
            } else if (result.latency.p95 < 500) {
                console.log('✅ Latencia BUENA (<500ms p95)');
            } else if (result.latency.p95 < 1000) {
                console.log('⚠️  Latencia REGULAR (<1000ms p95)');
            } else {
                console.log('❌ Latencia ALTA (>1000ms p95)');
            }
        });

        console.log('\n🎯 RESUMEN GENERAL');
        console.log('==================');
        console.log(`👥 Usuarios concurrentes simulados: ${CONCURRENT_USERS}`);
        console.log(`⏱️  Duración de cada prueba: ${DURATION_SECONDS}s`);
        console.log(`🔧 Herramienta: Autocannon (Node.js)`);
    }

    // Ejecutar todas las pruebas
    async runAllTests() {
        console.log('🚀 INICIANDO PRUEBAS DE DESEMPEÑO');
        console.log('==================================');
        console.log(`👥 Usuarios concurrentes: ${CONCURRENT_USERS}`);
        console.log(`⏱️  Duración por prueba: ${DURATION_SECONDS}s`);
        console.log(`🎯 Servidor: ${BASE_URL}\n`);

        try {
            // Autenticar
            await this.authenticate();

            // Ejecutar pruebas secuencialmente
            console.log('1️⃣  Ejecutando prueba de productos...');
            await this.testProductosEndpoint();
            await this.sleep(5000); // Pausa entre pruebas

            console.log('2️⃣  Ejecutando prueba de ventas...');
            await this.testVentasEndpoint();
            await this.sleep(5000);

            console.log('3️⃣  Ejecutando prueba de facturas...');
            await this.testFacturasListEndpoint();
            await this.sleep(5000);

            console.log('4️⃣  Ejecutando prueba de carga mixta...');
            await this.testMixedWorkload();

            // Generar reporte
            this.generateReport();

            console.log('\n✅ PRUEBAS DE DESEMPEÑO COMPLETADAS');

        } catch (error) {
            console.error('❌ Error durante las pruebas:', error.message);
            throw error;
        }
    }

    // Utilidad para pausas
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = PerformanceTest;

// Ejecutar si se llama directamente
if (require.main === module) {
    const performanceTest = new PerformanceTest();
    performanceTest.runAllTests().catch(console.error);
}