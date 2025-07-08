const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { Rcon } = require('rcon-client');

// ========== CONFIGURAÇÕES DE VERIFICAÇÃO AUTOMÁTICA ==========
const VERIFICATION_INTERVALS = {
    EXPIRED_PRODUCTS: 1 * 60 * 1000,      // 5 minutos
    PENDING_PAYMENTS: 1 * 60 * 1000,      // 5 minutos  
    PENDING_DELIVERIES: 1 * 60 * 1000,    // 5 minutos
    LOW_STOCK: 1 * 60 * 60 * 1000         // 2 horas
};

// Configurações de limites
const STOCK_LIMITS = {
    LOW_STOCK_THRESHOLD: 5,                // Produtos com 5 ou menos unidades
    DELIVERY_WARNING_TIME: 2 * 60 * 1000 // Alertar entregas pendentes após 30 minutos
};
// ============================================================

// ===== CONFIGURAÇÕES DE VERIFICAÇÃO AUTOMÁTICA =====
const CHECK_EXPIRED_PRODUCTS_INTERVAL = 1 * 60 * 1000; // 5 minutos
const CHECK_PENDING_PAYMENTS_INTERVAL = 1 * 60 * 1000; // 5 minutos
const CHECK_PENDING_DELIVERIES_INTERVAL = 1 * 60 * 1000; // 5 minutos
const CHECK_LOW_STOCK_INTERVAL = 2 * 60 * 60 * 1000; // 2 horas

/**
 * Sistema de entrega de produtos
 */
