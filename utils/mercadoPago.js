const mercadopago = require('mercadopago');
const fs = require('fs');
const path = require('path');

// Carregar configurações
let config = {};
const configPath = path.join(__dirname, '..', 'data', 'config.json');
if (fs.existsSync(configPath)) {
    try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
        console.error('❌ Erro ao carregar config.json:', error);
    }
}

// Configurar Mercado Pago
if (config.mercadoPago && config.mercadoPago.accessToken) {
    mercadopago.configure({
        access_token: config.mercadoPago.accessToken,
        integrator_id: config.mercadoPago.integratorId || 'dev_24c65fb163bf11ea96500242ac130004'
    });
    console.log('✅ Mercado Pago configurado com sucesso');
} else {
    console.warn('⚠️ Mercado Pago não configurado. Configure access_token no config.json');
}

/**
 * Cria um pagamento no Mercado Pago
 * @param {Object} produto - Objeto do produto
 * @param {string} userId - ID do usuário Discord
 * @param {string} paymentMethod - Método de pagamento (opcional, padrão: 'all')
 * @returns {Promise<Object>} - Dados do pagamento criado
 */
async function createPayment(produto, userId, paymentMethod = 'all') {
    try {
        if (!config.mercadoPago || !config.mercadoPago.accessToken) {
            throw new Error('Mercado Pago não configurado');
        }

        let paymentData;

        if (paymentMethod === 'pix') {
            // Pagamento específico para PIX
            paymentData = {
                transaction_amount: parseFloat(produto.price),
                payment_method_id: 'pix',
                description: produto.description || produto.name,
                payer: {
                    email: 'comprador@exemplo.com'
                },
                notification_url: config.mercadoPago.webhookUrl || undefined,
                metadata: {
                    user_id: userId,
                    product_id: produto.id,
                    product_name: produto.name,
                    payment_method: 'pix',
                    created_at: new Date().toISOString()
                }
            };
        } else {
            // Preference para múltiplos métodos de pagamento
            paymentData = {
                items: [{
                    title: produto.name,
                    description: produto.description || `Compra do produto: ${produto.name}`,
                    quantity: 1,
                    currency_id: 'BRL',
                    unit_price: parseFloat(produto.price)
                }],
                payer: {
                    email: 'comprador@exemplo.com'
                },
                payment_methods: {
                    excluded_payment_methods: [],
                    excluded_payment_types: [],
                    installments: 12 // Até 12x no cartão
                },
                back_urls: {
                    success: config.mercadoPago.successUrl || 'https://www.exemplo.com/success',
                    failure: config.mercadoPago.failureUrl || 'https://www.exemplo.com/failure',
                    pending: config.mercadoPago.pendingUrl || 'https://www.exemplo.com/pending'
                },
                auto_return: 'approved',
                notification_url: config.mercadoPago.webhookUrl || undefined,
                external_reference: `${userId}-${produto.id}-${Date.now()}`,
                metadata: {
                    user_id: userId,
                    product_id: produto.id,
                    product_name: produto.name,
                    payment_method: 'multiple',
                    created_at: new Date().toISOString()
                }
            };
        }

        console.log('🔄 Criando pagamento no Mercado Pago...');
        
        let payment;
        if (paymentMethod === 'pix') {
            payment = await mercadopago.payment.create(paymentData);
        } else {
            payment = await mercadopago.preferences.create(paymentData);
        }
        
        if (payment.status === 201) {
            console.log('✅ Pagamento criado com sucesso:', payment.body.id);
            
            // Salvar pagamento no arquivo local
            await savePaymentToFile(payment.body, userId, produto, paymentMethod);
            
            if (paymentMethod === 'pix') {
                return {
                    id: payment.body.id,
                    status: payment.body.status,
                    amount: payment.body.transaction_amount,
                    currency: payment.body.currency_id,
                    qr_code: payment.body.point_of_interaction.transaction_data.qr_code,
                    qr_code_base64: payment.body.point_of_interaction.transaction_data.qr_code_base64,
                    init_point: payment.body.point_of_interaction.transaction_data.ticket_url,
                    date_created: payment.body.date_created,
                    date_of_expiration: payment.body.date_of_expiration,
                    payment_method: 'pix'
                };
            } else {
                return {
                    id: payment.body.id,
                    status: 'pending',
                    amount: parseFloat(produto.price),
                    currency: 'BRL',
                    init_point: payment.body.init_point,
                    sandbox_init_point: payment.body.sandbox_init_point,
                    date_created: payment.body.date_created,
                    payment_method: 'multiple'
                };
            }
        } else {
            throw new Error(`Erro ao criar pagamento: ${payment.status}`);
        }
    } catch (error) {
        console.error('❌ Erro ao criar pagamento:', error);
        throw new Error(`Falha ao criar pagamento: ${error.message}`);
    }
}

