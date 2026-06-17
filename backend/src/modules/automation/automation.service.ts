import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { WhatsAppService } from '@modules/whatsapp/whatsapp.service';
import { PipedriveService } from '@modules/pipedrive/pipedrive.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { TestAutomationDto } from './dto/test-automation.dto';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly whatsappService: WhatsAppService,
    @Optional() private readonly pipedriveService: PipedriveService,
  ) {}

  private readonly operators: Record<string, (a: any, b: any) => boolean> = {
    equals: (a, b) => a === b,
    not_equals: (a, b) => a !== b,
    contains: (a, b) => String(a ?? '').includes(String(b)),
    greater_than: (a, b) => Number(a) > Number(b),
    less_than: (a, b) => Number(a) < Number(b),
    is_empty: (a) => a === null || a === undefined || a === '',
    is_not_empty: (a) => a !== null && a !== undefined && a !== '',
  };

  async create(tenantId: string, workspaceId: string, dto: CreateAutomationDto) {
    const automation = await this.prisma.automation.create({
      data: {
        tenantId,
        workspaceId,
        name: dto.name,
        description: dto.description,
        trigger: dto.trigger as any,
        actions: dto.actions as any,
        priority: dto.priority ?? 0,
        tags: [],
      },
    });

    this.logger.log(`Automation "${automation.name}" created in tenant ${tenantId}`);
    return automation;
  }

  async findAll(tenantId: string, workspaceId: string) {
    return this.prisma.automation.findMany({
      where: { tenantId, workspaceId },
      orderBy: { priority: 'asc' },
    });
  }

  async findById(id: string, tenantId: string) {
    const automation = await this.prisma.automation.findFirst({
      where: { id, tenantId },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    return automation;
  }

  async update(id: string, tenantId: string, dto: UpdateAutomationDto) {
    const existing = await this.prisma.automation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Automation not found');
    }

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.trigger !== undefined) updateData.trigger = dto.trigger as any;
    if (dto.actions !== undefined) updateData.actions = dto.actions as any;
    if (dto.priority !== undefined) updateData.priority = dto.priority;

    const updated = await this.prisma.automation.update({
      where: { id },
      data: updateData,
    });

    this.logger.log(`Automation "${updated.name}" updated in tenant ${tenantId}`);
    return updated;
  }

  async delete(id: string, tenantId: string) {
    const existing = await this.prisma.automation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Automation not found');
    }

    await this.prisma.automation.delete({ where: { id } });

    this.logger.log(`Automation "${existing.name}" deleted from tenant ${tenantId}`);

    return { message: 'Automation deleted successfully' };
  }

  async activate(id: string, tenantId: string) {
    const existing = await this.prisma.automation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Automation not found');
    }

    if (existing.isActive) {
      return existing;
    }

    const updated = await this.prisma.automation.update({
      where: { id },
      data: { isActive: true },
    });

    this.logger.log(`Automation "${updated.name}" activated`);

    return updated;
  }

  async deactivate(id: string, tenantId: string) {
    const existing = await this.prisma.automation.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Automation not found');
    }

    if (!existing.isActive) {
      return existing;
    }

    const updated = await this.prisma.automation.update({
      where: { id },
      data: { isActive: false },
    });

    this.logger.log(`Automation "${updated.name}" deactivated`);

    return updated;
  }

  async test(id: string, tenantId: string, dto: TestAutomationDto) {
    const automation = await this.prisma.automation.findFirst({
      where: { id, tenantId },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    const trigger = automation.trigger as any;

    if (dto.mockEvent.type !== trigger.type) {
      throw new BadRequestException(
        `Mock event type "${dto.mockEvent.type}" does not match automation trigger type "${trigger.type}"`,
      );
    }

    return this.executeAutomation(automation, dto.mockEvent.payload);
  }

  async toggleAll(tenantId: string, workspaceId: string, active: boolean) {
    const result = await this.prisma.automation.updateMany({
      where: { tenantId, workspaceId },
      data: { isActive: active },
    });
    this.logger.log(`All automations ${active ? 'activated' : 'deactivated'} in tenant ${tenantId}`);
    return { count: result.count, active };
  }

  async getLogs(id: string, tenantId: string, page: number, limit: number) {
    const automation = await this.prisma.automation.findFirst({
      where: { id, tenantId },
    });

    if (!automation) {
      throw new NotFoundException('Automation not found');
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.automationLog.findMany({
        where: { automationId: id, tenantId },
        skip,
        take: limit,
        orderBy: { executedAt: 'desc' },
      }),
      this.prisma.automationLog.count({
        where: { automationId: id, tenantId },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async execute(
    tenantId: string,
    workspaceId: string,
    eventType: string,
    payload: Record<string, any>,
  ): Promise<ExecutionResult[]> {
    const automations = await this.prisma.automation.findMany({
      where: {
        tenantId,
        workspaceId,
        isActive: true,
      },
      orderBy: { priority: 'asc' },
    });

    const matching = automations.filter((a) => {
      const trigger = a.trigger as any;
      return trigger.type === eventType;
    });

    if (matching.length === 0) {
      return [];
    }

    const enrichedPayload = { ...payload, workspaceId };
    const results: ExecutionResult[] = [];

    for (const automation of matching) {
      const trigger = automation.trigger as any;
      let shouldExecute = true;

      if (trigger.conditions && trigger.conditions.length > 0) {
        shouldExecute = this.evaluateConditions(trigger.conditions, enrichedPayload);
      }

      if (shouldExecute) {
        const result = await this.executeAutomation(automation, enrichedPayload);
        results.push(result);
      }
    }

    return results;
  }

  private async executeAutomation(
    automation: any,
    payload: Record<string, any>,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const actions = (automation.actions as any[]) ?? [];
    const actionResults: ActionResult[] = [];
    let hasError = false;

    for (const action of actions.sort((a, b) => a.order - b.order)) {
      try {
        const result = await this.executeAction(action, payload, automation.tenantId);
        actionResults.push({ action: action.type, success: true, result });
      } catch (error: any) {
        hasError = true;
        actionResults.push({
          action: action.type,
          success: false,
          error: error.message ?? 'Unknown error',
        });
        this.logger.error(
          `Automation "${automation.name}" action "${action.type}" failed: ${error.message}`,
          error.stack,
        );
      }
    }

    const durationMs = Date.now() - startTime;

    await this.prisma.automation.update({
      where: { id: automation.id },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
        ...(hasError ? { errorCount: { increment: 1 } } : {}),
      },
    });

    await this.prisma.automationLog.create({
      data: {
        tenantId: automation.tenantId,
        workspaceId: automation.workspaceId,
        automationId: automation.id,
        source: 'engine',
        eventType: (automation.trigger as any)?.type || 'unknown',
        payload: payload as any,
        actions: actionResults as any,
        success: !hasError,
        errorMessage: hasError
          ? actionResults.find((r) => !r.success)?.error || 'Unknown error'
          : null,
        durationMs,
        executedAt: new Date(),
      },
    });

    return {
      automationId: automation.id,
      automationName: automation.name,
      matched: true,
      success: !hasError,
      actions: actionResults,
    };
  }

  evaluateConditions(
    conditions: Condition[],
    payload: Record<string, any>,
  ): boolean {
    return conditions.every((condition) => {
      const value = this.resolveField(condition.field, payload);
      const operatorFn = this.operators[condition.operator];

      if (!operatorFn) {
        this.logger.warn(`Unknown operator: ${condition.operator}`);
        return false;
      }

      return operatorFn(value, condition.value);
    });
  }

  private resolveField(field: string, payload: Record<string, any>): any {
    const parts = field.split('.');
    let current: any = payload;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  private async executeAction(
    action: Action,
    payload: Record<string, any>,
    tenantId: string,
  ): Promise<any> {
    const { type, config } = action;

    switch (type) {
      case 'send_message': {
        const conversationId = payload.conversationId || config.conversationId;
        if (!conversationId) {
          throw new Error('conversationId is required for send_message action');
        }

        const conversation = await this.prisma.conversation.findUnique({
          where: { id: conversationId },
          include: {
            contact: { select: { phone: true } },
          },
        });

        if (!conversation) {
          throw new Error(`Conversation ${conversationId} not found`);
        }

        const messageContent = this.interpolate(config.message, payload);

        const dbMessage = await this.prisma.message.create({
          data: {
            tenantId,
            workspaceId: conversation.workspaceId,
            conversationId,
            contactId: conversation.contactId,
            whatsappInstanceId: conversation.whatsappInstanceId,
            direction: 'outbound',
            type: config.templateId ? 'template' : 'text',
            status: 'pending',
            origin: 'automation',
            content: messageContent,
            automationRuleId: payload._automationId,
            metadata: { automationConfig: config },
          },
        });

        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessage: messageContent, lastMessageAt: new Date(), lastActivityAt: new Date() },
        });

        if (this.whatsappService && (conversation as any).contact?.phone) {
          try {
            await this.whatsappService.sendMessage(tenantId, conversation.workspaceId, conversation.whatsappInstanceId, {
              to: (conversation as any).contact.phone,
              message: messageContent,
              type: 'text',
            });
            await this.prisma.message.update({
              where: { id: dbMessage.id },
              data: { status: 'sent', sentAt: new Date() },
            });
          } catch (err) {
            this.logger.error(`Automation send_message WhatsApp delivery failed: ${err.message}`);
            await this.prisma.message.update({
              where: { id: dbMessage.id },
              data: { status: 'failed' },
            });
          }
        }

        return dbMessage;
      }

      case 'change_stage': {
        const leadId = payload.leadId || config.leadId;
        if (!leadId) {
          throw new Error('leadId is required for change_stage action');
        }

        const lead = await this.prisma.lead.findFirst({
          where: { id: leadId, tenantId },
        });

        if (!lead) {
          throw new Error(`Lead ${leadId} not found`);
        }

        const pipeline = await this.prisma.pipeline.findUnique({
          where: { id: lead.pipelineId },
        });

        if (!pipeline) {
          throw new Error(`Pipeline ${lead.pipelineId} not found`);
        }

        const stages = pipeline.stages as any[];
        const targetStage = stages.find((s: any) => s.id === config.stageId);

        if (!targetStage) {
          throw new Error(`Stage ${config.stageId} not found in pipeline`);
        }

        return this.prisma.lead.update({
          where: { id: leadId },
          data: {
            stageId: config.stageId,
            lastActivityAt: new Date(),
          },
        });
      }

      case 'pipedrive_update_stage': {
        if (!this.pipedriveService) {
          throw new Error('Pipedrive integration is not available');
        }

        const leadId = payload.leadId || config.leadId;
        const dealId = payload.pipedriveDealId || config.pipedriveDealId;
        const stageId = config.stageId;

        if (!stageId) {
          throw new Error('stageId is required for pipedrive_update_stage action');
        }

        let pipedriveDealId = dealId;

        if (!pipedriveDealId && leadId) {
          const lead = await this.prisma.lead.findFirst({
            where: { id: leadId, tenantId },
          });

          pipedriveDealId = (lead?.metadata as any)?.pipedriveDealId;
        }

        if (!pipedriveDealId) {
          throw new Error('pipedriveDealId is required for pipedrive_update_stage action');
        }

        const workspaceId = payload.workspaceId || config.workspaceId;

        return this.pipedriveService.updateDealStage(tenantId, workspaceId, pipedriveDealId, stageId);
      }

      case 'assign_user': {
        const leadId = payload.leadId || config.leadId;
        if (!leadId) {
          throw new Error('leadId is required for assign_user action');
        }

        const user = await this.prisma.user.findFirst({
          where: { id: config.userId, tenantId },
        });

        if (!user) {
          throw new Error(`User ${config.userId} not found`);
        }

        return this.prisma.lead.update({
          where: { id: leadId },
          data: {
            assignedUserId: config.userId,
            lastActivityAt: new Date(),
          },
        });
      }

      case 'assign_agent': {
        const conversationId = payload.conversationId || config.conversationId;
        if (!conversationId) {
          throw new Error('conversationId is required for assign_agent action');
        }

        return this.prisma.conversation.update({
          where: { id: conversationId },
          data: { assignedAgentId: config.agentId },
        });
      }

      case 'add_tag': {
        const entityId = payload.leadId || payload.contactId || config.entityId;
        const entity = config.entity || (payload.leadId ? 'lead' : 'contact');

        if (!entityId) {
          throw new Error('entityId is required for add_tag action');
        }

        if (entity === 'lead') {
          const lead = await this.prisma.lead.findFirst({
            where: { id: entityId, tenantId },
          });

          if (!lead) {
            throw new Error(`Lead ${entityId} not found`);
          }

          const newTags = [...new Set([...lead.tags, ...(config.tags ?? [])])];

          return this.prisma.lead.update({
            where: { id: entityId },
            data: {
              tags: newTags,
              lastActivityAt: new Date(),
            },
          });
        }

        if (entity === 'contact') {
          const contact = await this.prisma.contact.findFirst({
            where: { id: entityId, tenantId },
          });

          if (!contact) {
            throw new Error(`Contact ${entityId} not found`);
          }

          const newTags = [...new Set([...contact.tags, ...(config.tags ?? [])])];

          return this.prisma.contact.update({
            where: { id: entityId },
            data: { tags: newTags },
          });
        }

        throw new Error(`Unknown entity type: ${entity}`);
      }

      case 'remove_tag': {
        const entityId = payload.leadId || payload.contactId || config.entityId;
        const entity = config.entity || (payload.leadId ? 'lead' : 'contact');

        if (!entityId) {
          throw new Error('entityId is required for remove_tag action');
        }

        const tagsToRemove = new Set(config.tags ?? []);

        if (entity === 'lead') {
          const lead = await this.prisma.lead.findFirst({
            where: { id: entityId, tenantId },
          });

          if (!lead) {
            throw new Error(`Lead ${entityId} not found`);
          }

          const newTags = lead.tags.filter((t: string) => !tagsToRemove.has(t));

          return this.prisma.lead.update({
            where: { id: entityId },
            data: {
              tags: newTags,
              lastActivityAt: new Date(),
            },
          });
        }

        if (entity === 'contact') {
          const contact = await this.prisma.contact.findFirst({
            where: { id: entityId, tenantId },
          });

          if (!contact) {
            throw new Error(`Contact ${entityId} not found`);
          }

          const newTags = contact.tags.filter((t: string) => !tagsToRemove.has(t));

          return this.prisma.contact.update({
            where: { id: entityId },
            data: { tags: newTags },
          });
        }

        throw new Error(`Unknown entity type: ${entity}`);
      }

      case 'update_field': {
        const leadId = payload.leadId || config.leadId;
        if (!leadId) {
          throw new Error('leadId is required for update_field action');
        }

        const updateData: any = {};
        if (config.field && config.value !== undefined) {
          updateData[config.field] = config.value;
          updateData.lastActivityAt = new Date();
        }
        if (config.fields && typeof config.fields === 'object') {
          Object.assign(updateData, config.fields);
          updateData.lastActivityAt = new Date();
        }

        return this.prisma.lead.update({
          where: { id: leadId },
          data: updateData,
        });
      }

      case 'send_email': {
        this.logger.log(`send_email action triggered: ${JSON.stringify(config)}`);
        return { scheduled: true, config };
      }

      case 'notify_user': {
        this.logger.log(`notify_user action triggered for user ${config.userId}: ${config.message}`);
        return { notified: true, userId: config.userId, message: config.message };
      }

      case 'webhook': {
        const url = config.url;
        if (!url) {
          throw new Error('url is required for webhook action');
        }

        const body = {
          event: payload,
          config: config.body ?? {},
          timestamp: new Date().toISOString(),
        };

        const response = await fetch(url, {
          method: config.method ?? 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.headers ?? {}),
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(config.timeout ?? 15000),
        });

        if (!response.ok) {
          throw new Error(`Webhook returned status ${response.status}`);
        }

        const responseBody = await response.text();
        return { status: response.status, body: responseBody };
      }

      case 'ai_agent': {
        const conversationId = payload.conversationId || config.conversationId;
        if (!conversationId) {
          throw new Error('conversationId is required for ai_agent action');
        }

        return this.prisma.conversation.update({
          where: { id: conversationId },
          data: { aiActive: true },
        });
      }

      case 'create_lead': {
        const contactId = payload.contactId || config.contactId;
        if (!contactId) {
          throw new Error('contactId is required for create_lead action');
        }

        const pipeline = await this.prisma.pipeline.findFirst({
          where: { tenantId, isDefault: true },
        });

        if (!pipeline) {
          throw new Error('No default pipeline found');
        }

        const stages = pipeline.stages as any[];
        const firstStage = stages[0];

        if (!firstStage) {
          throw new Error('Default pipeline has no stages');
        }

        return this.prisma.lead.create({
          data: {
            tenantId,
            workspaceId: pipeline.workspaceId,
            pipelineId: pipeline.id,
            stageId: config.stageId ?? firstStage.id,
            contactId,
            title: config.title ?? 'New Lead',
            value: config.value,
            source: 'api',
            tags: config.tags ?? [],
            lastActivityAt: new Date(),
          },
        });
      }

      case 'create_conversation': {
        const contactId = payload.contactId || config.contactId;
        if (!contactId) {
          throw new Error('contactId is required for create_conversation action');
        }

        const contact = await this.prisma.contact.findFirst({
          where: { id: contactId, tenantId },
        });

        if (!contact) {
          throw new Error(`Contact ${contactId} not found`);
        }

        const whatsappInstance = await this.prisma.whatsAppInstance.findFirst({
          where: { tenantId, workspaceId: payload.workspaceId, isActive: true },
        });

        if (!whatsappInstance) {
          throw new Error('No active WhatsApp instance found');
        }

        const existingConversation = await this.prisma.conversation.findFirst({
          where: {
            tenantId,
            contactId,
            status: { in: ['active', 'pending', 'waiting'] },
          },
        });

        if (existingConversation) {
          return existingConversation;
        }

        const conversation = await this.prisma.conversation.create({
          data: {
            tenantId,
            workspaceId: contact.workspaceId,
            contactId: contact.id,
            whatsappInstanceId: whatsappInstance.id,
            status: 'pending',
            channel: 'whatsapp',
            priority: 'medium',
            assignedUserId: config.userId || null,
            assignedAgentId: config.agentId || null,
          },
        });

        if (config.agentId) {
          await this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { aiActive: true },
          });
        }

        return conversation;
      }

      case 'close_conversation': {
        let conversationId = payload.conversationId || config.conversationId;

        if (!conversationId && payload.contactId) {
          const conv = await this.prisma.conversation.findFirst({
            where: {
              tenantId,
              contactId: payload.contactId,
              status: { in: ['active', 'pending', 'waiting'] },
            },
            orderBy: { createdAt: 'desc' },
          });
          if (conv) conversationId = conv.id;
        }

        if (!conversationId) {
          return { skipped: true, reason: 'No active conversation found' };
        }

        return this.prisma.conversation.update({
          where: { id: conversationId },
          data: {
            status: 'resolved',
            resolvedAt: new Date(),
          },
        });
      }

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  private interpolate(template: string, payload: Record<string, any>): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.resolveField(path, payload);
      return value !== undefined && value !== null ? String(value) : match;
    });
  }
}

interface Condition {
  field: string;
  operator: string;
  value: any;
}

interface Action {
  type: string;
  config: Record<string, any>;
  order: number;
}

interface ActionResult {
  action: string;
  success: boolean;
  result?: any;
  error?: string;
}

export interface ExecutionResult {
  automationId: string;
  automationName: string;
  matched: boolean;
  success: boolean;
  actions: ActionResult[];
}
