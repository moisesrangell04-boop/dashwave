import { PrismaClient, TenantPlan, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function daysAgo(days: number, hour = -1): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour >= 0 ? hour : Math.floor(Math.random() * 10) + 8, Math.floor(Math.random() * 60), 0, 0);
  return d;
}

function minutesAgo(minutes: number): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutes);
  return d;
}

const CONTACTS_DATA = [
  { name: 'Maria Silva',       phone: '5511987654321', email: 'maria.silva@techsolucoes.com.br',  tags: ['vip', 'recorrente'],          notes: 'Cliente premium, prefere contato por WhatsApp' },
  { name: 'João Santos',       phone: '5521996543210', email: 'joao.santos@inovacorp.com.br',      tags: ['prospect', 'decisor'],        notes: 'Interessado no plano empresarial' },
  { name: 'Ana Oliveira',      phone: '5511982345678', email: 'ana.oliveira@dataflow.com.br',      tags: ['vip', 'parceiro'],            notes: 'Contrato anual renovado' },
  { name: 'Carlos Lima',       phone: '5541994321098', email: 'carlos.lima@nextsystems.com.br',    tags: ['revendedor', 'parceiro'],     notes: 'Revendedor autorizado - comissão 15%' },
  { name: 'Julia Costa',       phone: '5531985678901', email: 'julia.costa@mktdigital.com.br',     tags: ['recorrente', 'fidelizado'],   notes: 'Cliente ativa há 2 anos' },
  { name: 'Pedro Almeida',     phone: '5511993456789', email: 'pedro.almeida@grupofusion.com.br',  tags: ['prospect', 'alta-prioridade'],notes: 'Solicitou orçamento urgente - prazo curto' },
  { name: 'Lucia Mendes',      phone: '5521987890123', email: 'lucia.mendes@brasiltech.com.br',    tags: ['recorrente', 'suporte'],      notes: 'Usa intensivamente o módulo de automações' },
  { name: 'Rafael Barbosa',    phone: '5511998765432', email: 'rafael.barbosa@webstudio.com.br',   tags: ['prospect'],                   notes: 'Veio por indicação da Ana Oliveira' },
  { name: 'Fernanda Rocha',    phone: '5519994567890', email: 'fernanda.rocha@amplify.com.br',     tags: ['vip', 'parceiro', 'recorrente'], notes: 'Indicadora ativa - comissão 10%' },
  { name: 'Thiago Martins',    phone: '5511992109876', email: 'thiago.martins@comparatec.com.br',  tags: ['prospect'],                   notes: 'Avaliando concorrentes (Zendesk, Freshdesk)' },
  { name: 'Patricia Souza',    phone: '5521981234567', email: 'patricia.souza@newmedia.com.br',    tags: ['recorrente', 'fidelizado'],   notes: 'Renovação programada para próximo mês' },
  { name: 'Gustavo Nunes',     phone: '5511976543219', email: 'gustavo.nunes@startuplab.com.br',   tags: ['prospect', 'decisor'],        notes: 'CTO de startup - avaliação técnica' },
  { name: 'Camila Duarte',     phone: '5541985432109', email: 'camila.duarte@globalserv.com.br',   tags: ['vip', 'recorrente'],          notes: 'Contrato anual - grande volume' },
  { name: 'Eduardo Campos',    phone: '5511978901235', email: 'eduardo.campos@revendamax.com.br',  tags: ['revendedor', 'parceiro'],     notes: 'Parceiro de revenda região Sul' },
  { name: 'Isabela Torres',    phone: '5511994567012', email: 'isabela.torres@mktstrategy.com.br', tags: ['prospect', 'alta-prioridade', 'decisor'], notes: 'Diretora de marketing - grande potencial' },
];

