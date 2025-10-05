#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

class JWTSecurityTester {
    constructor() {
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        this.jwtSecret = process.env.JWT_SECRET || 'clave secreta_jwt';
        this.results = {
            totalTests: 0,
            vulnerabilities: [],
            tokenTests: [],
            bypassAttempts: []
        };
    }

    // Generar tokens JWT maliciosos
    generateMaliciousTokens() {
        const now = Math.floor(Date.now() / 1000);
        
        return {
            // Token con algoritmo 'none'
            noneAlgorithm: this.createNoneToken({ userId: 1, username: 'admin' }),
            
            // Token expirado
            expired: jwt.sign(
                { userId: 1, username: 'admin', exp: now - 3600 },
                this.jwtSecret
            ),
            
            // Token con claims maliciosos
            adminEscalation: jwt.sign(
                { userId: 1, username: 'admin', role: 'admin', isAdmin: true },
                this.jwtSecret
            ),
            
            // Token con diferentes algoritmos
            hs384: jwt.sign({ userId: 1, username: 'admin' }, this.jwtSecret, { algorithm: 'HS384' }),
            hs512: jwt.sign({ userId: 1, username: 'admin' }, this.jwtSecret, { algorithm: 'HS512' }),
            
            // Token con payload masivo
            massivePayload: jwt.sign({
                userId: 1,
                username: 'admin',
                data: 'A'.repeat(10000), // 10KB de datos
                timestamp: now
            }, this.jwtSecret),
            
            // Token con claims especiales
            specialClaims: jwt.sign({
                userId: 1,
                username: 'admin',
                aud: 'malicious-audience',
                iss: 'malicious-issuer',
                sub: 'admin-bypass'
            }, this.jwtSecret)
        };
    }

    createNoneToken(payload) {
        const header = { alg: 'none', typ: 'JWT' };
        const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        return `${encodedHeader}.${encodedPayload}.`;
    }

