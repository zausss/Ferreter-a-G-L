#!/usr/bin/env node
require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');

class SecurityTestSuite {
    constructor() {
        this.testResults = [];
        this.totalVulnerabilities = 0;
        this.baseDir = path.join(__dirname);
    }

    async runTest(testName, scriptPath) {
        console.log(`\n🔄 Ejecutando: ${testName}`);
        console.log('='.repeat(50));
        
        return new Promise((resolve) => {
            const startTime = Date.now();
            const fullPath = path.join(this.baseDir, scriptPath);
            
            exec(`node "${fullPath}"`, { cwd: this.baseDir }, (error, stdout, stderr) => {
                const duration = Date.now() - startTime;
                
                if (error) {
                    console.log(`❌ Error ejecutando ${testName}:`);
                    console.log(stderr || error.message);
                    this.testResults.push({
                        name: testName,
                        success: false,
                        duration: duration,
                        error: error.message,
                        vulnerabilities: 0
                    });
                } else {
                    // Intentar extraer número de vulnerabilidades del output
                    const vulnMatch = stdout.match(/vulnerabilidades?.+?(\d+)/i) || 
                                    stdout.match(/❌.+?(\d+)/g) ||
                                    stdout.match(/VULNERABLE|INSEGURO|BYPASS/gi);
                    
                    const vulnerabilitiesFound = vulnMatch ? (Array.isArray(vulnMatch) ? vulnMatch.length : parseInt(vulnMatch[1]) || 0) : 0;
                    
                    this.testResults.push({
                        name: testName,
                        success: true,
                        duration: duration,
                        vulnerabilities: vulnerabilitiesFound,
                        output: stdout
                    });
                    
                    this.totalVulnerabilities += vulnerabilitiesFound;
                    console.log(stdout);
                }
                
                resolve();
            });
        });
    }

    async runAllSecurityTests() {
        console.log('🛡️  SUITE COMPLETA DE PRUEBAS DE SEGURIDAD');
        console.log('==========================================');
        console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
        console.log(`🎯 Objetivo: Sistema de Ferretería G&L`);
        
        const tests = [
            {
                name: 'Pruebas Generales de Seguridad',
                script: 'security-tests.js'
            },
            {
                name: 'Pruebas Avanzadas SQL Injection',
                script: 'sql-injection-advanced.js'
            },
            {
                name: 'Pruebas Especializadas JWT',
                script: 'jwt-security-tests.js'
            }
        ];

        for (const test of tests) {
            await this.runTest(test.name, test.script);
            await this.sleep(2000); // Pausa entre pruebas
        }

        this.generateFinalReport();
    }

    generateFinalReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 REPORTE CONSOLIDADO DE SEGURIDAD');
        console.log('='.repeat(60));
        
        const successfulTests = this.testResults.filter(r => r.success);
        const failedTests = this.testResults.filter(r => !r.success);
        
        console.log(`📈 Pruebas ejecutadas: ${this.testResults.length}`);
        console.log(`✅ Pruebas exitosas: ${successfulTests.length}`);
        console.log(`❌ Pruebas fallidas: ${failedTests.length}`);
        console.log(`🚨 Total vulnerabilidades encontradas: ${this.totalVulnerabilities}`);
        
        if (failedTests.length > 0) {
            console.log('\n❌ PRUEBAS FALLIDAS:');
            failedTests.forEach(test => {
                console.log(`   • ${test.name}: ${test.error}`);
            });
        }

        console.log('\n📊 RESUMEN POR TIPO DE PRUEBA:');
        console.log('-'.repeat(40));
        
        successfulTests.forEach(test => {
            const status = test.vulnerabilities === 0 ? '🟢 SEGURO' : 
                          test.vulnerabilities <= 5 ? '🟡 ATENCIÓN' : '🔴 CRÍTICO';
            console.log(`${status} ${test.name}`);
            console.log(`   Duración: ${(test.duration / 1000).toFixed(1)}s`);
            console.log(`   Vulnerabilidades: ${test.vulnerabilities}`);
        });

        // Evaluación general
        console.log('\n🎯 EVALUACIÓN GENERAL DEL SISTEMA:');
        console.log('-'.repeat(40));
        
        if (this.totalVulnerabilities === 0) {
            console.log('🟢 EXCELENTE: No se encontraron vulnerabilidades');
            console.log('   El sistema muestra una excelente postura de seguridad');
        } else if (this.totalVulnerabilities <= 5) {
            console.log('🟡 BUENO: Pocas vulnerabilidades encontradas');
            console.log('   Se recomienda revisar y corregir los problemas menores');
        } else if (this.totalVulnerabilities <= 15) {
            console.log('🟠 REGULAR: Múltiples vulnerabilidades encontradas');
            console.log('   Es necesario implementar mejoras de seguridad importantes');
        } else {
            console.log('🔴 CRÍTICO: Muchas vulnerabilidades encontradas');
            console.log('   ⚠️  ACCIÓN INMEDIATA REQUERIDA ⚠️');
            console.log('   El sistema presenta riesgos significativos de seguridad');
        }

        // Recomendaciones
        console.log('\n💡 RECOMENDACIONES PRINCIPALES:');
        console.log('-'.repeat(40));
        console.log('1. 🛡️  Implementar validación de entrada estricta');
        console.log('2. 🔒 Usar consultas parametrizadas (prepared statements)');
        console.log('3. 🔑 Validar tokens JWT correctamente en todas las rutas');
        console.log('4. 🛠️  Implementar headers de seguridad HTTP');
        console.log('5. 📝 Configurar logging y monitoreo de seguridad');
        console.log('6. 🔍 Realizar auditorías de seguridad regulares');
        console.log('7. 🚨 Implementar rate limiting y WAF');
        
        console.log('\n📁 ARCHIVOS DE PRUEBA UTILIZADOS:');
        console.log('-'.repeat(40));
        console.log('• tests/security/security-tests.js');
        console.log('• tests/security/sql-injection-advanced.js');
        console.log('• tests/security/jwt-security-tests.js');
        
        console.log(`\n🕐 Pruebas completadas: ${new Date().toLocaleString()}`);
        console.log('='.repeat(60));
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Ejecutar suite completa
const suite = new SecurityTestSuite();
suite.runAllSecurityTests().catch(console.error);