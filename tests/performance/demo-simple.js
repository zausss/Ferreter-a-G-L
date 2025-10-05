#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

class DemoSimple {
    constructor() {
        this.results = {
            totalRequests: 0,
            successful: 0,
            failed: 0,
            times: []
        };
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async testConnection() {
        console.log('🔍 Verificando conectividad...');
        try {
            const start = Date.now();
            const response = await axios.get(`${BASE_URL}/auth/login`, {
                timeout: 5000
            });
            const time = Date.now() - start;
            console.log(`✅ Servidor accesible - ${time}ms - Status: ${response.status}`);
            return true;
        } catch (error) {
            console.log(`❌ Error de conectividad: ${error.message}`);
            return false;
        }
    }

    async login() {
        try {
            const response = await axios.post(`${BASE_URL}/auth/login`, {
                usuario: 'admin',
                password: 'admin123'
            }, {
                timeout: 5000
            });
            return response.data.token;
        } catch (error) {
            console.log(`❌ Login falló: ${error.message}`);
            return null;
        }
    }

    async testEndpoint(endpoint, token = null, method = 'GET') {
        const start = Date.now();
        try {
            const headers = {};
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await axios({
                method,
                url: `${BASE_URL}${endpoint}`,
                headers,
                timeout: 5000
            });

            const time = Date.now() - start;
            this.results.totalRequests++;
            this.results.successful++;
            this.results.times.push(time);
            
            console.log(`✅ ${method} ${endpoint} - ${time}ms - Status: ${response.status}`);
            return { success: true, time, status: response.status };
        } catch (error) {
            const time = Date.now() - start;
            this.results.totalRequests++;
            this.results.failed++;
            this.results.times.push(time);
            
            console.log(`❌ ${method} ${endpoint} - ${time}ms - Error: ${error.message}`);
            return { success: false, time, error: error.message };
        }
    }

    async runDemo() {
        console.log('🚀 DEMO SIMPLE DE DESEMPEÑO');
        console.log('============================');
        
        // Verificar conectividad
        const isConnected = await this.testConnection();
        if (!isConnected) {
            console.log('❌ No se puede conectar al servidor. Asegúrate de que esté ejecutándose.');
            return;
        }

        console.log('\n🔐 Intentando login...');
        const token = await this.login();
        
        if (!token) {
            console.log('❌ No se pudo obtener token. Probando endpoints públicos...');
        } else {
            console.log('✅ Token obtenido exitosamente');
        }

        console.log('\n📊 Probando endpoints...');
        
        // Probar endpoints disponibles
        await this.testEndpoint('/auth/login');
        
        if (token) {
            await this.testEndpoint('/api/productos', token);
            await this.testEndpoint('/api/categorias', token);
            await this.testEndpoint('/api/ventas', token);
            await this.testEndpoint('/api/facturas', token);
        }

        this.printResults();
    }

    printResults() {
        console.log('\n📊 RESULTADOS DEL DEMO');
        console.log('=======================');
        console.log(`🔢 Total requests: ${this.results.totalRequests}`);
        console.log(`✅ Exitosos: ${this.results.successful}`);
        console.log(`❌ Fallidos: ${this.results.failed}`);
        
        if (this.results.times.length > 0) {
            const avgTime = this.results.times.reduce((a, b) => a + b, 0) / this.results.times.length;
            const minTime = Math.min(...this.results.times);
            const maxTime = Math.max(...this.results.times);
            
            console.log(`📈 Tasa de éxito: ${((this.results.successful / this.results.totalRequests) * 100).toFixed(1)}%`);
            console.log(`⏱️  Tiempo promedio: ${avgTime.toFixed(1)}ms`);
            console.log(`⏱️  Tiempo mínimo: ${minTime}ms`);
            console.log(`⏱️  Tiempo máximo: ${maxTime}ms`);
        }

        console.log('\n💡 Para pruebas completas de 20 usuarios concurrentes:');
        console.log('npm run test:performance');
    }
}

// Ejecutar demo
const demo = new DemoSimple();
demo.runDemo().catch(console.error);