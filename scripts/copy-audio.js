const fs = require('fs');

// Criar diretório rc se não existir
fs.mkdirSync('public/audio/rc', {recursive: true});

// Copiar os arquivos gerados para o diretório correto
fs.copyFileSync('public/audio/gg/fall-whoosh.wav', 'public/audio/rc/fall-whoosh.wav');
fs.copyFileSync('public/audio/gg/breath-land.wav', 'public/audio/rc/breath-land.wav');

console.log('✓ Arquivos copiados para public/audio/rc/');
console.log('  - fall-whoosh.wav');
console.log('  - breath-land.wav');
