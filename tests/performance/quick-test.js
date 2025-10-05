const axios = require('axios');

class QuickPerformanceTest {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.results = [];
        this.errors = [];
    }

    async testLogin() {
        console.log('🔐 Probando endpoint de login...');
        const startTime = Date.now();
        
        try {
            const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                username: 'admin',
                password: 'admin123'
            }, { timeout: 5000 });
            
            const responseTime = Date.now() - startTime;
            console.log(`✅ Login exitoso - ${responseTime}ms`);
            return { success: true, responseTime, token: response.data.token };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            console.log(`❌ Login falló - ${responseTime}ms - ${error.message}`);
            return { success: false, responseTime, error: error.message };
        }
    }

    async testEndpoint(method, endpoint, data = null, token = null) {
        const startTime = Date.now();
        
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                timeout: 5000
            };

            if (token) {
                config.headers = { 'Authorization': `Bearer ${token}` };
            }

            if (data) {
                config.data = data;
                config.headers = { ...config.headers, 'Content-Type': 'application/json' };
            }

            const response = await axios(config);
            const responseTime = Date.now() - startTime;
            
            return {
                success: true,
                responseTime,
                status: response.status,
                endpoint,
                method
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                success: false,
                responseTime,
                status: error.response?.status || 0,
                endpoint,
                method,
                error: error.message
            };
        }
    }

    async runQuickTest() {
        console.log('🚀 PRUEBA RÁPIDA DE DESEMPEÑO');
        console.log('==============================');
        console.log(`🎯 Servidor: ${this.baseURL}`);
        console.log('📊 Probando endpoints principales...\n');

        // Test 1: Login
        const loginResult = await this.testLogin();
        this.results.push(loginResult);

        if (!loginResult.success) {
            console.log('❌ No se pudo obtener token de autenticación');
            return this.generateQuickReport();
        }

        const token = loginResult.token;

        // Test 2: Endpoints principales
        const tests = [
            ['GET', '/api/productos?pagina=1&limite=5'],
            ['GET', '/api/productos/stock-bajo'],  
            ['GET', '/api/facturas?pagina=1&limite=3'],
            ['POST', '/api/ventas', {
                cliente: {
                    tipo: 'natural',
                    documento: '12345678',
                    nombre: 'Cliente Test Performance',
                    telefono: '3001234567'
                },
                productos: [
                    { id: 1, cantidad: 1, precioUnitario: 25000 }
                ],
                subtotal: 25000,
                iva: 0,
                total: 25000,
                metodoPago: 'efectivo',
                montoRecibido: 30000,
                cambio: 5000
            }]
        ];

        // Ejecutar tests secuencialmente
        for (const [method, endpoint, data] of tests) {
            console.log(`📡 Probando ${method} ${endpoint}...`);
            const result = await this.testEndpoint(method, endpoint, data, token);
            this.results.push(result);
            
            if (result.success) {
                console.log(`✅ ${method} ${endpoint} - ${result.responseTime}ms - Status ${result.status}`);
            } else {
                console.log(`❌ ${method} ${endpoint} - ${result.responseTime}ms - Error: ${result.error}`);
                this.errors.push(result);
            }
            
            // Pausa pequeña entre requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Test 3: Múltiples requests concurrentes
        console.log('\n🔄 Probando 10 requests concurrentes a productos...');
        const concurrentPromises = [];
        
        for (let i = 0; i < 10; i++) {
            concurrentPromises.push(
                this.testEndpoint('GET', '/api/productos?pagina=1&limite=5', null, token)
            );
        }

        const concurrentResults = await Promise.all(concurrentPromises);
        this.results.push(...concurrentResults);

        const successfulConcurrent = concurrentResults.filter(r => r.success).length;
        console.log(`✅ ${successfulConcurrent}/10 requests concurrentes exitosos`);

        this.generateQuickReport();
    }

    generateQuickReport() {
        console.log('\n📊 REPORTE RÁPIDO DE DESEMPEÑO');
        console.log('===============================');

        const totalRequests = this.results.length;
        const successfulRequests = this.results.filter(r => r.success).length;
        const failedRequests = totalRequests - successfulRequests;
        const successRate = (successfulRequests / totalRequests) * 100;

        const responseTimes = this.results.map(r => r.responseTime);
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);

        console.log(`🔢 Total requests: ${totalRequests}`);
        console.log(`✅ Exitosos: ${successfulRequests}`);
        console.log(`❌ Fallidos: ${failedRequests}`);
        console.log(`📈 Tasa de éxito: ${successRate.toFixed(1)}%`);
        console.log(`⏱️  Tiempo promedio: ${avgResponseTime.toFixed(1)}ms`);
        console.log(`⏱️  Tiempo mínimo: ${minResponseTime}ms`);
        console.log(`⏱️  Tiempo máximo: ${maxResponseTime}ms`);

        // Análisis por endpoint
        console.log('\n📊 ANÁLISIS POR ENDPOINT');
        console.log('========================');
        
        const endpointStats = {};
        this.results.forEach(result => {
            if (result.endpoint) {
                const key = `${result.method} ${result.endpoint}`;
                if (!endpointStats[key]) {
                    endpointStats[key] = { 
                        total: 0, 
                        successful: 0, 
                        totalTime: 0 
                    };
                }
                endpointStats[key].total++;
                if (result.success) endpointStats[key].successful++;
                endpointStats[key].totalTime += result.responseTime;
            }
        });

        Object.entries(endpointStats).forEach(([endpoint, stats]) => {
            const avgTime = stats.totalTime / stats.total;
            const successRate = (stats.successful / stats.total) * 100;
            console.log(`${endpoint}:`);
            console.log(`  📊 ${stats.successful}/${stats.total} exitosos (${successRate.toFixed(1)}%)`);
            console.log(`  ⏱️  Promedio: ${avgTime.toFixed(1)}ms`);
        });

        // Evaluación general
        console.log('\n🎯 EVALUACIÓN GENERAL');
        console.log('=====================');
        
        if (successRate >= 95 && avgResponseTime < 500) {
            console.log('✅ EXCELENTE: Sistema funcionando óptimamente');
        } else if (successRate >= 90 && avgResponseTime < 1000) {
            console.log('✅ BUENO: Sistema funcionando correctamente');
        } else if (successRate >= 80 && avgResponseTime < 2000) {
            console.log('⚠️  REGULAR: Sistema necesita optimización');
        } else {
            console.log('❌ MALO: Sistema requiere atención inmediata');
        }

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORES ENCONTRADOS');
            console.log('======================');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.method} ${error.endpoint}: ${error.error}`);
            });
        }

        console.log('\n💡 RECOMENDACIONES PARA PRUEBA COMPLETA');
        console.log('=======================================');
        console.log('Para una prueba completa de 20 usuarios concurrentes, ejecuta:');
        console.log('npm run test:performance');
        console.log('\nO para prueba avanzada con autocannon:');
        console.log('npm run test:performance-advanced');
    }
}

// Ejecutar la prueba
const quickTest = new QuickPerformanceTest();
quickTest.runQuickTest().catch(console.error);