const mercadopago = require('mercadopago');
const fs = require('fs');
const path = require('path');
const qr = require('qrcode');
const config = require('./config.json');

/**
 * Cria um pagamento no Mercado Pago
 * @param {Object} produto - Dados do produto
 * @param {string} userId - ID do usuário Discord
 * @param {Object} userInfo - Informações adicionais do usuário
 * @returns {Promise<Object>} - Dados do pagamento criado
 */
async function createPayment(produto, userId, userInfo = {}) {
    try {
        // Verificar se o Mercado Pago está configurado
        if (!config.mercadoPago || !config.mercadoPago.accessToken || config.mercadoPago.accessToken === 'SEU_ACCESS_TOKEN_MERCADO_PAGO') {
            throw new Error('Mercado Pago não configurado. Configure o access_token no config.json');
        }

        const paymentData = {
            transaction_amount: parseFloat(produto.price),
            payment_method_id: 'pix',
            description: produto.description || produto.name,
            payer: {
                email: userInfo.email || 'comprador@exemplo.com',
                first_name: userInfo.firstName || 'Comprador',
                last_name: userInfo.lastName || 'Bot',
                identification: {
                    type: 'CPF',
                    number: userInfo.cpf || '11111111111'
                }
            },
            notification_url: config.mercadoPago.webhook || undefined,
            metadata: {
                user_id: userId,
                product_id: produto.id,
                product_name: produto.name,
                created_at: new Date().toISOString()
            }
        };

        console.log('🔄 Criando pagamento no Mercado Pago...');
        const payment = await mercadopago.payment.create(paymentData);
        
        if (payment.status === 201) {
            console.log('✅ Pagamento criado com sucesso:', payment.body.id);
            
            // Salvar pagamento no arquivo local
            await savePaymentToFile(payment.body, userId, produto);
            
            return {
                id: payment.body.id,
                status: payment.body.status,
                amount: payment.body.transaction_amount,
                currency: payment.body.currency_id,
                qr_code: payment.body.point_of_interaction.transaction_data.qr_code,
                qr_code_base64: payment.body.point_of_interaction.transaction_data.qr_code_base64,
                init_point: payment.body.point_of_interaction.transaction_data.ticket_url || `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${payment.body.id}`,
                date_created: payment.body.date_created,
                date_of_expiration: payment.body.date_of_expiration
            };
        } else {
            throw new Error(`Erro ao criar pagamento: ${payment.status}`);
        }
    } catch (error) {
        console.error('❌ Erro ao criar pagamento:', error);
        throw new Error(`Falha ao criar pagamento: ${error.message}`);
    }
}

/**
 * Verifica o status de um pagamento
 * @param {string} paymentId - ID do pagamento
 * @returns {Promise<Object>} - Status do pagamento
 */
async function checkPayment(paymentId) {
    try {
        // Verificar se o Mercado Pago está configurado
        if (!config.mercadoPago || !config.mercadoPago.accessToken || config.mercadoPago.accessToken === 'SEU_ACCESS_TOKEN_MERCADO_PAGO') {
            throw new Error('Mercado Pago não configurado. Configure o access_token no config.json');
        }

        console.log('🔍 Verificando status do pagamento:', paymentId);
        const payment = await mercadopago.payment.get(paymentId);
        
        if (payment.status === 200) {
            const paymentData = payment.body;
            
            // Atualizar status no arquivo local
            await updatePaymentStatus(paymentId, paymentData.status);
            
            return {
                id: paymentData.id,
                status: paymentData.status,
                status_detail: paymentData.status_detail,
                amount: paymentData.transaction_amount,
                currency: paymentData.currency_id,
                date_approved: paymentData.date_approved,
                date_created: paymentData.date_created,
                payer: paymentData.payer,
                payment_method: paymentData.payment_method_id,
                description: paymentData.description
            };
        } else {
            throw new Error(`Erro ao verificar pagamento: ${payment.status}`);
        }
    } catch (error) {
        console.error('❌ Erro ao verificar pagamento:', error);
        throw new Error(`Falha ao verificar pagamento: ${error.message}`);
    }
}

/**
 * Salva o pagamento no arquivo local
 * @param {Object} paymentData - Dados do pagamento
 * @param {string} userId - ID do usuário
 * @param {Object} produto - Dados do produto
 */
async function savePaymentToFile(paymentData, userId, produto) {
    try {
        const paymentsPath = path.join(__dirname, 'data', 'payments.json');
        let payments = {};
        
        if (fs.existsSync(paymentsPath)) {
            payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
        }
        
        payments[paymentData.id] = {
            id: paymentData.id,
            userId: userId,
            productId: produto.id,
            productName: produto.name,
            amount: paymentData.transaction_amount,
            currency: paymentData.currency_id,
            status: paymentData.status,
            paymentMethod: paymentData.payment_method_id,
            date: paymentData.date_created,
            qrCode: paymentData.point_of_interaction?.transaction_data?.qr_code,
            expirationDate: paymentData.date_of_expiration,
            metadata: paymentData.metadata
        };
        
        fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));
        console.log('✅ Pagamento salvo no arquivo local');
    } catch (error) {
        console.error('❌ Erro ao salvar pagamento no arquivo:', error);
    }
}

