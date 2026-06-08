import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { CreateAutomationDto } from './dto/create-automation.dto';
import { UpdateAutomationDto } from './dto/update-automation.dto';
import { TestAutomationDto } from './dto/test-automation.dto';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private readonly prisma: PrismaService) {}

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

    const results: ExecutionResult[] = [];

    for (const automation of matching) {
      const trigger = automation.trigger as any;
      let shouldExecute = true;

      if (trigger.conditions && trigger.conditions.length > 0) {
        shouldExecute = this.evaluateConditions(trigger.conditions, payload);
      }

      if (shouldExecute) {
        const result = await this.executeAutomation(automation, payload);
        results.push(result);
      }
    }

    return results;
  }

  private async executeAutomation(
    automation: any,
    payload: Record<string, any>,
  ): Promise<ExecutionResult> {
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

    await this.prisma.automation.update({
      where: { id: automation.id },
      data: {
        executionCount: { increment: 1 },
        lastExecutedAt: new Date(),
        ...(hasError ? { errorCount: { increment: 1 } } : {}),
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
        });

        if (!conversation) {
          throw new Error(`Conversation ${conversationId} not found`);
        }

        const message = this.interpolate(config.message, payload);

        const contact = await this.prisma.contact.findUnique({
          where: { id: conversation.contactId },
        });

        return this.prisma.message.create({
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
            content: message,
            automationRuleId: payload._automationId,
            metadata: { automationConfig: config },
          },
        });
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

      case 'close_conversation': {
        const conversationId = payload.conversationId || config.conversationId;
        if (!conversationId) {
          throw new Error('conversationId is required for close_conversation action');
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
