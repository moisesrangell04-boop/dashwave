import { PrismaClient, TenantPlan, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Wave CRM database...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'wave-crm' },
    update: {},
    create: {
      name: 'Wave CRM',
      slug: 'wave-crm',
      plan: TenantPlan.professional,
      maxUsers: 50,
      maxWhatsAppInstances: 10,
      maxLeads: 10000,
      maxAgents: 10,
      status: 'active',
    },
  });

  console.log(`✓ Tenant created: ${tenant.name}`);

  const workspace = await prisma.workspace.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Principal' } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'Principal',
      description: 'Workspace principal',
      settings: { businessHours: { start: '08:00', end: '18:00', timezone: 'America/Sao_Paulo' } },
    },
  });

  console.log(`✓ Workspace created: ${workspace.name}`);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@wavecrm.com.br' },
    update: {},
    create: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'Administrador',
      email: 'admin@wavecrm.com.br',
      password: hashedPassword,
      role: UserRole.owner,
    },
  });

  console.log(`✓ Admin user created: ${adminUser.email}`);

  const agentUser = await prisma.user.upsert({
    where: { email: 'agente@wavecrm.com.br' },
    update: {},
    create: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'Agente Teste',
      email: 'agente@wavecrm.com.br',
      password: hashedPassword,
      role: UserRole.agent,
    },
  });

  console.log(`✓ Agent user created: ${agentUser.email}`);

  const pipelineStages = [
    { id: 'stage-new', name: 'Novo Lead', color: '#6366f1', order: 0, winProbability: 10 },
    { id: 'stage-qualified', name: 'Qualificado', color: '#3b82f6', order: 1, winProbability: 25 },
    { id: 'stage-proposal', name: 'Proposta Enviada', color: '#f59e0b', order: 2, winProbability: 50 },
    { id: 'stage-negotiation', name: 'Negociação', color: '#f97316', order: 3, winProbability: 75 },
    { id: 'stage-closed-won', name: 'Ganho', color: '#22c55e', order: 4, winProbability: 100, isFinal: true },
    { id: 'stage-closed-lost', name: 'Perdido', color: '#ef4444', order: 5, winProbability: 0, isFinal: true },
  ];

  const pipeline = await prisma.pipeline.upsert({
    where: { tenantId_workspaceId_name: { tenantId: tenant.id, workspaceId: workspace.id, name: 'Vendas' } },
    update: {},
    create: {
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'Vendas',
      description: 'Pipeline principal de vendas',
      stages: pipelineStages,
      isDefault: true,
    },
  });

  console.log(`✓ Pipeline created: ${pipeline.name} (${pipelineStages.length} stages)`);

  const contacts = [
    { name: 'Maria Silva', phone: '5511999999991' },
    { name: 'João Santos', phone: '5511999999992' },
    { name: 'Ana Oliveira', phone: '5511999999993' },
    { name: 'Carlos Lima', phone: '5511999999994' },
    { name: 'Julia Costa', phone: '5511999999995' },
  ];

  for (const c of contacts) {
    await prisma.contact.upsert({
      where: { tenantId_phone: { tenantId: tenant.id, phone: c.phone } },
      update: {},
      create: {
        tenantId: tenant.id,
        workspaceId: workspace.id,
        name: c.name,
        phone: c.phone,
        tags: ['seed'],
      },
    });
  }

  console.log(`✓ ${contacts.length} contacts created`);

  const aiAgent = await prisma.aIAgent.upsert({
    where: { id: 'seed-agent-1' },
    update: {},
    create: {
      id: 'seed-agent-1',
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'Ana (Assistente IA)',
      description: 'Assistente virtual para atendimento inicial',
      isActive: true,
      config: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 1024,
        systemPrompt: 'Você é uma assistente virtual simpática e profissional da empresa Wave CRM. Seu objetivo é ajudar os clientes com dúvidas e agendar reuniões.',
        personality: 'friendly',
        language: 'pt-BR',
        useCompanyInfo: true,
        useChatHistory: true,
        fallbackToHuman: true,
      },
      triggers: {
        type: 'unassigned',
        maxDailyConversations: 100,
      },
    },
  });

  console.log(`✓ AI Agent created: ${aiAgent.name}`);

  const automation = await prisma.automation.upsert({
    where: { id: 'seed-auto-1' },
    update: {},
    create: {
      id: 'seed-auto-1',
      tenantId: tenant.id,
      workspaceId: workspace.id,
      name: 'Boas-vindas automáticas',
      description: 'Envia mensagem de boas-vindas quando uma nova conversa é criada',
      trigger: {
        type: 'conversation_created',
      },
      actions: [
        {
          type: 'send_message',
          config: {
            message: 'Olá! 👋 Bem-vindo(a) à Wave CRM! Como podemos ajudar você hoje?',
          },
          order: 0,
        },
        {
          type: 'add_tag',
          config: {
            tag: 'boas-vindas',
          },
          order: 1,
        },
      ],
      isActive: true,
    },
  });

  console.log(`✓ Automation created: ${automation.name}`);

  console.log('\n✅ Seed completed successfully!');
  console.log('\n📧 Admin login: admin@wavecrm.com.br / admin123');
  console.log('📧 Agent login: agente@wavecrm.com.br / admin123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