const CONVERSATIONS_DATA = [
  {
    contactIdx: 0, status: 'active' as const, aiActive: true, unreadCount: 2, daysOld: 1,
    messages: [
      { direction: 'outbound' as const, content: 'Olá Maria! Tudo bem? 😊 Vi que você entrou em contato. Como posso ajudar hoje?' },
      { direction: 'inbound' as const, content: 'Oi! Preciso entender melhor como funciona a integração com o Salesforce.' },
      { direction: 'outbound' as const, content: 'Claro! Temos integração nativa via API REST. A migração é automatizada e nossa equipe acompanha todo o processo. Posso agendar uma demo personalizada?' },
      { direction: 'inbound' as const, content: 'Pode agendar para quinta às 14h?' },
      { direction: 'outbound' as const, content: 'Perfeito! Quinta às 14h agendado. Enviarei o link do Google Meet. 🗓️' },
      { direction: 'inbound' as const, content: 'Ótimo! Até quinta.' },
    ],
  },
  {
    contactIdx: 1, status: 'resolved' as const, aiActive: false, unreadCount: 0, daysOld: 3,
    messages: [
      { direction: 'inbound' as const, content: 'Bom dia! Gostaria de saber mais sobre o plano Enterprise.' },
      { direction: 'outbound' as const, content: 'Bom dia, João! O Enterprise inclui usuários ilimitados, SLA prioritário e integrações customizadas. Qual o tamanho da sua equipe?' },
      { direction: 'inbound' as const, content: 'Temos 30 atendentes. Qual o valor?' },
      { direction: 'outbound' as const, content: 'Para 30 atendentes, o valor é R$ 2.497/mês com faturamento anual. Inclui suporte 24/7 e onboarding dedicado.' },
      { direction: 'inbound' as const, content: 'Tem desconto para contrato anual?' },
      { direction: 'outbound' as const, content: 'Sim! No anual você economiza 17% comparado ao mensal. Posso enviar a proposta formal?' },
      { direction: 'inbound' as const, content: 'Pode enviar. Vou levar para o financeiro.' },
      { direction: 'outbound' as const, content: 'Enviado! Qualquer dúvida estou à disposição. 😊' },
    ],
  },
  {
    contactIdx: 2, status: 'active' as const, aiActive: true, unreadCount: 1, daysOld: 0,
    messages: [
      { direction: 'outbound' as const, content: 'Ana, sua fatura vence em 5 dias! 💳 Precisa do boleto atualizado?' },
      { direction: 'inbound' as const, content: 'Sim por favor, me manda aqui mesmo.' },
      { direction: 'outbound' as const, content: 'Já enviado por e-mail e aqui no chat. Valor: R$ 697,00 com vencimento em 5 dias. 😊' },
      { direction: 'inbound' as const, content: 'Recebi, obrigada! Vou pagar hoje.' },
    ],
  },
  {
    contactIdx: 3, status: 'resolved' as const, aiActive: false, unreadCount: 0, daysOld: 5,
    messages: [
      { direction: 'inbound' as const, content: 'Suporte urgente: o módulo de relatórios está demorando mais de 2 minutos para carregar.' },
      { direction: 'outbound' as const, content: 'Carlos, já vou verificar! Pode me dizer quantos registros você tem no período?' },
      { direction: 'inbound' as const, content: 'Cerca de 50 mil conversas nos últimos 6 meses.' },
      { direction: 'outbound' as const, content: 'Identificado! Era um índice de banco que precisava ser recompilado. Corrigindo agora...' },
      { direction: 'outbound' as const, content: 'Pronto! Os relatórios agora devem abrir em menos de 5 segundos. Pode testar?' },
      { direction: 'inbound' as const, content: 'Perfeito, voltou ao normal! Muito obrigado pelo atendimento rápido.' },
    ],
  },
  {
    contactIdx: 4, status: 'waiting' as const, aiActive: true, unreadCount: 0, daysOld: 2,
    messages: [
      { direction: 'inbound' as const, content: 'Olá! Vocês têm integração com Instagram DM?' },
      { direction: 'outbound' as const, content: 'Sim, Julia! Temos integração com Instagram via Meta Cloud API para mensagens diretas e comentários.' },
      { direction: 'inbound' as const, content: 'Ótimo! E como funciona para múltiplos agentes atenderem ao mesmo tempo?' },
      { direction: 'outbound' as const, content: 'Funciona com filas inteligentes. Você define regras de distribuição e os agentes recebem conversas automaticamente com base na carga de trabalho.' },
      { direction: 'inbound' as const, content: 'Tem como testar antes de contratar?' },
    ],
  },
  {
    contactIdx: 5, status: 'active' as const, aiActive: false, unreadCount: 3, daysOld: 1,
    messages: [
      { direction: 'inbound' as const, content: 'Solicitei um orçamento há 2 dias e ainda não recebi retorno.' },
      { direction: 'outbound' as const, content: 'Pedro, desculpe a demora! Vou verificar agora mesmo.' },
      { direction: 'inbound' as const, content: 'OK, aguardo.' },
      { direction: 'outbound' as const, content: 'Orçamento aprovado! Plano Professional com 10 usuários: R$ 1.897/mês. Posso enviar o contrato?' },
      { direction: 'inbound' as const, content: 'Pode enviar! Mas preciso de 3 instâncias de WhatsApp.' },
      { direction: 'outbound' as const, content: 'Sem problema! Já incluso no Professional. Enviando contrato por e-mail agora. 📄' },
    ],
  },
  {
    contactIdx: 6, status: 'resolved' as const, aiActive: false, unreadCount: 0, daysOld: 7,
    messages: [
      { direction: 'outbound' as const, content: 'Lucia, notamos que você não usa o módulo de automações. Posso ajudar a configurar?' },
      { direction: 'inbound' as const, content: 'Oi! Tenho dificuldade em criar o fluxo de boas-vindas.' },
      { direction: 'outbound' as const, content: 'Simples! Vá em Automações → Nova Automação → Trigger "Conversa Criada" → Ação "Enviar Mensagem". Passo a passo aqui: [link]' },
      { direction: 'inbound' as const, content: 'Consegui criar! Muito mais fácil do que imaginei. Obrigada!' },
    ],
  },
  {
    contactIdx: 8, status: 'active' as const, aiActive: true, unreadCount: 2, daysOld: 0,
    messages: [
      { direction: 'inbound' as const, content: 'Urgente: minha instância do WhatsApp desconectou!' },
      { direction: 'outbound' as const, content: 'Fernanda, vou verificar agora. Um momento...' },
      { direction: 'outbound' as const, content: 'QR Code expirado. Vou gerar um novo. 🤳' },
      { direction: 'inbound' as const, content: 'Ok, pronto com o celular.' },
      { direction: 'outbound' as const, content: 'Novo QR Code gerado! Abra WhatsApp → Aparelhos conectados → Conectar dispositivo e escaneie.' },
      { direction: 'inbound' as const, content: 'Conectou! Perfeito, muito obrigada!' },
    ],
  },
  {
    contactIdx: 11, status: 'pending' as const, aiActive: false, unreadCount: 1, daysOld: 4,
    messages: [
      { direction: 'inbound' as const, content: 'Olá! Gostaria de entender a API pública de vocês para integrar com nosso sistema.' },
      { direction: 'outbound' as const, content: 'Gustavo! Temos API REST completa com documentação OpenAPI. Qual linguagem vocês usam?' },
      { direction: 'inbound' as const, content: 'Python principalmente. Tem SDK oficial?' },
      { direction: 'outbound' as const, content: 'Sim! SDK Python, Node.js e Java - todos open source no GitHub. Posso te mandar os links.' },
      { direction: 'inbound' as const, content: 'Por favor! Vou avaliar com meu time técnico.' },
    ],
  },
  {
    contactIdx: 12, status: 'active' as const, aiActive: false, unreadCount: 0, daysOld: 2,
    messages: [
      { direction: 'outbound' as const, content: 'Camila, seu contrato anual vence em 30 dias. Gostaria de renovar com desconto?' },
      { direction: 'inbound' as const, content: 'Pode me mandar as opções?' },
      { direction: 'outbound' as const, content: 'Opção 1: Renova por 1 ano com 15% de desconto → R$ 5.943/ano. Opção 2: Upgrade Enterprise → R$ 8.904/ano com 20% off.' },
      { direction: 'inbound' as const, content: 'Vou com a opção 1. Pode gerar o boleto?' },
      { direction: 'outbound' as const, content: 'Boleto gerado e enviado! Vence em 15 dias. Obrigado pela confiança, Camila! 🎉' },
    ],
  },
  {
    contactIdx: 14, status: 'active' as const, aiActive: true, unreadCount: 2, daysOld: 1,
    messages: [
      { direction: 'inbound' as const, content: 'Preciso de uma demonstração do produto para 5 pessoas da minha equipe de marketing.' },
      { direction: 'outbound' as const, content: 'Isabela, ótimo! Tenho disponibilidade sexta às 10h ou segunda às 14h. Qual prefere?' },
      { direction: 'inbound' as const, content: 'Sexta às 10h está ótimo!' },
      { direction: 'outbound' as const, content: 'Agendado! Enviarei link do Meet e agenda com os tópicos. 📅' },
    ],
  },
];

