const axios = require('axios');

class SimpleLoadTest {
    constructor(baseURL = 'http://localhost:3000') {
        this.baseURL = baseURL;
        this.authToken = null;
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimeSum: 0,
            minResponseTime: Infinity,
            maxResponseTime: 0,
            responseTimes: [],
            errorDetails: []
        };
    }

    async authenticate() {
        try {
            const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                username: 'admin',
                password: 'admin123'
            });
            this.authToken = response.data.token;
            console.log('✅ Autenticación exitosa');
            return true;
        } catch (error) {
            console.error('❌ Error de autenticación:', error.message);
            return false;
        }
    }

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };
    }

    async makeRequest(method, url, data = null) {
        const startTime = Date.now();
        this.stats.totalRequests++;

        try {
            const config = {
                method,
                url: `${this.baseURL}${url}`,
                headers: this.getHeaders(),
                timeout: 10000 // 10 segundos timeout
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            const responseTime = Date.now() - startTime;

            this.stats.successfulRequests++;
            this.updateResponseTimeStats(responseTime);

            return { success: true, responseTime, status: response.status };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.stats.failedRequests++;
            this.stats.errorDetails.push({
                url,
                method,
                error: error.message,
                responseTime
            });

            return { success: false, responseTime, error: error.message };
        }
    }

    updateResponseTimeStats(responseTime) {
        this.stats.responseTimeSum += responseTime;
        this.stats.responseTimes.push(responseTime);
        this.stats.minResponseTime = Math.min(this.stats.minResponseTime, responseTime);
        this.stats.maxResponseTime = Math.max(this.stats.maxResponseTime, responseTime);
    }

    // Simular usuario haciendo consultas de productos
    async simulateProductQueries() {
        const queries = [
            '/api/productos?pagina=1&limite=10',
            '/api/productos?busqueda=martillo',
            '/api/productos/stock-bajo',
            '/api/productos?categoria=herramientas',
            '/api/productos/estadisticas'
        ];

        for (const query of queries) {
            await this.makeRequest('GET', query);
            await this.sleep(Math.random() * 1000 + 500); // Pausa entre 0.5-1.5s
        }
    }

    // Simular usuario consultando facturas
    async simulateFacturaQueries() {
        const queries = [
            '/api/facturas?pagina=1&limite=5',
            '/api/facturas?fechaInicio=2024-01-01&fechaFin=2024-12-31',
            '/api/facturas?estado=activa'
        ];

        for (const query of queries) {
            await this.makeRequest('GET', query);
            await this.sleep(Math.random() * 1500 + 1000); // Pausa entre 1-2.5s
        }
    }

    // Simular creación de venta
    async simulateVentaCreation() {
        const ventaData = {
            cliente: {
                tipo: 'natural',
                documento: Math.floor(Math.random() * 90000000) + 10000000,
                nombre: `Cliente Test ${Math.floor(Math.random() * 1000)}`,
                telefono: `300${Math.floor(Math.random() * 9000000) + 1000000}`
            },
            productos: [
                {
                    id: 1,
                    cantidad: Math.floor(Math.random() * 5) + 1,
                    precioUnitario: 25000
                }
            ],
            subtotal: 25000,
            iva: 0,
            total: 25000,
            metodoPago: 'efectivo',
            montoRecibido: 30000,
            cambio: 5000
        };

        await this.makeRequest('POST', '/api/ventas', ventaData);
        await this.sleep(Math.random() * 2000 + 2000); // Pausa entre 2-4s
    }

    // Ejecutar un usuario simulado
    async simulateUser(userId, duration) {
        console.log(`👤 Usuario ${userId} iniciado`);
        const endTime = Date.now() + duration;

        while (Date.now() < endTime) {
            const action = Math.random();
            
            try {
                if (action < 0.6) {
                    // 60% consultas de productos
                    await this.simulateProductQueries();
                } else if (action < 0.85) {
                    // 25% consultas de facturas
                    await this.simulateFacturaQueries();
                } else {
                    // 15% creación de ventas
                    await this.simulateVentaCreation();
                }
            } catch (error) {
                console.error(`❌ Error en usuario ${userId}:`, error.message);
            }

            // Pausa entre acciones
            await this.sleep(Math.random() * 3000 + 1000);
        }

        console.log(`👤 Usuario ${userId} terminado`);
    }

    // Ejecutar prueba de carga con múltiples usuarios
    async runLoadTest(concurrentUsers = 20, durationMinutes = 2) {
        console.log('🚀 INICIANDO PRUEBA DE CARGA SIMPLE');
        console.log('===================================');
        console.log(`👥 Usuarios concurrentes: ${concurrentUsers}`);
        console.log(`⏱️  Duración: ${durationMinutes} minutos`);
        console.log(`🎯 Servidor: ${this.baseURL}\n`);

        // Autenticar primero
        const authSuccess = await this.authenticate();
        if (!authSuccess) {
            throw new Error('No se pudo autenticar');
        }

        const duration = durationMinutes * 60 * 1000; // Convertir a milisegundos
        const startTime = Date.now();

        // Lanzar usuarios concurrentes
        const userPromises = [];
        for (let i = 1; i <= concurrentUsers; i++) {
            userPromises.push(this.simulateUser(i, duration));
            
            // Escalonar el inicio de usuarios (ramp-up)
            if (i < concurrentUsers) {
                await this.sleep(1500); // 1.5s entre cada usuario
            }
        }

        // Esperar a que todos los usuarios terminen
        console.log('\n⏳ Esperando a que terminen todos los usuarios...');
        await Promise.all(userPromises);

        const totalTime = Date.now() - startTime;
        this.generateReport(totalTime);
    }

    generateReport(totalTestTime) {
        console.log('\n📊 REPORTE DE PRUEBA DE CARGA');
        console.log('==============================');
        
        const avgResponseTime = this.stats.responseTimeSum / this.stats.totalRequests;
        const successRate = (this.stats.successfulRequests / this.stats.totalRequests) * 100;
        const requestsPerSecond = this.stats.totalRequests / (totalTestTime / 1000);

        // Calcular percentiles
        const sortedTimes = this.stats.responseTimes.sort((a, b) => a - b);
        const p50 = this.getPercentile(sortedTimes, 50);
        const p95 = this.getPercentile(sortedTimes, 95);
        const p99 = this.getPercentile(sortedTimes, 99);

        console.log(`🔢 Total de requests: ${this.stats.totalRequests}`);
        console.log(`✅ Requests exitosos: ${this.stats.successfulRequests}`);
        console.log(`❌ Requests fallidos: ${this.stats.failedRequests}`);
        console.log(`📈 Tasa de éxito: ${successRate.toFixed(2)}%`);
        console.log(`⚡ Requests por segundo: ${requestsPerSecond.toFixed(2)}`);
        console.log(`⏱️  Tiempo de respuesta promedio: ${avgResponseTime.toFixed(2)}ms`);
        console.log(`⏱️  Tiempo de respuesta mínimo: ${this.stats.minResponseTime}ms`);
        console.log(`⏱️  Tiempo de respuesta máximo: ${this.stats.maxResponseTime}ms`);
        console.log(`📊 Percentil 50: ${p50}ms`);
        console.log(`📊 Percentil 95: ${p95}ms`);
        console.log(`📊 Percentil 99: ${p99}ms`);

        // Análisis de rendimiento
        console.log('\n🎯 ANÁLISIS DE RENDIMIENTO');
        console.log('==========================');
        
        if (successRate >= 99) {
            console.log('✅ EXCELENTE: Tasa de éxito >= 99%');
        } else if (successRate >= 95) {
            console.log('✅ BUENO: Tasa de éxito >= 95%');
        } else if (successRate >= 90) {
            console.log('⚠️  REGULAR: Tasa de éxito >= 90%');
        } else {
            console.log('❌ MALO: Tasa de éxito < 90%');
        }

        if (p95 < 500) {
            console.log('✅ EXCELENTE: P95 < 500ms');
        } else if (p95 < 1000) {
            console.log('✅ BUENO: P95 < 1000ms');
        } else if (p95 < 2000) {
            console.log('⚠️  REGULAR: P95 < 2000ms');
        } else {
            console.log('❌ MALO: P95 >= 2000ms');
        }

        if (requestsPerSecond > 50) {
            console.log('✅ EXCELENTE: Throughput > 50 req/s');
        } else if (requestsPerSecond > 20) {
            console.log('✅ BUENO: Throughput > 20 req/s');
        } else if (requestsPerSecond > 10) {
            console.log('⚠️  REGULAR: Throughput > 10 req/s');
        } else {
            console.log('❌ MALO: Throughput <= 10 req/s');
        }

        // Mostrar errores más comunes
        if (this.stats.errorDetails.length > 0) {
            console.log('\n❌ ERRORES MÁS COMUNES');
            console.log('======================');
            const errorCounts = {};
            this.stats.errorDetails.forEach(error => {
                const key = `${error.method} ${error.url}: ${error.error}`;
                errorCounts[key] = (errorCounts[key] || 0) + 1;
            });

            Object.entries(errorCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([error, count]) => {
                    console.log(`${count}x - ${error}`);
                });
        }
    }

    getPercentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[index] || 0;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = SimpleLoadTest;

// Ejecutar si se llama directamente
if (require.main === module) {
    const loadTest = new SimpleLoadTest();
    
    // Configuración: 20 usuarios por 2 minutos
    loadTest.runLoadTest(20, 2)
        .then(() => {
            console.log('\n✅ Prueba de carga completada');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Error en prueba de carga:', error);
            process.exit(1);
        });
}