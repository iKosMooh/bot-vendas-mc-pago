# Script para atualizar caminhos dos arquivos JSON
$filePath = "d:\Sites\bot-vendas-mc-pago\utils\mercadoPago.js"
$content = Get-Content $filePath -Raw

# Substituir todas as referências para a pasta data
$content = $content -replace "path\.join\(__dirname, '\.\.', 'payments\.json'\)", "path.join(__dirname, '..', 'data', 'payments.json')"
$content = $content -replace "path\.join\(__dirname, '\.\.', 'produtos\.json'\)", "path.join(__dirname, '..', 'data', 'produtos.json')"
$content = $content -replace "path\.join\(__dirname, '\.\.', 'links\.json'\)", "path.join(__dirname, '..', 'data', 'links.json')"

Set-Content $filePath $content -Encoding UTF8
Write-Host "Caminhos atualizados no mercadoPago.js"