const LEAD_DATA = [
  // Pipeline Vendas
  { contactIdx: 5,  title: 'Plano Professional - Grupo Fusion',       stageId: 'vendas-negociacao',  value: 1897,  priority: 'high' as const,   source: 'website' as const,      pipeline: 'vendas' },
  { contactIdx: 1,  title: 'Proposta Enterprise - Inovacorp',         stageId: 'vendas-proposta',    value: 2497,  priority: 'high' as const,   source: 'referral' as const,     pipeline: 'vendas' },
  { contactIdx: 11, title: 'Integração API - Startup Lab',            stageId: 'vendas-novo',        value: 897,   priority: 'medium' as const, source: 'referral' as const,     pipeline: 'vendas' },
  { contactIdx: 14, title: 'Demo Equipe Marketing - MktStrategy',     stageId: 'vendas-qualificado', value: 1497,  priority: 'high' as const,   source: 'social_media' as const, pipeline: 'vendas' },
  { contactIdx: 7,  title: 'Plano Starter - Web Studio',              stageId: 'vendas-novo',        value: 397,   priority: 'low' as const,    source: 'whatsapp' as const,     pipeline: 'vendas' },
  { contactIdx: 10, title: 'Renovação New Media',                     stageId: 'vendas-qualificado', value: 697,   priority: 'medium' as const, source: 'email' as const,        pipeline: 'vendas' },
  { contactIdx: 0,  title: 'Integração Salesforce - TechSoluções',    stageId: 'vendas-negociacao',  value: 1497,  priority: 'high' as const,   source: 'whatsapp' as const,     pipeline: 'vendas' },
  { contactIdx: 2,  title: 'Upgrade Professional - DataFlow',         stageId: 'vendas-proposta',    value: 697,   priority: 'medium' as const, source: 'email' as const,        pipeline: 'vendas' },
  { contactIdx: 9,  title: 'Avaliação Comparativa - ComparaTec',      stageId: 'vendas-novo',        value: 397,   priority: 'low' as const,    source: 'website' as const,      pipeline: 'vendas' },
  { contactIdx: 13, title: 'Parceria Revenda Sul - RevendaMax',       stageId: 'vendas-qualificado', value: 2997,  priority: 'medium' as const, source: 'referral' as const,     pipeline: 'vendas' },
  // Convertidos no Vendas
  { contactIdx: 4,  title: 'Plano Professional - MktDigital',         stageId: 'vendas-ganho',       value: 697,   priority: 'medium' as const, source: 'whatsapp' as const,     pipeline: 'vendas', status: 'converted' as const, convertedAt: daysAgo(5)  },
  { contactIdx: 3,  title: 'Upgrade Enterprise - NextSystems',        stageId: 'vendas-ganho',       value: 2497,  priority: 'high' as const,   source: 'whatsapp' as const,     pipeline: 'vendas', status: 'converted' as const, convertedAt: daysAgo(8)  },
  { contactIdx: 8,  title: 'Plano Professional - Amplify',            stageId: 'vendas-ganho',       value: 1497,  priority: 'medium' as const, source: 'referral' as const,     pipeline: 'vendas', status: 'converted' as const, convertedAt: daysAgo(12) },
  { contactIdx: 6,  title: 'Plano Starter - BrasilTech',              stageId: 'vendas-ganho',       value: 397,   priority: 'low' as const,    source: 'email' as const,        pipeline: 'vendas', status: 'converted' as const, convertedAt: daysAgo(18) },
  { contactIdx: 12, title: 'Renovação Anual - GlobalServ',            stageId: 'vendas-ganho',       value: 5943,  priority: 'high' as const,   source: 'email' as const,        pipeline: 'vendas', status: 'converted' as const, convertedAt: daysAgo(3)  },
  // Pipeline Pós-Venda (valores = MRR do contrato)
  { contactIdx: 4,  title: 'Onboarding MktDigital',                   stageId: 'posvenda-onboarding', value: 697,  priority: 'medium' as const, source: 'manual' as const,       pipeline: 'posvenda' },
  { contactIdx: 3,  title: 'Onboarding NextSystems',                  stageId: 'posvenda-treinamento', value: 2497, priority: 'high' as const,   source: 'manual' as const,       pipeline: 'posvenda' },
  { contactIdx: 8,  title: 'Go-Live Amplify',                         stageId: 'posvenda-golive',    value: 1497,  priority: 'medium' as const, source: 'manual' as const,       pipeline: 'posvenda' },
  { contactIdx: 12, title: 'Sucesso GlobalServ Q1',                   stageId: 'posvenda-sucesso',   value: 5943,  priority: 'low' as const,    source: 'manual' as const,       pipeline: 'posvenda', status: 'converted' as const, convertedAt: daysAgo(2) },
  { contactIdx: 0,  title: 'Expansão TechSoluções',                   stageId: 'posvenda-sucesso',   value: 1497,  priority: 'medium' as const, source: 'manual' as const,       pipeline: 'posvenda', status: 'converted' as const, convertedAt: daysAgo(15) },
  // Pipeline Suporte
  { contactIdx: 3,  title: 'Lentidão Relatórios - NextSystems',       stageId: 'suporte-resolvido',  value: 0,     priority: 'high' as const,   source: 'whatsapp' as const,     pipeline: 'suporte', status: 'converted' as const, convertedAt: daysAgo(5) },
  { contactIdx: 6,  title: 'Configuração Automações - BrasilTech',    stageId: 'suporte-resolvido',  value: 0,     priority: 'low' as const,    source: 'email' as const,        pipeline: 'suporte', status: 'converted' as const, convertedAt: daysAgo(7) },
  { contactIdx: 8,  title: 'Reconexão WhatsApp - Amplify',            stageId: 'suporte-resolvido',  value: 0,     priority: 'medium' as const, source: 'whatsapp' as const,     pipeline: 'suporte', status: 'converted' as const, convertedAt: daysAgo(1) },
  { contactIdx: 2,  title: 'Erro na fatura - DataFlow',               stageId: 'suporte-analise',    value: 0,     priority: 'medium' as const, source: 'email' as const,        pipeline: 'suporte' },
  { contactIdx: 9,  title: 'Dúvida integração API - ComparaTec',      stageId: 'suporte-aberto',     value: 0,     priority: 'low' as const,    source: 'website' as const,      pipeline: 'suporte' },
];

