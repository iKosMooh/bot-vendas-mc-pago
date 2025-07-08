const express = require('express');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Manipulador de webhooks do Mercado Pago
 */
class WebhookHandler {
    constructor() {
        this.configPath = path.join(__dirname, '..', 'config.json');
        this.paymentsPath = path.join(__dirname, '..', 'payments.json');
        this.approvedPath = path.join(__dirname, '..', 'approved_purchases.json');
        this.loadConfig();
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    /**
     * Carrega configurações
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
     * Configura middleware do Express
     */
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // Middleware de logging
        this.app.use((req, res, next) => {
            logger.system('INFO', `Webhook recebido: ${req.method} ${req.path}`, {
                headers: req.headers,
                body: req.body
            });
            next();
        });
    }

    /**
     * Configura rotas
     */
    setupRoutes() {
        // Rota principal do webhook
        this.app.post('/webhook', async (req, res) => {
            try {
                await this.handleWebhook(req, res);
            } catch (error) {
                logger.error('Erro no webhook', error, { body: req.body });
                res.status(500).json({ error: 'Erro interno do servidor' });
            }
        });

        // Rota de status
        this.app.get('/status', (req, res) => {
            res.json({
                status: 'online',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // Rota de health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                mercadoPago: this.config.mercadoPago ? 'configured' : 'not configured',
                discord: 'connected'
            });
        });
    }

    /**
     * Manipula webhook do Mercado Pago
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    async handleWebhook(req, res) {
        const { type, data } = req.body;

        logger.system('INFO', `Webhook recebido: ${type}`, data);

        switch (type) {
            case 'payment':
                await this.handlePaymentWebhook(data);
                break;
            case 'merchant_order':
                await this.handleMerchantOrderWebhook(data);
                break;
            default:
                logger.system('WARN', `Tipo de webhook não suportado: ${type}`);
        }

        res.status(200).json({ received: true });
    }

    /**
     * Manipula webhook de pagamento
     * @param {Object} data - Dados do pagamento
     */
    async handlePaymentWebhook(data) {
        try {
            const paymentId = data.id;
            if (!paymentId) {
                logger.system('WARN', 'ID de pagamento não encontrado no webhook');
                return;
            }

            // Buscar detalhes do pagamento
            const mercadoPago = require('./mercadoPago');
            const paymentDetails = await mercadoPago.checkPaymentStatus(paymentId);

            logger.payment('INFO', `Webhook de pagamento processado: ${paymentId}`, paymentDetails);

            // Se o pagamento foi aprovado, processar entrega
            if (paymentDetails.status === 'approved') {
                await this.processApprovedPayment(paymentDetails);
            }
        } catch (error) {
            logger.error('Erro ao processar webhook de pagamento', error, data);
        }
    }

    /**
     * Manipula webhook de merchant order
     * @param {Object} data - Dados da ordem
     */
    async handleMerchantOrderWebhook(data) {
        try {
            logger.system('INFO', 'Webhook de merchant order recebido', data);
            // Implementar lógica para merchant order se necessário
        } catch (error) {
            logger.error('Erro ao processar webhook de merchant order', error, data);
        }
    }

    /**
     * Processa pagamento aprovado
     * @param {Object} paymentDetails - Detalhes do pagamento
     */
    async processApprovedPayment(paymentDetails) {
        try {
            // Carregar dados locais
            const payments = this.loadPayments();
            const localPayment = payments[paymentDetails.id];

            if (!localPayment) {
                logger.payment('WARN', `Pagamento local não encontrado: ${paymentDetails.id}`);
                return;
            }

            // Atualizar status local
            localPayment.status = 'approved';
            localPayment.approvedAt = new Date().toISOString();
            localPayment.webhookProcessed = true;

            // Salvar alterações
            this.savePayments(payments);

            // Mover para compras aprovadas
            await this.moveToApprovedPurchases(localPayment);

            // Enviar notificação
            await this.sendApprovalNotification(localPayment);

            // Processar entrega automática
            await this.processAutoDelivery(localPayment);

            logger.payment('INFO', `Pagamento aprovado processado: ${paymentDetails.id}`);
        } catch (error) {
            logger.error('Erro ao processar pagamento aprovado', error, paymentDetails);
        }
    }

