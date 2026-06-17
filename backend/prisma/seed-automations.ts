import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getOrCreateTenant() {
  const existing = await prisma.tenant.findFirst();
  if (existing) return existing;
  return prisma.tenant.create({
    data: {
      id: 'c2d7e97e-462d-4c23-a4c0-771bab683de3',
      name: 'Wave CRM',
      slug: 'wave-crm',
    },
  });
}

async function getOrCreateWorkspace(tenantId: string) {
  const existing = await prisma.workspace.findFirst({ where: { tenantId } });
  if (existing) return existing;
  return prisma.workspace.create({
    data: {
      id: '80e20129-90a6-44e5-88c4-9c63f91279a3',
      tenantId,
      name: 'Principal',
      slug: 'principal',
    },
  });
}

async function main() {
  console.log('Seeding Pipedrive automations...');

  const tenant = await getOrCreateTenant();
  const workspace = await getOrCreateWorkspace(tenant.id);
  const TENANT_ID = tenant.id;
  const WORKSPACE_ID = workspace.id;

  const user = await prisma.user.findFirst({ where: { tenantId: TENANT_ID } });
  const pipelines = await prisma.pipeline.findMany({ where: { tenantId: TENANT_ID, workspaceId: WORKSPACE_ID } });
  const closerPipeline = pipelines.find(p => p.name === '[CLOSER] VENDAS VIRTUA');
  const saudePipeline = pipelines.find(p => p.name === 'Vendas Saúde');

  console.log('User:', user?.name);
  console.log('Pipelines:', pipelines.map(p => `${p.name} (${p.id})`));
  console.log('CLOSER pipeline ID:', closerPipeline?.id);

  // Create automations for the automation engine (general rules)
  const automations = [
    {
      tenantId: TENANT_ID,
      workspaceId: WORKSPACE_ID,
      name: '[Pipedrive] Troca de Funil - Cotação Enviada',
      description: 'Deal entrou em Cotação Enviada (stage 108) - fecha conversa',
      trigger: { type: 'pipedrive.deal_updated', conditions: [
        { field: 'stageId', operator: 'equals', value: 108 },
      ]},
      actions: [
        { type: 'close_conversation', config: {}, order: 1 },
      ],
      priority: 3, isActive: true,
    },
    {
      tenantId: TENANT_ID,
      workspaceId: WORKSPACE_ID,
      name: '[Pipedrive] Perdido - Interação Humana',
      description: 'Deal perdido no Pipedrive - fecha conversa',
      trigger: { type: 'pipedrive.deal_updated', conditions: [
        { field: 'status', operator: 'equals', value: 'lost' },
      ]},
      actions: [
        { type: 'close_conversation', config: {}, order: 1 },
      ],
      priority: 5, isActive: true,
    },
  ];

  for (const a of automations) {
    const existing = await prisma.automation.findFirst({
      where: { tenantId: TENANT_ID, name: a.name },
    });
    if (existing) {
      await prisma.automation.update({ where: { id: existing.id }, data: a as any });
      console.log(`Updated: ${a.name}`);
    } else {
      await prisma.automation.create({ data: a as any });
      console.log(`Created: ${a.name}`);
    }
  }

  console.log('\nSeed completed successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
