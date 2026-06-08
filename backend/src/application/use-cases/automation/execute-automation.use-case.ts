import { AutomationRepository } from '../../ports/repositories/automation.repository';

export interface AutomationExecutionContext {
  triggerType: string;
  tenantId: string;
  workspaceId: string;
  data: Record<string, unknown>;
}

export class ExecuteAutomationUseCase {
  constructor(
    private readonly automationRepo: AutomationRepository,
  ) {}

  async execute(context: AutomationExecutionContext) {
    const automations = await this.automationRepo.findByTriggerType(
      context.tenantId,
      context.triggerType,
    );

    const results: Array<{ automationId: string; name: string; executed: boolean; error?: string }> = [];

    for (const automation of automations) {
      const props = automation.getProps();
      if (!props.isActive) continue;

      try {
        const conditionsMet = this.evaluateConditions(
          props.trigger.conditions ?? [],
          context.data,
        );

        if (!conditionsMet) {
          results.push({ automationId: automation.getId(), name: props.name, executed: false });
          continue;
        }

        automation.incrementExecution();
        await this.automationRepo.update(automation.getId(), {
          executionCount: props.executionCount + 1,
          lastExecutedAt: new Date(),
        });

        if (props.actions && props.actions.length > 0) {
          for (const action of props.actions.sort((a, b) => a.order - b.order)) {
            await this.executeAction(action, context);
          }
        }

        results.push({ automationId: automation.getId(), name: props.name, executed: true });
      } catch (error) {
        automation.incrementError();
        await this.automationRepo.update(automation.getId(), {
          errorCount: props.errorCount + 1,
        });

        results.push({
          automationId: automation.getId(),
          name: props.name,
          executed: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private evaluateConditions(
    conditions: Array<{ field: string; operator: string; value: any }>,
    data: Record<string, unknown>,
  ): boolean {
    if (conditions.length === 0) return true;

    return conditions.every((condition) => {
      const actualValue = data[condition.field];
      switch (condition.operator) {
        case 'equals': return actualValue === condition.value;
        case 'not_equals': return actualValue !== condition.value;
        case 'contains': return String(actualValue).includes(String(condition.value));
        case 'greater_than': return Number(actualValue) > Number(condition.value);
        case 'less_than': return Number(actualValue) < Number(condition.value);
        case 'is_empty': return !actualValue;
        case 'is_not_empty': return !!actualValue;
        default: return true;
      }
    });
  }

  private async executeAction(
    action: { type: string; config: Record<string, unknown> },
    context: AutomationExecutionContext,
  ): Promise<void> {
    switch (action.type) {
      case 'send_message':
      case 'change_stage':
      case 'assign_user':
      case 'add_tag':
      case 'notify_user':
      case 'webhook':
      case 'close_conversation':
      case 'ai_agent':
      case 'create_lead':
        break;
      default:
        break;
    }
  }
}
