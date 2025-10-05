#!/usr/bin/env node

// Prueba de desempeño simplificada usando solo HTTP nativo
const http = require('http');
const { performance } = require('perf_hooks');

class PerformanceTestSimple {
    constructor() {
        this.baseUrl = 'localhost';
        this.port = 3000;
        this.results = {
            totalRequests: 0,
            successful: 0,
            failed: 0,
            times: [],
            errors: []
        };
    }

    makeRequest(path = '/', method = 'GET', data = null) {
        return new Promise((resolve) => {
            const start = performance.now();
            
            const options = {
                hostname: this.baseUrl,
                port: this.port,
                path: path,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Performance-Test/1.0'
                }
            };

            if (data && method === 'POST') {
                const postData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    const time = performance.now() - start;
                    this.results.totalRequests++;
                    this.results.times.push(time);
                    
                    if (res.statusCode >= 200 && res.statusCode < 400) {
                        this.results.successful++;
                        console.log(`✅ ${method} ${path} - ${time.toFixed(0)}ms - ${res.statusCode}`);
                    } else {
                        this.results.failed++;
                        console.log(`⚠️  ${method} ${path} - ${time.toFixed(0)}ms - ${res.statusCode}`);
                    }
                    
                    resolve({
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        statusCode: res.statusCode,
                        time: time,
                        data: responseData
                    });
                });
            });

            req.on('error', (error) => {
                const time = performance.now() - start;
                this.results.totalRequests++;
                this.results.failed++;
                this.results.times.push(time);
                this.results.errors.push(error.message);
                
                console.log(`❌ ${method} ${path} - ${time.toFixed(0)}ms - ${error.message}`);
                resolve({
                    success: false,
                    error: error.message,
                    time: time
                });
            });

            req.setTimeout(5000, () => {
                req.destroy();
                const time = performance.now() - start;
                this.results.totalRequests++;
                this.results.failed++;
                this.results.times.push(time);
                console.log(`⏰ ${method} ${path} - ${time.toFixed(0)}ms - Timeout`);
                resolve({
                    success: false,
                    error: 'Timeout',
                    time: time
                });
            });

            if (data && method === 'POST') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    async simulateUser(userId, duration = 30000) {
        console.log(`👤 Usuario ${userId} iniciado`);
        const endTime = Date.now() + duration;
        let requests = 0;

        while (Date.now() < endTime) {
            // Simular diferentes tipos de requests
            const actions = [
                () => this.makeRequest('/auth/login'),
                () => this.makeRequest('/api/productos'),
                () => this.makeRequest('/api/categorias'),
                () => this.makeRequest('/api/ventas'),
                () => this.makeRequest('/api/facturas')
            ];

            const randomAction = actions[Math.floor(Math.random() * actions.length)];
            await randomAction();
            requests++;

            // Pausa entre requests (100-500ms)
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
        }

        console.log(`🏁 Usuario ${userId} completado (${requests} requests)`);
        return requests;
    }

    async runPerformanceTest(users = 20, durationSeconds = 30) {
        console.log('🚀 PRUEBA DE DESEMPEÑO CON HTTP NATIVO');
        console.log('====================================');
        console.log(`👥 Usuarios: ${users}`);
        console.log(`⏱️  Duración: ${durationSeconds} segundos`);
        console.log(`🎯 Servidor: http://${this.baseUrl}:${this.port}`);
        console.log('');

        // Resetear resultados
        this.results = {
            totalRequests: 0,
            successful: 0,
            failed: 0,
            times: [],
            errors: []
        };

        const startTime = Date.now();

        // Crear usuarios concurrentes
        const userPromises = [];
        for (let i = 1; i <= users; i++) {
            userPromises.push(this.simulateUser(i, durationSeconds * 1000));
        }

        // Esperar a que todos los usuarios terminen
        const userResults = await Promise.all(userPromises);
        const totalTime = Date.now() - startTime;

        // Mostrar resultados
        this.showResults(totalTime, userResults);
    }

    showResults(totalTime, userResults) {
        console.log('\n📊 RESULTADOS DE LA PRUEBA DE DESEMPEÑO');
        console.log('=======================================');
        console.log(`⏱️  Tiempo total: ${(totalTime / 1000).toFixed(1)}s`);
        console.log(`🔢 Total requests: ${this.results.totalRequests}`);
        console.log(`✅ Exitosos: ${this.results.successful}`);
        console.log(`❌ Fallidos: ${this.results.failed}`);
        
        if (this.results.totalRequests > 0) {
            console.log(`📈 Tasa de éxito: ${((this.results.successful / this.results.totalRequests) * 100).toFixed(1)}%`);
            console.log(`📊 Requests/segundo: ${(this.results.totalRequests / (totalTime / 1000)).toFixed(1)}`);
        }

        if (this.results.times.length > 0) {
            const avgTime = this.results.times.reduce((a, b) => a + b, 0) / this.results.times.length;
            const minTime = Math.min(...this.results.times);
            const maxTime = Math.max(...this.results.times);
            
            console.log(`⏱️  Tiempo promedio: ${avgTime.toFixed(1)}ms`);
            console.log(`⏱️  Tiempo mínimo: ${minTime.toFixed(1)}ms`);
            console.log(`⏱️  Tiempo máximo: ${maxTime.toFixed(1)}ms`);
        }

        console.log('\n👥 RESULTADOS POR USUARIO');
        console.log('=========================');
        userResults.forEach((requests, index) => {
            console.log(`Usuario ${index + 1}: ${requests} requests`);
        });

        if (this.results.errors.length > 0) {
            console.log('\n❌ ERRORES ENCONTRADOS');
            console.log('======================');
            const errorCounts = {};
            this.results.errors.forEach(error => {
                errorCounts[error] = (errorCounts[error] || 0) + 1;
            });
            
            Object.entries(errorCounts).forEach(([error, count]) => {
                console.log(`${error}: ${count} veces`);
            });
        }

        console.log('\n🎯 EVALUACIÓN GENERAL');
        console.log('=====================');
        const successRate = (this.results.successful / this.results.totalRequests) * 100;
        
        if (successRate >= 95) {
            console.log('🟢 EXCELENTE: Sistema funciona muy bien bajo carga');
        } else if (successRate >= 80) {
            console.log('🟡 BUENO: Sistema funciona aceptablemente bajo carga');
        } else if (successRate >= 50) {
            console.log('🟠 REGULAR: Sistema tiene problemas bajo carga');
        } else {
            console.log('🔴 MALO: Sistema requiere atención inmediata');
        }
    }
}

// Ejecutar prueba
const test = new PerformanceTestSimple();
test.runPerformanceTest(20, 30).catch(console.error);