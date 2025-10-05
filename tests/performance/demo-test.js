const SimpleLoadTest = require('./simple-load-test.js');

// Configuración para demo: 5 usuarios por 30 segundos
const loadTest = new SimpleLoadTest();

console.log('🚀 DEMO: Prueba de Desempeño - Ferretería G&L');
console.log('===============================================');
console.log('👥 Usuarios concurrentes: 5 (demo)');
console.log('⏱️  Duración: 30 segundos');
console.log('🎯 Endpoints: productos, facturas, ventas\n');

loadTest.runLoadTest(5, 0.5)
    .then(() => {
        console.log('\n✅ Demo de prueba de desempeño completada');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Error en demo:', error.message);
        process.exit(1);
    });