class ProductDelivery {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'config.json');
        this.approvedPath = path.join(__dirname, '..', 'data', 'approved_purchases.json');
        this.linksPath = path.join(__dirname, '..', 'links.json');
        this.loadConfig();
        this.rconConnection = null;
    }

    /**
     * Carrega configurações do arquivo
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } else {
                this.config = {};
            }
        } catch (error) {
            console.error('❌ Erro ao carregar configurações:', error);
            this.config = {};
        }
    }

    /**
     * Conecta ao servidor RCON
     * @returns {Promise<boolean>} - Sucesso da conexão
     */
    async connectRcon() {
        try {
            if (!this.config.rcon || !this.config.rcon.host || !this.config.rcon.password) {
                throw new Error('Configuração RCON não encontrada');
            }

            if (this.rconConnection) {
                await this.rconConnection.end();
            }

            this.rconConnection = new Rcon({
                host: this.config.rcon.host,
                port: this.config.rcon.port || 25575,
                password: this.config.rcon.password
            });

            await this.rconConnection.connect();
            console.log('✅ Conectado ao servidor RCON');
            return true;
        } catch (error) {
            console.error('❌ Erro ao conectar RCON:', error);
            this.rconConnection = null;
            return false;
        }
    }

    /**
     * Executa comando no servidor
     * @param {string} command - Comando a ser executado
     * @returns {Promise<string>} - Resposta do servidor
     */
    async executeCommand(command) {
        try {
            if (!this.rconConnection) {
                const connected = await this.connectRcon();
                if (!connected) {
                    throw new Error('Não foi possível conectar ao servidor RCON');
                }
            }

            const response = await this.rconConnection.send(command);
            console.log(`📋 Comando executado: ${command}`);
            console.log(`📤 Resposta: ${response}`);
            return response;
        } catch (error) {
            console.error('❌ Erro ao executar comando:', error);
            throw error;
        }
    }

    /**
     * Entrega produto para um usuário
     * @param {string} purchaseId - ID da compra
     * @param {Object} client - Cliente Discord
     * @returns {Promise<Object>} - Resultado da entrega
     */
    async deliverProduct(purchaseId, client) {
        try {
            // Carregar compra aprovada
            if (!fs.existsSync(this.approvedPath)) {
                throw new Error('Arquivo de compras aprovadas não encontrado');
            }

            const approvedPurchases = JSON.parse(fs.readFileSync(this.approvedPath, 'utf8'));
            const purchase = approvedPurchases[purchaseId];

            if (!purchase) {
                throw new Error('Compra não encontrada');
            }

            if (purchase.delivered) {
                throw new Error('Produto já foi entregue');
            }

            // Carregar vínculo Steam do usuário
            const steamLink = this.getUserSteamLink(purchase.userId);
            if (!steamLink) {
                throw new Error('Usuário não possui conta Steam vinculada');
            }

            // Carregar dados do produto
            const product = await this.getProductData(purchase.productId);
            if (!product) {
                throw new Error('Dados do produto não encontrados');
            }

            // Executar entrega baseada no tipo do produto
            const deliveryResult = await this.executeDelivery(product, steamLink, purchase);

            if (deliveryResult.success) {
                // Marcar como entregue
                purchase.delivered = true;
                purchase.deliveredAt = new Date().toISOString();
                purchase.deliveryMethod = deliveryResult.method;
                purchase.deliveryData = deliveryResult.data;

                // Salvar alterações
                fs.writeFileSync(this.approvedPath, JSON.stringify(approvedPurchases, null, 2));

                // Enviar notificação para o usuário
                await this.sendDeliveryNotification(client, purchase, deliveryResult);

                return {
                    success: true,
                    message: 'Produto entregue com sucesso',
                    deliveryData: deliveryResult
                };
            } else {
                throw new Error(deliveryResult.error || 'Falha na entrega');
            }
        } catch (error) {
            console.error('❌ Erro na entrega do produto:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Obtém vínculo Steam do usuário
     * @param {string} userId - ID do usuário
     * @returns {Object|null} - Dados do vínculo Steam
     */
    getUserSteamLink(userId) {
        try {
            if (!fs.existsSync(this.linksPath)) {
                return null;
            }

            const links = JSON.parse(fs.readFileSync(this.linksPath, 'utf8'));
            return links[userId] || null;
        } catch (error) {
            console.error('❌ Erro ao obter vínculo Steam:', error);
            return null;
        }
    }

    /**
     * Obtém dados do produto
     * @param {string} productId - ID do produto (nome do produto)
     * @returns {Promise<Object|null>} - Dados do produto
     */
    async getProductData(productId) {
        try {
            const productsPath = path.join(__dirname, '..', 'produtos.json');
            if (!fs.existsSync(productsPath)) {
                return null;
            }

            const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
            return products[productId] || null;
        } catch (error) {
            console.error('❌ Erro ao obter dados do produto:', error);
            return null;
        }
    }

    /**
     * Executa a entrega do produto
     * @param {Object} product - Dados do produto
     * @param {Object} steamLink - Vínculo Steam
     * @param {Object} purchase - Dados da compra
     * @returns {Promise<Object>} - Resultado da entrega
     */
    async executeDelivery(product, steamLink, purchase) {
        try {
            const deliveryMethod = product.deliveryMethod || 'rcon';
            
            switch (deliveryMethod) {
                case 'rcon':
                    return await this.deliverViaRcon(product, steamLink, purchase);
                case 'manual':
                    return await this.deliverManual(product, steamLink, purchase);
                case 'code':
                    return await this.deliverCode(product, steamLink, purchase);
                default:
                    throw new Error('Método de entrega não suportado');
            }
        } catch (error) {
            console.error('❌ Erro na execução da entrega:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Entrega via RCON
     * @param {Object} product - Dados do produto
     * @param {Object} steamLink - Vínculo Steam
     * @param {Object} purchase - Dados da compra
     * @returns {Promise<Object>} - Resultado da entrega
     */
    async deliverViaRcon(product, steamLink, purchase) {
        try {
            // Usar approval_command do produto
            const approvalCommand = product.approval_command;
            if (!approvalCommand) {
                throw new Error('Nenhum comando de aprovação definido para este produto');
            }

            // Substituir variáveis no comando
            const finalCommand = approvalCommand
                .replace('{steamid}', steamLink.steamId)
                .replace('{username}', steamLink.discord || steamLink.username || 'Unknown')
                .replace('{product}', product.name)
                .replace('{quantity}', purchase.quantity || 1);

            const response = await this.executeCommand(finalCommand);
            
            return {
                success: true,
                method: 'rcon',
                data: {
                    command: finalCommand,
                    response: response,
                    steamId: steamLink.steamId
                }
            };
        } catch (error) {
            console.error('❌ Erro na entrega via RCON:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Entrega manual
     * @param {Object} product - Dados do produto
     * @param {Object} steamLink - Vínculo Steam
     * @param {Object} purchase - Dados da compra
     * @returns {Promise<Object>} - Resultado da entrega
     */
    async deliverManual(product, steamLink, purchase) {
        // Para entrega manual, apenas marca como pendente de entrega manual
        return {
            success: true,
            method: 'manual',
            data: {
                message: 'Produto marcado para entrega manual',
                steamId: steamLink.steamId,
                instructions: product.deliveryInstructions || 'Entrega manual necessária'
            }
        };
    }

    /**
     * Entrega por código
     * @param {Object} product - Dados do produto
     * @param {Object} steamLink - Vínculo Steam
     * @param {Object} purchase - Dados da compra
     * @returns {Promise<Object>} - Resultado da entrega
     */
    async deliverCode(product, steamLink, purchase) {
        try {
            // Gerar ou obter código do produto
            const code = this.generateProductCode(product);
            
            return {
                success: true,
                method: 'code',
                data: {
                    code: code,
                    instructions: product.codeInstructions || 'Use o código fornecido'
                }
            };
        } catch (error) {
            console.error('❌ Erro na entrega por código:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Gera código do produto
     * @param {Object} product - Dados do produto
     * @returns {string} - Código gerado
     */
    generateProductCode(product) {
        if (product.codes && product.codes.length > 0) {
            // Retornar código pré-definido
            return product.codes.shift(); // Remove o primeiro código da lista
        } else {
            // Gerar código aleatório
            return `${product.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
        }
    }

    /**
     * Envia notificação de entrega
     * @param {Object} client - Cliente Discord
     * @param {Object} purchase - Dados da compra
     * @param {Object} deliveryResult - Resultado da entrega
     */
    async sendDeliveryNotification(client, purchase, deliveryResult) {
        try {
            const user = await client.users.fetch(purchase.userId);
            if (!user) return;

            const embed = new EmbedBuilder()
                .setTitle('🎁 Produto Entregue!')
                .setDescription(`Seu produto **${purchase.productName}** foi entregue com sucesso!`)
                .addFields(
                    { name: '📦 Produto', value: purchase.productName, inline: true },
                    { name: '💰 Valor', value: `R$ ${purchase.amount}`, inline: true },
                    { name: '🚚 Método', value: deliveryResult.method, inline: true },
                    { name: '📅 Entregue em', value: new Date().toLocaleString('pt-BR'), inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            // Adicionar informações específicas do método de entrega
            if (deliveryResult.method === 'code') {
                embed.addFields({
                    name: '🔑 Código do Produto',
                    value: `\`${deliveryResult.data.code}\``,
                    inline: false
                });
                if (deliveryResult.data.instructions) {
                    embed.addFields({
                        name: '📋 Instruções',
                        value: deliveryResult.data.instructions,
                        inline: false
                    });
                }
            } else if (deliveryResult.method === 'manual') {
                embed.addFields({
                    name: '📋 Instruções',
                    value: deliveryResult.data.instructions,
                    inline: false
                });
            }

            await user.send({ embeds: [embed] });
        } catch (error) {
            console.error('❌ Erro ao enviar notificação:', error);
        }
    }

    /**
     * Testa conexão RCON
     * @returns {Promise<Object>} - Resultado do teste
     */
    async testRconConnection() {
        try {
            const connected = await this.connectRcon();
            if (!connected) {
                throw new Error('Falha na conexão RCON');
            }

            const response = await this.executeCommand('list');
            
            return {
                success: true,
                message: 'Conexão RCON estabelecida com sucesso',
                response: response
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Fecha conexão RCON
     */
    async closeRconConnection() {
        if (this.rconConnection) {
            try {
                await this.rconConnection.end();
                this.rconConnection = null;
                console.log('✅ Conexão RCON fechada');
            } catch (error) {
                console.error('❌ Erro ao fechar conexão RCON:', error);
            }
        }
    }

    /**
     * Inicia verificações automáticas de expiração
     */
    startExpiryChecker() {
        console.log('🔄 Configurando verificações automáticas...');
        console.log(`⚙️ Intervalos configurados:`);
        console.log(`  ⏰ Produtos expirados: ${CHECK_EXPIRED_PRODUCTS_INTERVAL / 1000 / 60} minutos`);
        console.log(`  💳 Pagamentos pendentes: ${CHECK_PENDING_PAYMENTS_INTERVAL / 1000 / 60} minutos`);
        console.log(`  🚚 Entregas pendentes: ${CHECK_PENDING_DELIVERIES_INTERVAL / 1000 / 60} minutos`);
        console.log(`  📦 Estoque baixo: ${CHECK_LOW_STOCK_INTERVAL / 1000 / 60 / 60} horas`);
        
        // Verificação de produtos expirados
        setInterval(() => {
            console.log('⏰ Iniciando verificação automática de produtos expirados...');
            this.checkExpiredProducts();
        }, CHECK_EXPIRED_PRODUCTS_INTERVAL);
        
        // Verificação de pagamentos pendentes
        setInterval(() => {
            console.log('💳 Iniciando verificação automática de pagamentos pendentes...');
            this.checkPendingPayments();
        }, CHECK_PENDING_PAYMENTS_INTERVAL);
        
        // Verificação de entregas pendentes
        setInterval(() => {
            console.log('🚚 Iniciando verificação automática de entregas pendentes...');
            this.checkPendingDeliveries();
        }, CHECK_PENDING_DELIVERIES_INTERVAL);
        
        // Verificação de produtos com baixo estoque
        setInterval(() => {
            console.log('📦 Iniciando verificação automática de estoque baixo...');
            this.checkLowStock();
        }, CHECK_LOW_STOCK_INTERVAL);
        
        console.log('✅ Verificador de expiração iniciado');
        console.log('✅ Todas as verificações automáticas configuradas');
    }

    /**
     * Verifica produtos expirados
     */
    async checkExpiredProducts() {
        try {
            console.log('⏰ Iniciando verificação de produtos expirados...');
            const now = Date.now();
            const approved = this.getApprovedPurchases();
            let hasExpired = false;
            let totalChecked = 0;
            let expiredCount = 0;

            console.log(`🔍 Verificando ${Object.keys(approved).length} compras aprovadas...`);

            for (const [id, purchase] of Object.entries(approved)) {
                totalChecked++;
                console.log(`🔍 Verificando compra ${id}: ${purchase.productName}...`);
                
                if (purchase.expiresAtTimestamp && purchase.expiresAtTimestamp < now && !purchase.expired) {
                    console.log(`⏰ Produto EXPIRADO detectado: ${purchase.productName} (${id})`);
                    purchase.expired = true;
                    purchase.expiredAt = new Date().toISOString();
                    hasExpired = true;
                    expiredCount++;
                    
                    // Processar expiração imediatamente
                    await this.processExpiredProduct(purchase);
                } else if (purchase.expiresAtTimestamp && purchase.expiresAtTimestamp < now) {
                    console.log(`⏰ Produto já estava marcado como expirado: ${purchase.productName} (${id})`);
                } else if (purchase.expiresAtTimestamp) {
                    const timeLeft = purchase.expiresAtTimestamp - now;
                    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
                    console.log(`✅ Produto válido: ${purchase.productName} (expira em ${hoursLeft}h ${minutesLeft}m)`);
                } else {
                    console.log(`♾️ Produto sem expiração: ${purchase.productName}`);
                }
            }

            if (hasExpired) {
                console.log(`💾 Salvando ${expiredCount} produtos expirados...`);
                this.saveApprovedPurchases(approved);
                console.log('✅ Produtos expirados salvos');
            }

            console.log(`📊 Verificação de expiração concluída: ${totalChecked} produtos verificados, ${expiredCount} expirados`);
        } catch (error) {
            console.error('❌ Erro ao verificar produtos expirados:', error);
        }
    }

    /**
     * Processa produto expirado executando comando RCON
     * @param {Object} purchase - Dados da compra expirada
     */
    async processExpiredProduct(purchase) {
        try {
            console.log(`⏰ Processando produto expirado: ${purchase.productName} (${purchase.id})`);
            
            // Obter dados do produto
            const product = await this.getProductData(purchase.productId);
            if (!product) {
                console.error(`❌ Produto não encontrado: ${purchase.productId}`);
                return;
            }

            // Verificar se há comando de remoção
            const removalCommand = purchase.removalCommand || product.expiration_command;
            if (!removalCommand) {
                console.log(`⚠️ Produto ${purchase.productName} não possui comando de remoção definido`);
                return;
            }

            // Substituir variáveis no comando
            const finalCommand = removalCommand
                .replace('{steamid}', purchase.steamId)
                .replace('{username}', purchase.username || 'Unknown')
                .replace('{product}', purchase.productName)
                .replace('{quantity}', 1);

            console.log(`🔧 Executando comando de remoção: ${finalCommand}`);
            
            // Executar comando RCON
            const response = await this.executeCommand(finalCommand);
            
            // Marcar como processado
            purchase.removed = true;
            purchase.removedAt = new Date().toISOString();
            purchase.removalCommandExecuted = finalCommand;
            purchase.removalResponse = response;

            console.log(`✅ Comando de remoção executado: ${finalCommand}`);
            console.log(`📤 Resposta: ${response}`);
        } catch (error) {
            console.error(`❌ Erro ao processar produto expirado ${purchase.productName}:`, error);
            purchase.removalError = error.message;
            purchase.removalErrorAt = new Date().toISOString();
        }
    }

    /**
     * Verifica pagamentos pendentes
     */
    async checkPendingPayments() {
        try {
            console.log('💳 Iniciando verificação de pagamentos pendentes...');
            const paymentsPath = path.join(__dirname, '..', 'payments.json');
            
            if (!fs.existsSync(paymentsPath)) {
                console.log('📄 Arquivo de pagamentos não encontrado, criando...');
                fs.writeFileSync(paymentsPath, JSON.stringify({}, null, 2));
                return;
            }

            const payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
            const pendingPayments = Object.entries(payments).filter(([id, payment]) => 
                payment.status === 'pending' || payment.status === 'in_process'
            );

            console.log(`🔍 Encontrados ${pendingPayments.length} pagamentos pendentes para verificar`);

            if (pendingPayments.length === 0) {
                console.log('✅ Nenhum pagamento pendente encontrado');
                return;
            }

            for (const [id, payment] of pendingPayments) {
                console.log(`💳 Verificando pagamento ${id} (${payment.status})...`);
                const timeElapsed = Date.now() - new Date(payment.date || payment.created_at).getTime();
                const minutesElapsed = Math.floor(timeElapsed / (1000 * 60));
                console.log(`⏱️ Pagamento ${id} pendente há ${minutesElapsed} minutos`);
                
                if (minutesElapsed > 60) { // Mais de 1 hora
                    console.log(`⚠️ ATENÇÃO - Pagamento ${id} pendente há mais de 1 hora`);
                }
            }

            console.log('📊 Verificação de pagamentos pendentes concluída');
        } catch (error) {
            console.error('❌ Erro ao verificar pagamentos pendentes:', error);
        }
    }

    /**
     * Verifica entregas pendentes
     */
    async checkPendingDeliveries() {
        try {
            console.log('🚚 Iniciando verificação de entregas pendentes...');
            const approved = this.getApprovedPurchases();
            const pendingDeliveries = Object.entries(approved).filter(([id, purchase]) => 
                !purchase.delivered && !purchase.expired
            );

            console.log(`🔍 Encontradas ${pendingDeliveries.length} entregas pendentes`);

            if (pendingDeliveries.length === 0) {
                console.log('✅ Nenhuma entrega pendente encontrada');
                return;
            }

            let deliveredCount = 0;
            let failedCount = 0;

            for (const [id, purchase] of pendingDeliveries) {
                try {
                    const timeSincePurchase = Date.now() - (purchase.approvedAtTimestamp || new Date(purchase.approvedAt).getTime());
                    const minutesSince = Math.floor(timeSincePurchase / (1000 * 60));
                    
                    console.log(`🔍 Entrega pendente: ${purchase.productName} (${id}) - há ${minutesSince} minutos`);
                    
                    if (minutesSince > 30) {
                        console.log(`⚠️ ATENÇÃO - Entrega atrasada: ${purchase.productName} (${id}) - ${minutesSince} minutos`);
                    }

                    // Tentar executar entrega
                    console.log(`🚚 Tentando executar entrega para ${purchase.productName}...`);
                    await this.executeDeliveryForPurchase(purchase);
                    deliveredCount++;
                    
                } catch (error) {
                    console.error(`❌ Erro na entrega ${id}:`, error);
                    failedCount++;
                }
            }

            console.log(`📊 Verificação de entregas concluída: ${deliveredCount} entregues, ${failedCount} falharam`);
        } catch (error) {
            console.error('❌ Erro ao verificar entregas pendentes:', error);
        }
    }

    /**
     * Executa entrega para uma compra específica
     */
    async executeDeliveryForPurchase(purchase) {
        try {
            if (!purchase.deliveryCommand) {
                console.log(`⚠️ Nenhum comando de entrega definido para ${purchase.productName}`);
                return;
            }

            // Substituir variáveis no comando
            const finalCommand = purchase.deliveryCommand
                .replace('{steamid}', purchase.steamId)
                .replace('{username}', purchase.username || 'Unknown')
                .replace('{product}', purchase.productName)
                .replace('{quantity}', 1);

            console.log(`🔧 Executando comando de entrega: ${finalCommand}`);
            
            // Executar comando RCON
            const response = await this.executeCommand(finalCommand);
            
            // Marcar como entregue
            purchase.delivered = true;
            purchase.deliveredAt = new Date().toISOString();
            purchase.deliveryCommandExecuted = finalCommand;
            purchase.deliveryResponse = response;

            // Salvar alterações
            const approved = this.getApprovedPurchases();
            approved[purchase.id] = purchase;
            this.saveApprovedPurchases(approved);

            console.log(`✅ Produto entregue: ${purchase.productName} para ${purchase.username}`);
            console.log(`📤 Resposta: ${response}`);
            
        } catch (error) {
            console.error(`❌ Erro na entrega do produto ${purchase.productName}:`, error);
            purchase.deliveryError = error.message;
            purchase.deliveryErrorAt = new Date().toISOString();
            
            // Salvar erro
            const approved = this.getApprovedPurchases();
            approved[purchase.id] = purchase;
            this.saveApprovedPurchases(approved);
        }
    }

    /**
     * Verifica produtos com estoque baixo
     */
    async checkLowStock() {
        try {
            console.log('📦 Iniciando verificação de estoque baixo...');
            const productsPath = path.join(__dirname, '..', 'produtos.json');
            
            if (!fs.existsSync(productsPath)) {
                console.log('📄 Arquivo de produtos não encontrado');
                return;
            }

            const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
            const productArray = Array.isArray(products) ? products : Object.values(products);
            console.log(`🔍 Verificando estoque de ${productArray.length} produtos...`);

            let lowStockCount = 0;
            let outOfStockCount = 0;

            for (const product of productArray) {
                if (product.stock !== undefined) {
                    if (product.stock === 0) {
                        console.log(`🚫 CRÍTICO - Produto SEM ESTOQUE: ${product.name} (ID: ${product.id})`);
                        outOfStockCount++;
                    } else if (product.stock <= 5) {
                        console.log(`⚠️ ATENÇÃO - Produto com ESTOQUE BAIXO: ${product.name} (${product.stock} unidades)`);
                        lowStockCount++;
                    } else {
                        console.log(`✅ Produto com estoque adequado: ${product.name} (${product.stock} unidades)`);
                    }
                } else {
                    console.log(`♾️ Produto sem controle de estoque: ${product.name}`);
                }
            }

            console.log(`📊 Verificação de estoque concluída: ${lowStockCount} com estoque baixo, ${outOfStockCount} sem estoque`);
        } catch (error) {
            console.error('❌ Erro ao verificar estoque:', error);
        }
    }

    /**
     * Obtém compras aprovadas
     */
    getApprovedPurchases() {
        try {
            if (!fs.existsSync(this.approvedPath)) {
                console.log('ℹ️ Arquivo de compras aprovadas não encontrado, criando...');
                fs.writeFileSync(this.approvedPath, JSON.stringify({}, null, 2));
                return {};
            }
            return JSON.parse(fs.readFileSync(this.approvedPath, 'utf8'));
        } catch (error) {
            console.error('❌ Erro ao carregar compras aprovadas:', error);
            return {};
        }
    }

    /**
     * Salva compras aprovadas
     */
    saveApprovedPurchases(purchases) {
        try {
            fs.writeFileSync(this.approvedPath, JSON.stringify(purchases, null, 2));
        } catch (error) {
            console.error('❌ Erro ao salvar compras aprovadas:', error);
        }
    }
}

const productDelivery = new ProductDelivery();

module.exports = {
    ...productDelivery,
    startExpiryChecker: () => productDelivery.startExpiryChecker()
};