const AI_AGENTS_DATA = [
  {
    id: 'seed-agent-2',
    name: 'Rafael (Suporte Técnico)',
    description: 'Agente especializado em suporte técnico e resolução de problemas',
    isActive: true,
    config: {
      provider: 'openai', model: 'gpt-4o', temperature: 0.5, maxTokens: 2048,
      systemPrompt: 'Você é Rafael, especialista em suporte técnico da Wave CRM. Resolva problemas técnicos de forma rápida e eficiente.',
      personality: 'professional', language: 'pt-BR', useCompanyInfo: true, useChatHistory: true, fallbackToHuman: true,
    },
    triggers: { type: 'keyword', keywords: ['suporte', 'técnico', 'erro', 'problema', 'bug', 'lentidão'], maxDailyConversations: 40 },
    totalConversationsHandled: 38, totalMessagesSent: 214, avgResponseTime: 9, satisfactionRate: 91,
  },
  {
    id: 'seed-agent-3',
    name: 'Sophia (Vendas)',
    description: 'Agente de vendas para qualificação e conversão de leads',
    isActive: true,
    config: {
      provider: 'openai', model: 'gpt-4o', temperature: 0.8, maxTokens: 1024,
      systemPrompt: 'Você é Sophia, consultora de vendas da Wave CRM. Qualifique leads e agende demonstrações.',
      personality: 'persuasive', language: 'pt-BR', useCompanyInfo: true, useChatHistory: true, fallbackToHuman: true,
    },
    triggers: { type: 'unassigned', maxDailyConversations: 60 },
    totalConversationsHandled: 72, totalMessagesSent: 498, avgResponseTime: 14, satisfactionRate: 87,
  },
];

const AUTOMATIONS_DATA = [
  {
    id: 'seed-auto-2',
    name: 'Lead quente sem resposta',
    description: 'Notifica o vendedor se um lead de alta prioridade não for respondido em 30 minutos',
    trigger: { type: 'condition', conditions: [{ field: 'lead_priority', operator: 'equals', value: 'high' }, { field: 'time_since_created', operator: 'greater_than', value: '30' }] },
    actions: [{ type: 'notify_user', config: { message: 'Lead de alta prioridade aguardando resposta há mais de 30 minutos!' }, order: 0 }],
    isActive: true, priority: 8, executionCount: 17, lastExecutedAt: daysAgo(1),
  },
  {
    id: 'seed-auto-3',
    name: 'Distribuição por região',
    description: 'Atribui automaticamente leads ao vendedor responsável pela região',
    trigger: { type: 'lead_created' },
    actions: [
      { type: 'assign_user', config: { userId: null }, order: 0 },
      { type: 'send_message', config: { message: 'Olá! Recebemos sua solicitação e em breve um consultor entrará em contato. 😊' }, order: 1 },
    ],
    isActive: true, priority: 5, executionCount: 31, lastExecutedAt: daysAgo(2),
  },
  {
    id: 'seed-auto-4',
    name: 'Follow-up pós-perda',
    description: 'Envia e-mail de reengajamento 7 dias após um lead ser perdido',
    trigger: { type: 'lead_lost' },
    actions: [
      { type: 'send_email', config: { subject: 'Podemos conversar? 💬', body: 'Olá! Notamos que você optou por não seguir em frente. Gostaríamos de entender como podemos melhorar e oferecemos condições especiais para reconsiderar.' }, order: 0 },
    ],
    isActive: true, priority: 3, executionCount: 9, lastExecutedAt: daysAgo(4),
  },
  {
    id: 'seed-auto-5',
    name: 'Pesquisa de satisfação',
    description: 'Envia pesquisa CSAT após encerramento de conversa de suporte',
    trigger: { type: 'conversation_closed' },
    actions: [
      { type: 'send_message', config: { message: 'Como foi seu atendimento? Avalie de 1 a 5 ⭐' }, order: 0 },
    ],
    isActive: true, priority: 4, executionCount: 54, lastExecutedAt: minutesAgo(45),
  },
];

