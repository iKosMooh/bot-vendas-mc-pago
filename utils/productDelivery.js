const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { Rcon } = require('rcon-client');

/**
 * Sistema de entrega de produtos
 */
class ProductDelivery {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'config.json');
        this.approvedPath = path.join(__dirname, '..', 'approved_purchases.json');
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
     * @param {string} productId - ID do produto
     * @returns {Promise<Object|null>} - Dados do produto
     */
    async getProductData(productId) {
        try {
            const productsPath = path.join(__dirname, '..', 'produtos.json');
            if (!fs.existsSync(productsPath)) {
                return null;
            }

            const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
            return products.find(p => p.id === productId) || null;
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
            const commands = product.deliveryCommands || [];
            if (commands.length === 0) {
                throw new Error('Nenhum comando de entrega definido para este produto');
            }

            const results = [];
            
            for (const command of commands) {
                // Substituir variáveis no comando
                const finalCommand = command
                    .replace('{steamid}', steamLink.steamId)
                    .replace('{username}', steamLink.username)
                    .replace('{product}', product.name)
                    .replace('{quantity}', purchase.quantity || 1);

                const response = await this.executeCommand(finalCommand);
                results.push({
                    command: finalCommand,
                    response: response
                });
            }

            return {
                success: true,
                method: 'rcon',
                data: {
                    commands: results,
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
}

module.exports = new ProductDelivery();