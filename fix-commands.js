const fs = require('fs');
const path = require('path');

const commandsDir = path.join(__dirname, 'comandos');
const files = fs.readdirSync(commandsDir).filter(file => file.endsWith('.js'));

console.log(`Corrigindo ${files.length} arquivos de comandos...`);

files.forEach(file => {
    const filePath = path.join(commandsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Substituir async run( por async execute(
    const originalContent = content;
    content = content.replace(/async run\(client, interaction\)/g, 'async execute(interaction)');
    
    // Se houve mudanças, salvar o arquivo
    if (content !== originalContent) {
        fs.writeFileSync(filePath, content);
        console.log(`✅ Corrigido: ${file}`);
    }
});

console.log('✅ Correção concluída!');
