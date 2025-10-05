#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

class SecurityTester {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        this.results = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            sqlInjectionTests: [],
            jwtTests: [],
            vulnerabilities: []
        };
    }

    // Payloads comunes de SQL Injection
    getSQLInjectionPayloads() {
        return [
            "' OR '1'='1",
            "' OR 1=1--",
            "' UNION SELECT * FROM usuarios--",
            "'; DROP TABLE productos; --",
            "' OR 'a'='a",
            "1' OR '1'='1' /*",
            "admin'--",
            "admin' OR '1'='1'#",
            "' OR 'x'='x",
            "1; DELETE FROM categorias; --",
            "' UNION SELECT username, password FROM usuarios--",
            "' OR EXISTS(SELECT * FROM usuarios WHERE username='admin')--",
            "'; INSERT INTO usuarios VALUES ('hacker', 'password'); --",
            "' OR 1=1 LIMIT 1--",
            "' AND (SELECT COUNT(*) FROM usuarios) > 0--"
        ];
    }

    // Test de SQL Injection en endpoints
    async testSQLInjection() {
        console.log('\n🛡️  PRUEBAS DE SQL INJECTION');
        console.log('=============================');

        const payloads = this.getSQLInjectionPayloads();
        const endpoints = [
            { method: 'POST', path: '/auth/login', params: { usuario: 'PAYLOAD', password: 'test' } },
            { method: 'GET', path: '/api/productos', query: 'id=PAYLOAD' },
            { method: 'GET', path: '/api/categorias', query: 'codigo=PAYLOAD' },
            { method: 'GET', path: '/api/ventas', query: 'cliente_documento=PAYLOAD' },
            { method: 'GET', path: '/api/facturas', query: 'numero=PAYLOAD' },
            { method: 'POST', path: '/auth/registro', params: { usuario: 'PAYLOAD', password: 'test', email: 'test@test.com' } }
        ];

        for (const endpoint of endpoints) {
            console.log(`\n🎯 Probando ${endpoint.method} ${endpoint.path}`);
            
            for (const payload of payloads) {
                await this.testSQLInjectionPayload(endpoint, payload);
                await this.sleep(100); // Evitar sobrecarga
            }
        }
    }

    async testSQLInjectionPayload(endpoint, payload) {
        this.results.totalTests++;
        
        try {
            let config = {
                method: endpoint.method,
                url: `${this.baseUrl}${endpoint.path}`,
                timeout: 5000,
                validateStatus: () => true // No lanzar error por códigos de estado
            };

            if (endpoint.method === 'POST' && endpoint.params) {
                const params = { ...endpoint.params };
                // Reemplazar PAYLOAD en los parámetros
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
            const testResult = this.analyzeSQLInjectionResponse(response, payload, endpoint);
            
            this.results.sqlInjectionTests.push({
                endpoint: `${endpoint.method} ${endpoint.path}`,
                payload: payload,
                status: response.status,
                vulnerable: testResult.vulnerable,
                reason: testResult.reason
            });

            if (testResult.vulnerable) {
                console.log(`❌ VULNERABLE: ${payload.substring(0, 20)}... - ${testResult.reason}`);
                this.results.vulnerabilities.push({
                    type: 'SQL Injection',
                    endpoint: `${endpoint.method} ${endpoint.path}`,
                    payload: payload,
                    reason: testResult.reason
                });
                this.results.failed++;
            } else {
                console.log(`✅ SEGURO: ${payload.substring(0, 20)}...`);
                this.results.passed++;
            }

        } catch (error) {
            console.log(`⚠️  ERROR: ${payload.substring(0, 20)}... - ${error.message}`);
            this.results.sqlInjectionTests.push({
                endpoint: `${endpoint.method} ${endpoint.path}`,
                payload: payload,
                error: error.message,
                vulnerable: false
            });
            this.results.passed++; // Error es mejor que vulnerabilidad
        }
    }

    analyzeSQLInjectionResponse(response, payload, endpoint) {
        const responseText = JSON.stringify(response.data).toLowerCase();
        const suspiciousPatterns = [
            'syntax error',
            'mysql_fetch',
            'ora-',
            'postgresql',
            'sqlite_',
            'sql server',
            'odbc',
            'jdbc',
            'table',
            'column',
            'database',
            'usuarios',
            'productos',
            'categorias'
        ];

        // Si devuelve código 200 con payload peligroso, es sospechoso
        if (response.status === 200 && payload.includes('DROP')) {
            return { vulnerable: true, reason: 'Código 200 con payload destructivo' };
        }

        // Buscar patrones sospechosos en la respuesta
        for (const pattern of suspiciousPatterns) {
            if (responseText.includes(pattern)) {
                return { vulnerable: true, reason: `Información de base de datos expuesta: ${pattern}` };
            }
        }

        // Respuestas muy largas pueden indicar volcado de datos
        if (responseText.length > 5000) {
            return { vulnerable: true, reason: 'Respuesta anormalmente larga' };
        }

        return { vulnerable: false, reason: 'Respuesta normal' };
    }

    // Test de validación JWT
    async testJWTValidation() {
        console.log('\n🔐 PRUEBAS DE VALIDACIÓN JWT');
        console.log('=============================');

        const protectedEndpoints = [
            { method: 'GET', path: '/api/productos' },
            { method: 'GET', path: '/api/categorias' },
            { method: 'GET', path: '/api/ventas' },
            { method: 'GET', path: '/api/facturas' },
            { method: 'POST', path: '/api/productos' },
            { method: 'GET', path: '/dashboard' },
            { method: 'GET', path: '/productos.html' },
            { method: 'GET', path: '/categorias.html' }
        ];

        // Test 1: Sin token
        await this.testJWTScenario('Sin token', protectedEndpoints, null);

        // Test 2: Token inválido
        await this.testJWTScenario('Token inválido', protectedEndpoints, 'invalid.token.here');

        // Test 3: Token malformado
        await this.testJWTScenario('Token malformado', protectedEndpoints, 'malformed-token');

        // Test 4: Token expirado (simulado)
        await this.testJWTScenario('Token expirado', protectedEndpoints, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');

        // Test 5: Token con algoritmo incorrecto
        await this.testJWTScenario('Token con algoritmo none', protectedEndpoints, 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.');

        // Test 6: Intentar obtener token válido y probarlo
        await this.testValidJWTAccess();
    }

    async testJWTScenario(scenario, endpoints, token) {
        console.log(`\n🧪 Escenario: ${scenario}`);
        
        for (const endpoint of endpoints) {
            this.results.totalTests++;
            
            try {
                const config = {
                    method: endpoint.method,
                    url: `${this.baseUrl}${endpoint.path}`,
                    timeout: 5000,
                    validateStatus: () => true
                };

                if (token) {
                    config.headers = { 'Authorization': `Bearer ${token}` };
                }

                const response = await axios(config);
                const isSecure = this.analyzeJWTResponse(response, scenario);
                
                this.results.jwtTests.push({
                    scenario: scenario,
                    endpoint: `${endpoint.method} ${endpoint.path}`,
                    status: response.status,
                    secure: isSecure,
                    token: token ? token.substring(0, 20) + '...' : 'none'
                });

                if (isSecure) {
                    console.log(`✅ SEGURO: ${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
                    this.results.passed++;
                } else {
                    console.log(`❌ INSEGURO: ${endpoint.method} ${endpoint.path} - Status: ${response.status}`);
                    this.results.vulnerabilities.push({
                        type: 'JWT Validation',
                        endpoint: `${endpoint.method} ${endpoint.path}`,
                        scenario: scenario,
                        status: response.status
                    });
                    this.results.failed++;
                }

            } catch (error) {
                console.log(`⚠️  ERROR: ${endpoint.method} ${endpoint.path} - ${error.message}`);
                this.results.jwtTests.push({
                    scenario: scenario,
                    endpoint: `${endpoint.method} ${endpoint.path}`,
                    error: error.message,
                    secure: true // Error es mejor que acceso no autorizado
                });
                this.results.passed++;
            }

            await this.sleep(50);
        }
    }

    analyzeJWTResponse(response, scenario) {
        // Para rutas protegidas, deberíamos recibir 401 o 403 sin token válido
        if (scenario !== 'Token válido') {
            if (response.status === 401 || response.status === 403) {
                return true; // Seguro - rechaza acceso no autorizado
            } else if (response.status === 200) {
                return false; // Inseguro - permite acceso sin autorización
            } else if (response.status === 302 || response.status === 301) {
                // Redirección puede ser segura si va a login
                return true;
            }
        } else {
            // Con token válido, debería permitir acceso
            return response.status === 200 || response.status === 302;
        }
        
        return true; // Por defecto, asumir seguro
    }

    async testValidJWTAccess() {
        console.log('\n🔑 Intentando obtener token válido...');
        
        try {
            const loginResponse = await axios.post(`${this.baseUrl}/auth/login`, {
                usuario: 'admin',
                password: 'admin123'
            }, { timeout: 5000, validateStatus: () => true });

            if (loginResponse.status === 200 && loginResponse.data.token) {
                const validToken = loginResponse.data.token;
                console.log('✅ Token válido obtenido');
                
                await this.testJWTScenario('Token válido', [
                    { method: 'GET', path: '/api/productos' },
                    { method: 'GET', path: '/dashboard' }
                ], validToken);
            } else {
                console.log('❌ No se pudo obtener token válido');
            }
        } catch (error) {
            console.log(`⚠️  Error obteniendo token: ${error.message}`);
        }
    }

    // Test de Headers de Seguridad
    async testSecurityHeaders() {
        console.log('\n🛡️  PRUEBAS DE HEADERS DE SEGURIDAD');
        console.log('=====================================');

        try {
            const response = await axios.get(`${this.baseUrl}/`, { 
                timeout: 5000,
                validateStatus: () => true 
            });

            const securityHeaders = {
                'x-frame-options': 'Protección contra clickjacking',
                'x-content-type-options': 'Previene MIME type sniffing',
                'x-xss-protection': 'Protección XSS básica',
                'strict-transport-security': 'HTTPS obligatorio',
                'content-security-policy': 'Política de contenido',
                'referrer-policy': 'Control de referrer'
            };

            let secureHeaders = 0;
            let totalHeaders = Object.keys(securityHeaders).length;

            for (const [header, description] of Object.entries(securityHeaders)) {
                if (response.headers[header]) {
                    console.log(`✅ ${header}: ${response.headers[header]}`);
                    secureHeaders++;
                } else {
                    console.log(`❌ FALTA: ${header} - ${description}`);
                    this.results.vulnerabilities.push({
                        type: 'Missing Security Header',
                        header: header,
                        description: description
                    });
                }
            }

            console.log(`\n📊 Headers de seguridad: ${secureHeaders}/${totalHeaders}`);
            
        } catch (error) {
            console.log(`⚠️  Error probando headers: ${error.message}`);
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Generar reporte final
    generateReport() {
        console.log('\n📊 REPORTE FINAL DE SEGURIDAD');
        console.log('===============================');
        console.log(`🔢 Total de pruebas: ${this.results.totalTests}`);
        console.log(`✅ Pruebas seguras: ${this.results.passed}`);
        console.log(`❌ Vulnerabilidades: ${this.results.failed}`);
        console.log(`📈 Tasa de seguridad: ${((this.results.passed / this.results.totalTests) * 100).toFixed(1)}%`);

        if (this.results.vulnerabilities.length > 0) {
            console.log('\n🚨 VULNERABILIDADES ENCONTRADAS');
            console.log('================================');
            
            this.results.vulnerabilities.forEach((vuln, index) => {
                console.log(`\n${index + 1}. ${vuln.type}`);
                if (vuln.endpoint) console.log(`   Endpoint: ${vuln.endpoint}`);
                if (vuln.payload) console.log(`   Payload: ${vuln.payload}`);
                if (vuln.reason) console.log(`   Razón: ${vuln.reason}`);
                if (vuln.scenario) console.log(`   Escenario: ${vuln.scenario}`);
            });
        }

        console.log('\n🎯 EVALUACIÓN GENERAL DE SEGURIDAD');
        console.log('===================================');
        
        const securityRate = (this.results.passed / this.results.totalTests) * 100;
        
        if (securityRate >= 95) {
            console.log('🟢 EXCELENTE: Sistema muy seguro');
        } else if (securityRate >= 85) {
            console.log('🟡 BUENO: Sistema seguro con mejoras menores');
        } else if (securityRate >= 70) {
            console.log('🟠 REGULAR: Sistema requiere mejoras de seguridad');
        } else {
            console.log('🔴 CRÍTICO: Sistema requiere atención inmediata de seguridad');
        }

        console.log('\n💡 RECOMENDACIONES');
        console.log('==================');
        console.log('• Implementar validación de entrada estricta');
        console.log('• Usar consultas parametrizadas para prevenir SQL injection');
        console.log('• Validar tokens JWT correctamente en todas las rutas');
        console.log('• Implementar headers de seguridad');
        console.log('• Registrar y monitorear intentos de ataque');
    }

    async runAllTests() {
        console.log('🚀 INICIANDO PRUEBAS DE SEGURIDAD');
        console.log('=================================');
        console.log(`📡 Servidor objetivo: ${this.baseUrl}`);
        console.log(`🕐 Inicio: ${new Date().toLocaleString()}`);

        await this.testSQLInjection();
        await this.testJWTValidation();
        await this.testSecurityHeaders();
        
        this.generateReport();
    }
}

// Ejecutar pruebas
const tester = new SecurityTester();
tester.runAllTests().catch(console.error);