    // Test de bypass de autenticación JWT
    async testJWTBypass() {
        console.log('\n🔓 PRUEBAS DE BYPASS JWT');
        console.log('========================');

        const bypassPayloads = [
            { name: 'Sin Authorization header', headers: {} },
            { name: 'Bearer vacío', headers: { 'Authorization': 'Bearer ' } },
            { name: 'Bearer null', headers: { 'Authorization': 'Bearer null' } },
            { name: 'Bearer undefined', headers: { 'Authorization': 'Bearer undefined' } },
            { name: 'Token sin Bearer', headers: { 'Authorization': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...' } },
            { name: 'Header malformado', headers: { 'Authorization': 'Malformed token here' } },
            { name: 'Token con espacios', headers: { 'Authorization': 'Bearer   eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...   ' } },
            { name: 'Multiple tokens', headers: { 'Authorization': 'Bearer token1, Bearer token2' } },
            { name: 'JWT en cookie', headers: {}, cookies: 'token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...' },
            { name: 'Case sensitivity', headers: { 'authorization': 'bearer token' } }
        ];

        const protectedEndpoints = [
            '/api/productos',
            '/api/categorias',
            '/api/ventas',
            '/dashboard'
        ];

        for (const endpoint of protectedEndpoints) {
            console.log(`\n🎯 Probando ${endpoint}`);
            
            for (const payload of bypassPayloads) {
                await this.testBypassPayload(endpoint, payload);
            }
        }
    }

    async testBypassPayload(endpoint, payload) {
        this.results.totalTests++;
        
        try {
            const config = {
                method: 'GET',
                url: `${this.baseUrl}${endpoint}`,
                headers: payload.headers,
                timeout: 5000,
                validateStatus: () => true
            };

            if (payload.cookies) {
                config.headers['Cookie'] = payload.cookies;
            }

            const response = await axios(config);
            
            // Si devuelve 200, podría ser un bypass
            const isBypass = response.status === 200;
            
            this.results.bypassAttempts.push({
                endpoint: endpoint,
                method: payload.name,
                status: response.status,
                bypass: isBypass
            });

            if (isBypass) {
                console.log(`❌ BYPASS DETECTADO: ${payload.name} - Status: ${response.status}`);
                this.results.vulnerabilities.push({
                    type: 'JWT Bypass',
                    endpoint: endpoint,
                    method: payload.name,
                    status: response.status
                });
            } else {
                console.log(`✅ SEGURO: ${payload.name} - Status: ${response.status}`);
            }

        } catch (error) {
            console.log(`⚠️  ERROR: ${payload.name} - ${error.message}`);
        }
    }

    // Test de tokens JWT maliciosos
    async testMaliciousTokens() {
        console.log('\n💀 PRUEBAS DE TOKENS MALICIOSOS');
        console.log('================================');

        const maliciousTokens = this.generateMaliciousTokens();
        const protectedEndpoints = ['/api/productos', '/api/ventas'];

        for (const [tokenType, token] of Object.entries(maliciousTokens)) {
            console.log(`\n🧪 Probando token: ${tokenType}`);
            
            for (const endpoint of protectedEndpoints) {
                await this.testMaliciousToken(endpoint, tokenType, token);
            }
        }
    }

    async testMaliciousToken(endpoint, tokenType, token) {
        this.results.totalTests++;
        
        try {
            const response = await axios.get(`${this.baseUrl}${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 5000,
                validateStatus: () => true
            });

            const isVulnerable = response.status === 200;
            
            this.results.tokenTests.push({
                endpoint: endpoint,
                tokenType: tokenType,
                status: response.status,
                vulnerable: isVulnerable,
                token: token.substring(0, 50) + '...'
            });

            if (isVulnerable) {
                console.log(`❌ VULNERABLE: ${endpoint} acepta token ${tokenType}`);
                this.results.vulnerabilities.push({
                    type: 'Malicious Token Accepted',
                    endpoint: endpoint,
                    tokenType: tokenType,
                    token: token.substring(0, 50) + '...'
                });
            } else {
                console.log(`✅ RECHAZADO: ${endpoint} rechaza token ${tokenType} - Status: ${response.status}`);
            }

        } catch (error) {
            console.log(`⚠️  ERROR con token ${tokenType}: ${error.message}`);
        }
    }

    // Test de algoritmos débiles
    async testWeakAlgorithms() {
        console.log('\n🔐 PRUEBAS DE ALGORITMOS DÉBILES');
        console.log('=================================');

        const weakTokens = [
            // Algoritmo none
            'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4ifQ.',
            
            // Algoritmo HS256 con clave débil
            jwt.sign({ userId: 1, username: 'admin' }, 'weak', { algorithm: 'HS256' }),
            jwt.sign({ userId: 1, username: 'admin' }, '123456', { algorithm: 'HS256' }),
            jwt.sign({ userId: 1, username: 'admin' }, 'password', { algorithm: 'HS256' }),
            
            // Token con estructura malformada
            'malformed.token.structure',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.malformed-payload.invalid-signature'
        ];

        for (const token of weakTokens) {
            await this.testWeakToken(token);
        }
    }

    async testWeakToken(token) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/productos`, {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 5000,
                validateStatus: () => true
            });

            if (response.status === 200) {
                console.log(`❌ ALGORITMO DÉBIL ACEPTADO: ${token.substring(0, 30)}...`);
                this.results.vulnerabilities.push({
                    type: 'Weak Algorithm',
                    token: token.substring(0, 50) + '...',
                    status: response.status
                });
            } else {
                console.log(`✅ ALGORITMO RECHAZADO: Status ${response.status}`);
            }

        } catch (error) {
            console.log(`⚠️  Error con algoritmo débil: ${error.message}`);
        }
    }

    // Test de timing attacks
    async testTimingAttacks() {
        console.log('\n⏱️  PRUEBAS DE TIMING ATTACKS');
        console.log('=============================');

        const tokens = [
            'valid-looking-but-fake-token-' + 'a'.repeat(100),
            jwt.sign({ userId: 1 }, 'wrong-secret'),
            jwt.sign({ userId: 1 }, this.jwtSecret), // Token válido para comparar
            'completely-invalid-token'
        ];

        const times = [];
        
        for (const token of tokens) {
            const startTime = Date.now();
            
            try {
                await axios.get(`${this.baseUrl}/api/productos`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 5000,
                    validateStatus: () => true
                });
            } catch (error) {
                // Ignorar errores para este test
            }
            
            const responseTime = Date.now() - startTime;
            times.push({ token: token.substring(0, 30), time: responseTime });
            console.log(`Token: ${token.substring(0, 30)}... - Tiempo: ${responseTime}ms`);
        }

        // Analizar variaciones de tiempo
        const avgTime = times.reduce((sum, t) => sum + t.time, 0) / times.length;
        const maxVariation = Math.max(...times.map(t => Math.abs(t.time - avgTime)));
        
        if (maxVariation > 100) {
            console.log(`⚠️  POSIBLE TIMING ATTACK: Variación máxima ${maxVariation}ms`);
            this.results.vulnerabilities.push({
                type: 'Timing Attack Vulnerability',
                maxVariation: maxVariation,
                avgTime: avgTime
            });
        } else {
            console.log(`✅ Tiempos consistentes: Variación máxima ${maxVariation}ms`);
        }
    }

    generateJWTReport() {
        console.log('\n📊 REPORTE DE SEGURIDAD JWT');
        console.log('============================');
        console.log(`🔢 Total de pruebas: ${this.results.totalTests}`);
        console.log(`🚨 Vulnerabilidades: ${this.results.vulnerabilities.length}`);

        if (this.results.vulnerabilities.length > 0) {
            console.log('\n🔴 VULNERABILIDADES JWT ENCONTRADAS');
            console.log('====================================');
            
            this.results.vulnerabilities.forEach((vuln, index) => {
                console.log(`\n${index + 1}. ${vuln.type}`);
                if (vuln.endpoint) console.log(`   Endpoint: ${vuln.endpoint}`);
                if (vuln.method) console.log(`   Método: ${vuln.method}`);
                if (vuln.tokenType) console.log(`   Tipo de token: ${vuln.tokenType}`);
                if (vuln.status) console.log(`   Status: ${vuln.status}`);
            });
        }

        // Estadísticas de bypass
        const bypassSuccess = this.results.bypassAttempts.filter(attempt => attempt.bypass).length;
        const totalBypassAttempts = this.results.bypassAttempts.length;
        
        console.log(`\n🔓 Intentos de bypass: ${bypassSuccess}/${totalBypassAttempts}`);
        
        if (bypassSuccess > 0) {
            console.log('❌ CRÍTICO: Se encontraron formas de bypass JWT');
        } else {
            console.log('✅ JWT correctamente protegido contra bypass');
        }
    }

    async runJWTTests() {
        console.log('🔐 PRUEBAS ESPECIALIZADAS DE JWT');
        console.log('=================================');
        console.log(`📡 Servidor objetivo: ${this.baseUrl}`);

        await this.testJWTBypass();
        await this.testMaliciousTokens();
        await this.testWeakAlgorithms();
        await this.testTimingAttacks();
        
        this.generateJWTReport();
    }
}

// Ejecutar pruebas JWT
const jwtTester = new JWTSecurityTester();
jwtTester.runJWTTests().catch(console.error);