    /**
     * Move pagamento para compras aprovadas
     * @param {Object} payment - Dados do pagamento
     */
    async moveToApprovedPurchases(payment) {
        try {
            const approvedPurchases = this.loadApprovedPurchases();
            
            approvedPurchases[payment.id] = {
                ...payment,
                approvedAt: new Date().toISOString(),
                delivered: false,
                webhookProcessed: true
            };

            this.saveApprovedPurchases(approvedPurchases);
            logger.purchase('INFO', `Compra aprovada salva: ${payment.id}`);
        } catch (error) {
            logger.error('Erro ao mover para compras aprovadas', error, payment);
        }
    }

    /**
     * Envia notificação de aprovação
     * @param {Object} payment - Dados do pagamento
     */
    async sendApprovalNotification(payment) {
        try {
            if (!this.discordClient) {
                logger.system('WARN', 'Cliente Discord não configurado para notificações');
                return;
            }

            const user = await this.discordClient.users.fetch(payment.userId);
            if (!user) {
                logger.system('WARN', `Usuário não encontrado: ${payment.userId}`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('✅ Pagamento Aprovado!')
                .setDescription(`Seu pagamento foi aprovado com sucesso!`)
                .addFields(
                    { name: '🛒 Produto', value: payment.productName, inline: true },
                    { name: '💰 Valor', value: `R$ ${payment.amount}`, inline: true },
                    { name: '🆔 ID', value: payment.id, inline: true },
                    { name: '📅 Aprovado em', value: new Date().toLocaleString('pt-BR'), inline: true }
                )
                .setColor('#00ff00')
                .setTimestamp();

            await user.send({ embeds: [embed] });
            logger.system('INFO', `Notificação de aprovação enviada para: ${user.username}`);
        } catch (error) {
            logger.error('Erro ao enviar notificação de aprovação', error, payment);
        }
    }

    /**
     * Processa entrega automática
     * @param {Object} payment - Dados do pagamento
     */
    async processAutoDelivery(payment) {
        try {
            const productDelivery = require('./productDelivery');
            const result = await productDelivery.deliverProduct(payment.id, this.discordClient);

            if (result.success) {
                logger.purchase('INFO', `Entrega automática realizada: ${payment.id}`);
            } else {
                logger.purchase('WARN', `Falha na entrega automática: ${payment.id}`, result);
            }
        } catch (error) {
            logger.error('Erro na entrega automática', error, payment);
        }
    }

    /**
     * Carrega pagamentos do arquivo
     * @returns {Object} - Pagamentos
     */
    loadPayments() {
        try {
            if (fs.existsSync(this.paymentsPath)) {
                return JSON.parse(fs.readFileSync(this.paymentsPath, 'utf8'));
            }
            return {};
        } catch (error) {
            logger.error('Erro ao carregar pagamentos', error);
            return {};
        }
    }

    /**
     * Salva pagamentos no arquivo
     * @param {Object} payments - Pagamentos
     */
    savePayments(payments) {
        try {
            fs.writeFileSync(this.paymentsPath, JSON.stringify(payments, null, 2));
        } catch (error) {
            logger.error('Erro ao salvar pagamentos', error);
        }
    }

    /**
     * Carrega compras aprovadas do arquivo
     * @returns {Object} - Compras aprovadas
     */
    loadApprovedPurchases() {
        try {
            if (fs.existsSync(this.approvedPath)) {
                return JSON.parse(fs.readFileSync(this.approvedPath, 'utf8'));
            }
            return {};
        } catch (error) {
            logger.error('Erro ao carregar compras aprovadas', error);
            return {};
        }
    }

    /**
     * Salva compras aprovadas no arquivo
     * @param {Object} approved - Compras aprovadas
     */
    saveApprovedPurchases(approved) {
        try {
            fs.writeFileSync(this.approvedPath, JSON.stringify(approved, null, 2));
        } catch (error) {
            logger.error('Erro ao salvar compras aprovadas', error);
        }
    }

    /**
     * Define o cliente Discord
     * @param {Object} client - Cliente Discord
     */
    setDiscordClient(client) {
        this.discordClient = client;
    }

    /**
     * Inicia o servidor webhook
     * @param {number} port - Porta do servidor
     */
    start(port = 3000) {
        try {
            this.server = this.app.listen(port, () => {
                logger.system('INFO', `Servidor webhook iniciado na porta ${port}`);
                console.log(`🌐 Servidor webhook rodando na porta ${port}`);
            });
        } catch (error) {
            logger.error('Erro ao iniciar servidor webhook', error);
        }
    }

    /**
     * Para o servidor webhook
     */
    stop() {
        if (this.server) {
            this.server.close(() => {
                logger.system('INFO', 'Servidor webhook parado');
                console.log('🔴 Servidor webhook parado');
            });
        }
    }
}

module.exports = new WebhookHandler();