async function main() {
  console.log('🌱 Populando Wave CRM com dados realistas...\n');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Limpeza na ordem inversa de dependências
  console.log('🧹 Limpando dados anteriores...');
  await prisma.auditLog.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.aIAgent.deleteMany();
  await prisma.whatsAppInstance.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.webhookConfiguration.deleteMany();
  await prisma.user.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.tenant.deleteMany();

  // 1. Tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Wave CRM',
      slug: 'wave-crm',
      plan: TenantPlan.professional,
      maxUsers: 50,
      maxWhatsAppInstances: 10,
      maxLeads: 10000,
      maxAgents: 10,
      status: 'active',
      primaryColor: '#6366f1',
    },
  });
  console.log(`✓ Tenant: ${tenant.name}`);

  // 2. Workspace
  const workspace = await prisma.workspace.create({
    data: {
      tenantId: tenant.id,
      name: 'Principal',
      description: 'Workspace principal de atendimento',
      settings: { businessHours: { start: '08:00', end: '18:00', timezone: 'America/Sao_Paulo' } },
    },
  });
  console.log(`✓ Workspace: ${workspace.name}`);

  // 3. Users
  const users = await Promise.all([
    prisma.user.create({ data: { tenantId: tenant.id, workspaceId: workspace.id, name: 'Administrador',   email: 'admin@wavecrm.com.br',      password: hashedPassword, role: UserRole.owner      } }),
    prisma.user.create({ data: { tenantId: tenant.id, workspaceId: workspace.id, name: 'Supervisor',      email: 'supervisor@wavecrm.com.br', password: hashedPassword, role: UserRole.supervisor  } }),
    prisma.user.create({ data: { tenantId: tenant.id, workspaceId: workspace.id, name: 'Carla Mendes',    email: 'carla@wavecrm.com.br',      password: hashedPassword, role: UserRole.agent       } }),
    prisma.user.create({ data: { tenantId: tenant.id, workspaceId: workspace.id, name: 'Roberto Lima',    email: 'roberto@wavecrm.com.br',    password: hashedPassword, role: UserRole.agent       } }),
    prisma.user.create({ data: { tenantId: tenant.id, workspaceId: workspace.id, name: 'Agente Suporte',  email: 'suporte@wavecrm.com.br',    password: hashedPassword, role: UserRole.agent       } }),
  ]);
  console.log(`✓ ${users.length} usuários criados`);

  // 4. WhatsApp Instance
  const instance = await prisma.whatsAppInstance.create({
    data: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'WhatsApp Vendas',
      phoneNumber: '5511940001234',
      provider: 'evolution',
      status: 'connected',
      isActive: true,
      maxConcurrentChats: 50,
      settings: { autoReply: true, workingHours: { start: '08:00', end: '19:00' } },
      lastSyncAt: minutesAgo(3),
    },
  });
  console.log(`✓ Instância WhatsApp: ${instance.name} (${instance.status})`);

  // 5. Contacts
  const contacts = await Promise.all(
    CONTACTS_DATA.map((c, i) =>
      prisma.contact.create({
        data: {
          tenantId: tenant.id,
          workspaceId: workspace.id,
          whatsappInstanceId: instance.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          tags: c.tags,
          notes: c.notes,
          totalConversations: CONVERSATIONS_DATA.filter((conv) => conv.contactIdx === i).length,
          totalMessages: CONVERSATIONS_DATA.filter((conv) => conv.contactIdx === i).reduce((sum, conv) => sum + conv.messages.length, 0),
          lastInteractionAt: daysAgo(Math.floor(Math.random() * 7) + 1),
          createdAt: daysAgo(30 + Math.floor(Math.random() * 60)),
        },
      })
    ),
  );
  console.log(`✓ ${contacts.length} contatos criados`);

  // 6. Pipelines (3 pipelines)
  const vendasStages = [
    { id: 'vendas-novo',        name: 'Novo Lead',        color: '#6366f1', order: 0, winProbability: 10, isDefault: true },
    { id: 'vendas-qualificado', name: 'Qualificado',      color: '#3b82f6', order: 1, winProbability: 30 },
    { id: 'vendas-proposta',    name: 'Proposta Enviada', color: '#f59e0b', order: 2, winProbability: 55 },
    { id: 'vendas-negociacao',  name: 'Negociação',       color: '#f97316', order: 3, winProbability: 75 },
    { id: 'vendas-ganho',       name: 'Ganho',            color: '#22c55e', order: 4, winProbability: 100, isFinal: true },
    { id: 'vendas-perdido',     name: 'Perdido',          color: '#ef4444', order: 5, winProbability: 0,   isFinal: true },
  ];

  const posVendaStages = [
    { id: 'posvenda-onboarding',  name: 'Onboarding',    color: '#6366f1', order: 0, winProbability: 20, isDefault: true },
    { id: 'posvenda-treinamento', name: 'Treinamento',   color: '#8b5cf6', order: 1, winProbability: 50 },
    { id: 'posvenda-golive',      name: 'Go-Live',       color: '#3b82f6', order: 2, winProbability: 75 },
    { id: 'posvenda-sucesso',     name: 'Sucesso',       color: '#22c55e', order: 3, winProbability: 100, isFinal: true },
    { id: 'posvenda-churn',       name: 'Churn',         color: '#ef4444', order: 4, winProbability: 0,   isFinal: true },
  ];

  const suporteStages = [
    { id: 'suporte-aberto',       name: 'Aberto',        color: '#ef4444', order: 0, winProbability: 0,  isDefault: true },
    { id: 'suporte-analise',      name: 'Em Análise',    color: '#f59e0b', order: 1, winProbability: 40 },
    { id: 'suporte-desenvolvimento', name: 'Em Desenvolvimento', color: '#3b82f6', order: 2, winProbability: 70 },
    { id: 'suporte-resolvido',    name: 'Resolvido',     color: '#22c55e', order: 3, winProbability: 100, isFinal: true },
  ];

  const [pipelineVendas, pipelinePosVenda, pipelineSuporte] = await Promise.all([
    prisma.pipeline.create({
      data: {
        tenantId: tenant.id, workspaceId: workspace.id,
        name: 'Vendas', description: 'Pipeline principal de aquisição de novos clientes',
        stages: vendasStages, isDefault: true, isActive: true,
      },
    }),
    prisma.pipeline.create({
      data: {
        tenantId: tenant.id, workspaceId: workspace.id,
        name: 'Pós-Venda', description: 'Onboarding e sucesso do cliente após a venda',
        stages: posVendaStages, isDefault: false, isActive: true,
      },
    }),
    prisma.pipeline.create({
      data: {
        tenantId: tenant.id, workspaceId: workspace.id,
        name: 'Suporte Técnico', description: 'Gestão de tickets e chamados de suporte',
        stages: suporteStages, isDefault: false, isActive: true,
      },
    }),
  ]);
  console.log(`✓ 3 pipelines criados (Vendas, Pós-Venda, Suporte Técnico)`);

  const pipelineMap: Record<string, typeof pipelineVendas> = {
    vendas: pipelineVendas,
    posvenda: pipelinePosVenda,
    suporte: pipelineSuporte,
  };

  // 7. Leads
  const leads = await Promise.all(
    LEAD_DATA.map((ld, i) => {
      const daysCreated = [28, 22, 18, 16, 14, 26, 10, 20, 8, 6, 32, 12, 19, 23, 5, 4, 7, 2, 3, 14, 4, 6, 1, 3, 5][i] ?? 10;
      return prisma.lead.create({
        data: {
          tenantId: tenant.id,
          workspaceId: workspace.id,
          pipelineId: pipelineMap[ld.pipeline].id,
          stageId: ld.stageId,
          contactId: contacts[ld.contactIdx].id,
          assignedUserId: i % 3 === 0 ? users[0].id : i % 3 === 1 ? users[2].id : users[3].id,
          title: ld.title,
          value: ld.value,
          status: ld.status || 'active',
          source: ld.source,
          priority: ld.priority,
          tags: ['vendas', 'q1-2025'],
          notes: '',
          expectedCloseDate: ld.status !== 'converted' ? daysAgo(-14) : undefined,
          convertedAt: ld.convertedAt,
          score: Math.floor(Math.random() * 35) + 40,
          lastActivityAt: daysAgo(Math.floor(Math.random() * 4) + 1),
          createdAt: daysAgo(daysCreated),
        },
      });
    }),
  );
  console.log(`✓ ${leads.length} leads criados em 3 pipelines`);

  // 8. AI Agents
  const agent1 = await prisma.aIAgent.upsert({
    where: { id: 'seed-agent-1' },
    update: {},
    create: {
      id: 'seed-agent-1',
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'Ana (Assistente IA)',
      description: 'Assistente virtual para atendimento inicial e qualificação de leads',
      isActive: true,
      config: {
        provider: 'openai', model: 'gpt-4o', temperature: 0.7, maxTokens: 1024,
        systemPrompt: 'Você é Ana, assistente virtual da Wave CRM. Atenda clientes com cordialidade, qualifique leads e agende reuniões.',
        personality: 'friendly', language: 'pt-BR', useCompanyInfo: true, useChatHistory: true, fallbackToHuman: true,
      },
      triggers: { type: 'unassigned', maxDailyConversations: 80 },
      totalConversationsHandled: 124, totalMessagesSent: 876, avgResponseTime: 7, satisfactionRate: 94,
      lastActiveAt: minutesAgo(8),
    },
  });

  const [agent2, agent3] = await Promise.all(
    AI_AGENTS_DATA.map((a) =>
      prisma.aIAgent.create({
        data: {
          tenantId: tenant.id,
          workspaceId: workspace.id,
          ...a,
          lastActiveAt: minutesAgo(Math.floor(Math.random() * 90) + 10),
        },
      })
    ),
  );
  console.log(`✓ 3 agentes IA criados`);

  // 9. Conversations & Messages (conversas ricas do script + histórico 30 dias)
  const agentsList = [agent1, agent2, agent3];
  let totalMessages = 0;
  let aiConvIdx = 0;
  // Pre-compute agent for each AI conversation (runs synchronously before Promises)
  const convAgents = CONVERSATIONS_DATA.map((convData) =>
    convData.aiActive ? agentsList[aiConvIdx++ % 3] : null,
  );

  const conversations = await Promise.all(
    CONVERSATIONS_DATA.map(async (convData, cIdx) => {
      const assignedAgent = convAgents[cIdx];
      const conversation = await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          workspaceId: workspace.id,
          contactId: contacts[convData.contactIdx].id,
          whatsappInstanceId: instance.id,
          assignedUserId: cIdx % 2 === 0 ? users[2].id : users[3].id,
          assignedAgentId: assignedAgent?.id,
          status: convData.status,
          channel: 'whatsapp',
          priority: cIdx < 3 ? 'high' : cIdx < 6 ? 'medium' : 'low',
          subject: `Conversa com ${contacts[convData.contactIdx].name}`,
          lastMessage: convData.messages[convData.messages.length - 1].content.substring(0, 100),
          lastMessageAt: daysAgo(convData.daysOld, 10 + cIdx),
          lastActivityAt: daysAgo(convData.daysOld, 10 + cIdx),
          unreadCount: convData.unreadCount,
          aiActive: convData.aiActive,
          tags: ['atendimento'],
          createdAt: daysAgo(convData.daysOld + 1, 9),
        },
      });

      const messages = await Promise.all(
        convData.messages.map((msg, mIdx) =>
          prisma.message.create({
            data: {
              tenantId: tenant.id,
              workspaceId: workspace.id,
              conversationId: conversation.id,
              contactId: contacts[convData.contactIdx].id,
              whatsappInstanceId: instance.id,
              direction: msg.direction,
              type: 'text',
              status: 'read',
              origin: msg.direction === 'outbound' && assignedAgent ? 'ai' : 'human',
              aiAgentId: msg.direction === 'outbound' && assignedAgent ? assignedAgent.id : undefined,
              content: msg.content,
              sentAt: daysAgo(convData.daysOld, 9 + mIdx),
              deliveredAt: daysAgo(convData.daysOld, 9 + mIdx),
              readAt: daysAgo(convData.daysOld, 9 + mIdx),
              createdAt: daysAgo(convData.daysOld, 9 + mIdx),
            },
          })
        ),
      );
      totalMessages += messages.length;
      return conversation;
    }),
  );

  // Histórico de 30 dias: 2 a 4 conversas por dia com mensagens variadas
  const historicalTemplates = [
    { msgs: [{ d: 'inbound', c: 'Olá! Gostaria de saber mais sobre os planos.' }, { d: 'outbound', c: 'Claro! Qual o tamanho da sua equipe?' }, { d: 'inbound', c: 'Somos 8 pessoas.' }, { d: 'outbound', c: 'O plano Starter atende perfeitamente! R$ 397/mês.' }] },
    { msgs: [{ d: 'inbound', c: 'Precisando de suporte com a integração WhatsApp.' }, { d: 'outbound', c: 'Pode me descrever o problema?' }, { d: 'inbound', c: 'O QR code não aparece.' }, { d: 'outbound', c: 'Vou gerar um novo agora. Pronto, pode escanear!' }, { d: 'inbound', c: 'Funcionou! Obrigado.' }] },
    { msgs: [{ d: 'inbound', c: 'Como funciona o período de teste?' }, { d: 'outbound', c: '14 dias gratuitos, sem cartão de crédito!' }, { d: 'inbound', c: 'Perfeito, vou testar.' }] },
    { msgs: [{ d: 'outbound', c: 'Olá! Sua avaliação gratuita vence amanhã. Posso ajudar com alguma dúvida?' }, { d: 'inbound', c: 'Sim! Tem como exportar os dados para CSV?' }, { d: 'outbound', c: 'Sim! Em Relatórios → Exportar → escolha o período. 😊' }, { d: 'inbound', c: 'Obrigado!' }] },
    { msgs: [{ d: 'inbound', c: 'Vocês têm integração com RD Station?' }, { d: 'outbound', c: 'Temos via webhook e API. Posso te mostrar como configurar?' }, { d: 'inbound', c: 'Por favor!' }, { d: 'outbound', c: 'Enviei o guia de integração por e-mail. 📧' }] },
    { msgs: [{ d: 'inbound', c: 'Quero cancelar minha conta.' }, { d: 'outbound', c: 'Entendo. Pode me contar o motivo para tentarmos resolver?' }, { d: 'inbound', c: 'Está muito caro para minha realidade atual.' }, { d: 'outbound', c: 'Posso oferecer 20% de desconto por 3 meses. O que acha?' }, { d: 'inbound', c: 'Tudo bem, aceito!' }] },
  ];

  let historicalTotal = 0;
  let histAiIdx = aiConvIdx; // continue rotation from where CONVERSATIONS_DATA left off

  // Conversas de hoje (3 conversas para conversationsToday > 0)
  const todayTemplates = [
    { msgs: [{ d: 'inbound', c: 'Bom dia! Quero saber sobre o plano Professional.' }, { d: 'outbound', c: 'Bom dia! O Professional inclui até 20 usuários, 5 instâncias WhatsApp e relatórios avançados por R$ 1.897/mês. Posso enviar uma proposta?' }, { d: 'inbound', c: 'Sim, por favor! Pode mandar para o meu e-mail.' }] },
    { msgs: [{ d: 'inbound', c: 'Suporte: meu relatório de ontem sumiu.' }, { d: 'outbound', c: 'Entendido! Vou verificar. Pode me confirmar qual relatório e o período?' }, { d: 'inbound', c: 'Relatório de conversas de ontem, 8 a 18h.' }, { d: 'outbound', c: 'Encontrei! O cache estava desatualizado. Já reprocessei — pode acessar novamente. 🔧' }] },
    { msgs: [{ d: 'outbound', c: 'Olá! Sua renovação anual vence em 7 dias. Podemos conversar sobre as condições de renovação?' }, { d: 'inbound', c: 'Oi! Sim, quero renovar. Tem desconto para pagamento antecipado?' }, { d: 'outbound', c: 'Sim! Pagamento antecipado tem 10% de desconto adicional. Vou preparar o boleto. 🎉' }] },
  ];
  for (let tc = 0; tc < todayTemplates.length; tc++) {
    const tpl = todayTemplates[tc];
    const isTodayAi = tc % 2 === 0;
    const todayAgent = isTodayAi ? agentsList[histAiIdx++ % 3] : null;
    const conv = await prisma.conversation.create({
      data: {
        tenantId: tenant.id,
        workspaceId: workspace.id,
        contactId: contacts[tc % contacts.length].id,
        whatsappInstanceId: instance.id,
        assignedUserId: tc % 2 === 0 ? users[2].id : users[3].id,
        assignedAgentId: todayAgent?.id,
        status: 'active',
        channel: 'whatsapp',
        priority: tc === 1 ? 'high' : 'medium',
        subject: `Atendimento hoje-${tc}`,
        lastMessage: tpl.msgs[tpl.msgs.length - 1].c.substring(0, 80),
        lastMessageAt: minutesAgo(30 - tc * 8),
        lastActivityAt: minutesAgo(30 - tc * 8),
        unreadCount: tc === 1 ? 1 : 0,
        aiActive: isTodayAi,
        tags: ['atendimento'],
        createdAt: minutesAgo(90 - tc * 20),
      },
    });
    for (let mIdx = 0; mIdx < tpl.msgs.length; mIdx++) {
      const msg = tpl.msgs[mIdx];
      await prisma.message.create({
        data: {
          tenantId: tenant.id, workspaceId: workspace.id,
          conversationId: conv.id, contactId: contacts[tc % contacts.length].id,
          whatsappInstanceId: instance.id,
          direction: msg.d as 'inbound' | 'outbound', type: 'text', status: 'read',
          origin: msg.d === 'outbound' && todayAgent ? 'ai' : 'human',
          aiAgentId: msg.d === 'outbound' && todayAgent ? todayAgent.id : undefined,
          content: msg.c,
          createdAt: minutesAgo(80 - tc * 20 + mIdx * 5),
        },
      });
      historicalTotal++;
    }
  }

  for (let day = 1; day <= 30; day++) {
    const count = 2 + Math.floor(Math.random() * 3); // 2 a 4 por dia
    for (let c = 0; c < count; c++) {
      const tpl = historicalTemplates[(day + c) % historicalTemplates.length];
      const contactIdx = (day + c) % contacts.length;
      const isAiHandled = c % 2 === 0;
      const histAgent = isAiHandled ? agentsList[histAiIdx++ % 3] : null;
      const conv = await prisma.conversation.create({
        data: {
          tenantId: tenant.id,
          workspaceId: workspace.id,
          contactId: contacts[contactIdx].id,
          whatsappInstanceId: instance.id,
          assignedUserId: c % 2 === 0 ? users[2].id : users[3].id,
          assignedAgentId: histAgent?.id,
          status: day > 2 ? 'resolved' : 'active',
          channel: 'whatsapp',
          priority: 'low',
          subject: `Atendimento ${day}-${c}`,
          lastMessage: tpl.msgs[tpl.msgs.length - 1].c.substring(0, 80),
          lastMessageAt: daysAgo(day, 9 + c),
          lastActivityAt: daysAgo(day, 9 + c),
          unreadCount: 0,
          aiActive: isAiHandled,
          tags: ['atendimento'],
          createdAt: daysAgo(day, 8 + c),
        },
      });

      for (let mIdx = 0; mIdx < tpl.msgs.length; mIdx++) {
        const msg = tpl.msgs[mIdx];
        await prisma.message.create({
          data: {
            tenantId: tenant.id,
            workspaceId: workspace.id,
            conversationId: conv.id,
            contactId: contacts[contactIdx].id,
            whatsappInstanceId: instance.id,
            direction: msg.d as 'inbound' | 'outbound',
            type: 'text',
            status: 'read',
            origin: msg.d === 'outbound' && histAgent ? 'ai' : 'human',
            aiAgentId: msg.d === 'outbound' && histAgent ? histAgent.id : undefined,
            content: msg.c,
            sentAt: daysAgo(day, 9 + mIdx * 0.1),
            deliveredAt: daysAgo(day, 9 + mIdx * 0.1),
            readAt: daysAgo(day, 9 + mIdx * 0.1),
            createdAt: daysAgo(day, 9 + mIdx * 0.1),
          },
        });
        historicalTotal++;
      }
    }
  }
  console.log(`✓ ${conversations.length + todayTemplates.length} conversas ricas + ${historicalTotal} mensagens históricas (30 dias + hoje)`);

  // 10. Automations
  await prisma.automation.upsert({
    where: { id: 'seed-auto-1' },
    update: {},
    create: {
      id: 'seed-auto-1',
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'Boas-vindas automáticas',
      description: 'Envia mensagem de boas-vindas quando uma nova conversa é criada',
      trigger: { type: 'conversation_created' },
      actions: [{ type: 'send_message', config: { message: 'Olá! 👋 Bem-vindo(a) à Wave CRM! Como posso ajudar você hoje?' }, order: 0 }],
      isActive: true, priority: 10, executionCount: 287,
      lastExecutedAt: minutesAgo(22),
      tags: ['atendimento'],
    },
  });

  await Promise.all(
    AUTOMATIONS_DATA.map((a) =>
      prisma.automation.create({
        data: {
          tenantId: tenant.id,
          workspaceId: workspace.id,
          ...a,
          tags: ['atendimento'],
        },
      })
    ),
  );
  console.log(`✓ ${1 + AUTOMATIONS_DATA.length} automações criadas`);

  // 11. Webhook
  await prisma.webhookConfiguration.create({
    data: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'Notificações Slack',
      url: 'https://hooks.slack.com/services/exemplo',
      secret: 'whsec_exemplo',
      events: ['conversation.created', 'lead.converted', 'message.inbound'],
      isActive: true,
      successCount: 143,
      errorCount: 2,
      lastCalledAt: minutesAgo(38),
    },
  });
  console.log(`✓ Webhook configurado\n`);

  // 12. Sincronizar stats dos agentes IA com dados reais do DB
  const [a1Convs, a2Convs, a3Convs, a1Msgs, a2Msgs, a3Msgs] = await Promise.all([
    prisma.conversation.count({ where: { tenantId: tenant.id, assignedAgentId: agent1.id } }),
    prisma.conversation.count({ where: { tenantId: tenant.id, assignedAgentId: agent2.id } }),
    prisma.conversation.count({ where: { tenantId: tenant.id, assignedAgentId: agent3.id } }),
    prisma.message.count({ where: { tenantId: tenant.id, aiAgentId: agent1.id } }),
    prisma.message.count({ where: { tenantId: tenant.id, aiAgentId: agent2.id } }),
    prisma.message.count({ where: { tenantId: tenant.id, aiAgentId: agent3.id } }),
  ]);
  await Promise.all([
    prisma.aIAgent.update({ where: { id: agent1.id }, data: { totalConversationsHandled: a1Convs, totalMessagesSent: a1Msgs } }),
    prisma.aIAgent.update({ where: { id: agent2.id }, data: { totalConversationsHandled: a2Convs, totalMessagesSent: a2Msgs } }),
    prisma.aIAgent.update({ where: { id: agent3.id }, data: { totalConversationsHandled: a3Convs, totalMessagesSent: a3Msgs } }),
  ]);
  console.log(`✓ Stats dos agentes sincronizadas: Ana=${a1Convs} convs, Rafael=${a2Convs} convs, Sophia=${a3Convs} convs`);

  const finalLeads = await prisma.lead.count({ where: { tenantId: tenant.id } });
  const finalConvs = await prisma.conversation.count({ where: { tenantId: tenant.id } });
  const finalMsgs = await prisma.message.count({ where: { tenantId: tenant.id } });

  console.log('════════════════════════════════════════════');
  console.log('  ✅ Banco populado com dados realistas!');
  console.log('════════════════════════════════════════════');
  console.log('\n📊 Resumo:');
  console.log(`  • ${contacts.length} contatos`);
  console.log(`  • ${finalLeads} leads em 3 pipelines`);
  console.log(`  • ${finalConvs} conversas (30 dias de histórico)`);
  console.log(`  • ${finalMsgs} mensagens`);
  console.log(`  • 1 instância WhatsApp (conectada)`);
  console.log(`  • ${users.length} usuários`);
  console.log(`  • 3 agentes IA`);
  console.log(`  • ${1 + AUTOMATIONS_DATA.length} automações`);
  console.log('\n📧 Login: admin@wavecrm.com.br / admin123');
}

main()
  .catch((e) => { console.error('Erro no seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