/**
 * Cria uma preferência com múltiplos métodos de pagamento
 * @param {Object} produto - Objeto do produto
 * @param {string} userId - ID do usuário Discord
 * @returns {Promise<Object>} - Dados da preferência criada
 */
async function createPaymentPreference(produto, userId) {
    return await createPayment(produto, userId, 'multiple');
}

/**
 * Cria um pagamento PIX específico
 * @param {Object} produto - Objeto do produto
 * @param {string} userId - ID do usuário Discord
 * @returns {Promise<Object>} - Dados do pagamento PIX criado
 */
async function createPixPayment(produto, userId) {
    return await createPayment(produto, userId, 'pix');
}

/**
 * Verifica o status de um pagamento
 * @param {string} paymentId - ID do pagamento
 * @returns {Promise<Object>} - Status do pagamento
 */
async function checkPaymentStatus(paymentId) {
    try {
        if (!config.mercadoPago || !config.mercadoPago.accessToken) {
            throw new Error('Mercado Pago não configurado');
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
 * @param {string} paymentMethod - Método de pagamento
 */
async function savePaymentToFile(paymentData, userId, produto, paymentMethod = 'pix') {
    try {
        const paymentsPath = path.join(__dirname, '..', 'data', 'payments.json');
        let payments = {};
        
        if (fs.existsSync(paymentsPath)) {
            payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
        }
        
        if (paymentMethod === 'pix') {
            payments[paymentData.id] = {
                id: paymentData.id,
                userId: userId,
                productId: produto.id,
                productName: produto.name,
                amount: paymentData.transaction_amount,
                currency: paymentData.currency_id,
                status: paymentData.status,
                paymentMethod: 'pix',
                date: paymentData.date_created,
                qrCode: paymentData.point_of_interaction?.transaction_data?.qr_code,
                expirationDate: paymentData.date_of_expiration,
                metadata: paymentData.metadata
            };
        } else {
            payments[paymentData.id] = {
                id: paymentData.id,
                userId: userId,
                productId: produto.id,
                productName: produto.name,
                amount: parseFloat(produto.price),
                currency: 'BRL',
                status: 'pending',
                paymentMethod: 'multiple',
                date: paymentData.date_created,
                preferenceId: paymentData.id,
                externalReference: paymentData.external_reference,
                metadata: paymentData.metadata || {}
            };
        }
        
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
        const paymentsPath = path.join(__dirname, '..', 'data', 'payments.json');
        
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
        const approvedPath = path.join(__dirname, '..', 'data', 'approved_purchases.json');
        let approved = {};
        
        if (fs.existsSync(approvedPath)) {
            approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
        }
        
        // Calcular tempo de expiração baseado no produto
        let expiresAt = null;
        try {
            const productsPath = path.join(__dirname, '..', 'data', 'produtos.json');
            if (fs.existsSync(productsPath)) {
                const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
                const product = products[paymentData.productId];
                
                if (product && product.time_amount && product.time_unit && !product.infinito) {
                    const now = new Date();
                    let expirationTime;
                    
                    switch (product.time_unit) {
                        case 'min':
                            expirationTime = now.getTime() + (product.time_amount * 60 * 1000);
                            break;
                        case 'h':
                            expirationTime = now.getTime() + (product.time_amount * 60 * 60 * 1000);
                            break;
                        case 'd':
                            expirationTime = now.getTime() + (product.time_amount * 24 * 60 * 60 * 1000);
                            break;
                        default:
                            expirationTime = null;
                    }
                    
                    if (expirationTime) {
                        expiresAt = expirationTime;
                        console.log(`✅ Produto ${product.name} expira em: ${new Date(expirationTime).toLocaleString('pt-BR')}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Erro ao calcular tempo de expiração:', error);
        }
        
        approved[paymentData.id] = {
            ...paymentData,
            approvedAt: new Date().toISOString(),
            delivered: false,
            expiresAt: expiresAt,
            expired: false
        };
        
        fs.writeFileSync(approvedPath, JSON.stringify(approved, null, 2));
        console.log('✅ Compra aprovada salva no arquivo de compras aprovadas');
    } catch (error) {
        console.error('❌ Erro ao salvar compra aprovada:', error);
    }
}

/**
 * Busca pagamentos por usuário
 * @param {string} userId - ID do usuário
 * @returns {Array} - Lista de pagamentos do usuário
 */
function getUserPayments(userId) {
    try {
        const paymentsPath = path.join(__dirname, '..', 'data', 'payments.json');
        
        if (!fs.existsSync(paymentsPath)) {
            return [];
        }
        
        const payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
        return Object.values(payments).filter(payment => payment.userId === userId);
    } catch (error) {
        console.error('❌ Erro ao buscar pagamentos do usuário:', error);
        return [];
    }
}

/**
 * Busca compras aprovadas por usuário
 * @param {string} userId - ID do usuário
 * @returns {Array} - Lista de compras aprovadas do usuário
 */
function getUserApprovedPurchases(userId) {
    try {
        const approvedPath = path.join(__dirname, '..', 'data', 'approved_purchases.json');
        
        if (!fs.existsSync(approvedPath)) {
            return [];
        }
        
        const approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
        return Object.values(approved).filter(purchase => purchase.userId === userId);
    } catch (error) {
        console.error('❌ Erro ao buscar compras aprovadas do usuário:', error);
        return [];
    }
}

/**
 * Testa a conectividade com o Mercado Pago
 * @returns {Promise<Object>} - Resultado do teste
 */
async function testMercadoPagoConnection() {
    try {
        if (!config.mercadoPago || !config.mercadoPago.accessToken) {
            return {
                success: false,
                error: 'Mercado Pago não configurado',
                message: 'Configure o access_token no config.json'
            };
        }

        // Criar um pagamento de teste pequeno
        const testPayment = {
            transaction_amount: 0.01,
            payment_method_id: 'pix',
            description: 'Teste de conectividade',
            payer: {
                email: 'test@exemplo.com'
            }
        };

        const payment = await mercadopago.payment.create(testPayment);
        
        if (payment.status === 201) {
            // Cancelar o pagamento de teste
            await mercadopago.payment.cancel(payment.body.id);
            
            return {
                success: true,
                message: 'Conexão com Mercado Pago estabelecida com sucesso',
                paymentId: payment.body.id
            };
        } else {
            return {
                success: false,
                error: `Erro na API: ${payment.status}`,
                message: 'Falha na comunicação com Mercado Pago'
            };
        }
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
        const paymentsPath = path.join(__dirname, '..', 'data', 'payments.json');
        const approvedPath = path.join(__dirname, '..', 'data', 'approved_purchases.json');
        
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

// ===== CONFIGURAÇÕES DE VERIFICAÇÃO AUTOMÁTICA DE PAGAMENTOS =====
const PAYMENT_CHECK_INTERVAL = 2 * 60 * 1000; // 2 minutos
let paymentCheckInterval = null;

/**
 * Inicia o verificador automático de pagamentos
 */
function startPaymentChecker() {
    console.log('🔄 Iniciando verificador automático de pagamentos...');
    console.log(`📅 Verificações a cada ${PAYMENT_CHECK_INTERVAL / 1000 / 60} minutos`);
    
    // Verificação inicial
    checkAllPendingPayments();
    
    // Configurar verificação periódica
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
    }
    
    paymentCheckInterval = setInterval(async () => {
        console.log('🔍 Iniciando verificação automática de pagamentos...');
        await checkAllPendingPayments();
    }, PAYMENT_CHECK_INTERVAL);
    
    console.log('✅ Verificador automático de pagamentos configurado');
}

/**
 * Para o verificador automático de pagamentos
 */
function stopPaymentChecker() {
    if (paymentCheckInterval) {
        clearInterval(paymentCheckInterval);
        paymentCheckInterval = null;
        console.log('🛑 Verificador automático de pagamentos parado');
    }
}

/**
 * Verifica todos os pagamentos pendentes
 */
async function checkAllPendingPayments() {
    try {
        const paymentsPath = path.join(__dirname, '..', 'data', 'payments.json');
        
        if (!fs.existsSync(paymentsPath)) {
            console.log('📄 Arquivo de pagamentos não encontrado, criando...');
            fs.writeFileSync(paymentsPath, JSON.stringify({}, null, 2));
            return;
        }

        const payments = JSON.parse(fs.readFileSync(paymentsPath, 'utf8'));
        const pendingPayments = Object.entries(payments).filter(([id, payment]) => 
            payment.status === 'pending' || payment.status === 'in_process'
        );

        console.log(`🔍 Verificando ${pendingPayments.length} pagamentos pendentes...`);

        if (pendingPayments.length === 0) {
            console.log('✅ Nenhum pagamento pendente encontrado');
            return;
        }

        let approvedCount = 0;
        let rejectedCount = 0;
        let stillPendingCount = 0;

        for (const [paymentId, payment] of pendingPayments) {
            try {
                console.log(`🔍 Verificando pagamento ${paymentId}...`);
                
                const paymentStatus = await checkPaymentStatus(paymentId);
                
                if (paymentStatus.status === 'approved') {
                    console.log(`✅ Pagamento ${paymentId} APROVADO! Iniciando entrega...`);
                    approvedCount++;
                    
                    // Processar entrega imediatamente
                    await processApprovedPayment(paymentId, payment);
                    
                } else if (paymentStatus.status === 'rejected' || paymentStatus.status === 'cancelled') {
                    console.log(`❌ Pagamento ${paymentId} ${paymentStatus.status.toUpperCase()}`);
                    rejectedCount++;
                    
                } else {
                    console.log(`⏳ Pagamento ${paymentId} ainda pendente (${paymentStatus.status})`);
                    stillPendingCount++;
                }
            } catch (error) {
                console.error(`❌ Erro ao verificar pagamento ${paymentId}:`, error.message);
            }
        }

        console.log(`📊 Verificação concluída: ${approvedCount} aprovados, ${rejectedCount} rejeitados, ${stillPendingCount} ainda pendentes`);
        
    } catch (error) {
        console.error('❌ Erro durante verificação automática de pagamentos:', error);
    }
}

/**
 * Processa pagamento aprovado e realiza entrega
 */
async function processApprovedPayment(paymentId, payment) {
    try {
        console.log(`🚚 Processando entrega para pagamento ${paymentId}...`);
        
        // Carregar dados do produto
        const productsPath = path.join(__dirname, '..', 'data', 'produtos.json');
        if (!fs.existsSync(productsPath)) {
            throw new Error('Arquivo de produtos não encontrado');
        }
        
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        const product = products[payment.productId];
        
        if (!product) {
            throw new Error(`Produto ${payment.productId} não encontrado`);
        }

        // Verificar vínculo Steam
        const linksPath = path.join(__dirname, '..', 'data', 'links.json');
        if (!fs.existsSync(linksPath)) {
            throw new Error('Arquivo de vínculos Steam não encontrado');
        }
        
        const links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
        const steamLink = links[payment.userId];
        
        if (!steamLink) {
            throw new Error(`Usuário ${payment.userId} não possui conta Steam vinculada`);
        }

        // Mover para compras aprovadas se ainda não foi movido
        const approvedPath = path.join(__dirname, '..', 'data', 'approved_purchases.json');
        let approved = {};
        
        if (fs.existsSync(approvedPath)) {
            approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
        }

        // Verificar se já existe na lista de aprovados
        const existingPurchase = Object.values(approved).find(p => p.paymentId === paymentId);
        
        if (!existingPurchase) {
            // Criar nova compra aprovada
            const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Calcular expiração
            let expiresAt = null;
            let expiresAtTimestamp = null;
            
            if (product.time_amount && product.time_unit && !product.infinito) {
                const now = Date.now();
                let expirationTime;
                
                switch (product.time_unit) {
                    case 'min':
                        expirationTime = now + (product.time_amount * 60 * 1000);
                        break;
                    case 'h':
                        expirationTime = now + (product.time_amount * 60 * 60 * 1000);
                        break;
                    case 'd':
                        expirationTime = now + (product.time_amount * 24 * 60 * 60 * 1000);
                        break;
                    default:
                        expirationTime = null;
                }
                
                if (expirationTime) {
                    expiresAt = new Date(expirationTime).toISOString();
                    expiresAtTimestamp = expirationTime;
                }
            }
            
            approved[purchaseId] = {
                id: purchaseId,
                paymentId: paymentId,
                userId: payment.userId,
                discordId: payment.userId,
                username: steamLink.discord || steamLink.username || 'Unknown',
                steamId: steamLink.steamId,
                productId: payment.productId,
                productName: payment.productName,
                productPrice: payment.amount,
                deliveryCommand: product.approval_command || product.deliveryCommand,
                removalCommand: product.expiration_command || product.removalCommand,
                hasValidity: !product.infinito && product.time_amount && product.time_unit,
                validityTime: product.time_amount || null,
                validityUnit: product.time_unit || null,
                approvedAt: new Date().toISOString(),
                approvedAtTimestamp: Date.now(),
                expiresAt: expiresAt,
                expiresAtTimestamp: expiresAtTimestamp,
                delivered: false,
                deliveredAt: null,
                expired: false,
                expiredAt: null,
                removed: false,
                removedAt: null,
                status: 'approved'
            };
            
            fs.writeFileSync(approvedPath, JSON.stringify(approved, null, 2));
            console.log(`✅ Compra aprovada criada: ${purchaseId}`);
        }

        // Executar entrega
        await executeProductDelivery(payment.userId, payment.productId, paymentId);
        
    } catch (error) {
        console.error(`❌ Erro ao processar pagamento aprovado ${paymentId}:`, error);
    }
}

/**
 * Executa a entrega do produto
 */
async function executeProductDelivery(userId, productId, paymentId) {
    try {
        console.log(`🚚 Executando entrega para usuário ${userId}, produto ${productId}...`);
        
        // Carregar dados necessários
        const productsPath = path.join(__dirname, '..', 'data', 'produtos.json');
        const linksPath = path.join(__dirname, '..', 'data', 'links.json');
        const approvedPath = path.join(__dirname, '..', 'data', 'approved_purchases.json');
        
        const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        const links = JSON.parse(fs.readFileSync(linksPath, 'utf8'));
        const approved = JSON.parse(fs.readFileSync(approvedPath, 'utf8'));
        
        const product = products[productId];
        const steamLink = links[userId];
        
        if (!product || !steamLink) {
            throw new Error('Dados do produto ou vínculo Steam não encontrados');
        }

        // Encontrar a compra aprovada
        const purchase = Object.values(approved).find(p => p.paymentId === paymentId);
        if (!purchase) {
            throw new Error('Compra aprovada não encontrada');
        }

        // Verificar se já foi entregue
        if (purchase.delivered) {
            console.log(`⚠️ Produto já foi entregue para ${userId}`);
            return;
        }

        // Executar comando de entrega
        const deliveryCommand = product.approval_command || product.deliveryCommand;
        if (!deliveryCommand) {
            throw new Error('Comando de entrega não definido no produto');
        }

        // Substituir variáveis
        const finalCommand = deliveryCommand
            .replace('{steamid}', steamLink.steamId)
            .replace('{username}', steamLink.discord || steamLink.username || 'Unknown')
            .replace('{product}', product.name)
            .replace('{quantity}', 1);

        console.log(`🔧 Executando comando de entrega: ${finalCommand}`);
        
        // Aqui você pode integrar com o sistema RCON
        // Por enquanto, vamos simular a entrega
        const deliveryResult = await executeRconCommand(finalCommand);
        
        // Marcar como entregue
        purchase.delivered = true;
        purchase.deliveredAt = new Date().toISOString();
        purchase.deliveryCommand = finalCommand;
        purchase.deliveryResult = deliveryResult;
        
        // Salvar alterações
        fs.writeFileSync(approvedPath, JSON.stringify(approved, null, 2));
        
        console.log(`✅ Produto entregue com sucesso para ${userId}`);
        
    } catch (error) {
        console.error(`❌ Erro na entrega do produto:`, error);
        throw error;
    }
}

/**
 * Executa comando RCON (simulado por enquanto)
 */
async function executeRconCommand(command) {
    try {
        // Integração com RCON aqui
        // Por enquanto, simula execução
        console.log(`🔧 Executando comando RCON: ${command}`);
        
        // Simular delay de execução
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            command: command,
            response: 'Comando executado com sucesso',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Erro ao executar comando RCON:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = {
    createPayment,
    createPaymentPreference,
    createPixPayment,
    checkPaymentStatus,
    getUserPayments,
    getUserApprovedPurchases,
    testMercadoPagoConnection,
    getPaymentStats,
    savePaymentToFile,
    updatePaymentStatus,
    moveToApprovedPurchases,
    startPaymentChecker,
    stopPaymentChecker,
    checkAllPendingPayments,
    processApprovedPayment,
    executeProductDelivery
};