/**
 * Atualiza o status do pagamento no arquivo local
 * @param {string} paymentId - ID do pagamento
 * @param {string} newStatus - Novo status
 */
async function updatePaymentStatus(paymentId, newStatus) {
    try {
        const paymentsPath = path.join(__dirname, 'data', 'payments.json');
        
        if (fs.existsSync(paymentsPath)) {
            const payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
            
            if (payments[paymentId]) {
                payments[paymentId].status = newStatus;
                payments[paymentId].lastUpdate = new Date().toISOString();
                
                if (newStatus === 'approved') {
                    payments[paymentId].approvedAt = new Date().toISOString();
                    await moveToApprovedPurchases(payments[paymentId]);
                }
                
                fs.writeFileSync(paymentsPath, JSON.stringify(payments, null, 2));
                console.log(`✅ Status do pagamento ${paymentId} atualizado para: ${newStatus}`);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao atualizar status do pagamento:', error);
    }
}

/**
 * Move pagamento aprovado para arquivo de compras aprovadas
 * @param {Object} paymentData - Dados do pagamento
 */
async function moveToApprovedPurchases(paymentData) {
    try {
        const approvedPath = path.join(__dirname, 'data', 'approved_purchases.json');
        let approved = {};
        
        if (fs.existsSync(approvedPath)) {
            approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
        }
        
        approved[paymentData.id] = {
            ...paymentData,
            approvedAt: new Date().toISOString(),
            delivered: false
        };
        
        fs.writeFileSync(approvedPath, JSON.stringify(approved, null, 2));
        console.log('✅ Compra aprovada salva no arquivo de compras aprovadas');
    } catch (error) {
        console.error('❌ Erro ao salvar compra aprovada:', error);
    }
}

/**
 * Gera QR Code
 * @param {string} text - Texto para o QR Code
 * @param {Object} user - Usuário Discord
 * @returns {Promise<string>} - Caminho do arquivo QR Code
 */
async function generateQRCode(text, user) {
    return new Promise((resolve, reject) => {
        const fileName = `qrcode${user.id}.png`;
        qr.toFile(fileName, text, (err) => {
            if (err) {
                console.error("Erro ao gerar o QR Code:", err);
                reject(err);
            } else {
                console.log(`✅ QR Code gerado: ${fileName}`);
                resolve(fileName);
            }
        });
    });
}

/**
 * Testa a conectividade com o Mercado Pago
 * @returns {Promise<Object>} - Resultado do teste
 */
async function testMercadoPagoConnection() {
    try {
        if (!config.mercadoPago || !config.mercadoPago.accessToken || config.mercadoPago.accessToken === 'SEU_ACCESS_TOKEN_MERCADO_PAGO') {
            return {
                success: false,
                error: 'Mercado Pago não configurado',
                message: 'Configure o access_token no config.json'
            };
        }

        // Tentar buscar um pagamento específico (que pode não existir) para testar a conectividade
        try {
            await mercadopago.payment.get('test_payment_123');
        } catch (testError) {
            // Se o erro for de pagamento não encontrado, significa que a API está funcionando
            if (testError.message.includes('not_found') || testError.status === 404) {
                return {
                    success: true,
                    message: 'Conexão com Mercado Pago estabelecida com sucesso',
                    apiStatus: 'online'
                };
            }
            throw testError;
        }
        
        return {
            success: true,
            message: 'Conexão com Mercado Pago estabelecida com sucesso',
            apiStatus: 'online'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            message: 'Erro ao testar conexão com Mercado Pago'
        };
    }
}

/**
 * Obtém estatísticas de pagamentos
 * @returns {Object} - Estatísticas dos pagamentos
 */
function getPaymentStats() {
    try {
        const paymentsPath = path.join(__dirname, 'data', 'payments.json');
        const approvedPath = path.join(__dirname, 'data', 'approved_purchases.json');
        
        let payments = {};
        let approved = {};
        
        if (fs.existsSync(paymentsPath)) {
            payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
        }
        
        if (fs.existsSync(approvedPath)) {
            approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
        }
        
        const allPayments = Object.values(payments);
        const approvedPayments = Object.values(approved);
        
        const stats = {
            total: allPayments.length,
            pending: allPayments.filter(p => p.status === 'pending').length,
            approved: approvedPayments.length,
            rejected: allPayments.filter(p => p.status === 'rejected').length,
            cancelled: allPayments.filter(p => p.status === 'cancelled').length,
            totalRevenue: approvedPayments.reduce((sum, p) => sum + p.amount, 0),
            averageAmount: approvedPayments.length > 0 ? (approvedPayments.reduce((sum, p) => sum + p.amount, 0) / approvedPayments.length) : 0,
            lastPayment: allPayments.length > 0 ? allPayments.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null
        };
        
        return stats;
    } catch (error) {
        console.error('❌ Erro ao obter estatísticas:', error);
        return {
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
            totalRevenue: 0,
            averageAmount: 0,
            lastPayment: null
        };
    }
}

module.exports = {
    createPayment,
    checkPayment,
    generateQRCode,
    testMercadoPagoConnection,
    getPaymentStats,
    savePaymentToFile,
    updatePaymentStatus,
    moveToApprovedPurchases
};
