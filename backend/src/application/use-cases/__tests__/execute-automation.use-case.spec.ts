import { ExecuteAutomationUseCase } from '../automation/execute-automation.use-case';
import { AutomationRepository } from '../../ports/repositories/automation.repository';
import { Automation } from '../../../@core/entities/automation';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('ExecuteAutomationUseCase', () => {
  let useCase: ExecuteAutomationUseCase;
  let automationRepo: jest.Mocked<AutomationRepository>;
  const tenantId = new TenantId();

  beforeEach(() => {
    automationRepo = { findByTriggerType: jest.fn(), update: jest.fn(), create: jest.fn() } as any;
    useCase = new ExecuteAutomationUseCase(automationRepo);
  });

  it('should execute matching automations', async () => {
    const auto = new Automation({
      tenantId,
      workspaceId: 'w1',
      name: 'Welcome',
      trigger: { type: 'conversation_created' },
      actions: [{ type: 'send_message', config: { message: 'Welcome!' }, order: 0 }],
    });

    automationRepo.findByTriggerType.mockResolvedValue([auto]);

    const results = await useCase.execute({
      triggerType: 'conversation_created',
      tenantId: 't1',
      workspaceId: 'w1',
      data: {},
    });

    expect(results).toHaveLength(1);
    expect(results[0].executed).toBe(true);
    expect(auto.getProps().executionCount).toBe(1);
  });

  it('should skip inactive automations', async () => {
    const auto = new Automation({
      tenantId,
      workspaceId: 'w1',
      name: 'Inactive',
      isActive: false,
      trigger: { type: 'conversation_created' },
      actions: [],
    });

    automationRepo.findByTriggerType.mockResolvedValue([auto]);

    const results = await useCase.execute({
      triggerType: 'conversation_created',
      tenantId: 't1',
      workspaceId: 'w1',
      data: {},
    });

    expect(results).toHaveLength(0);
  });

  it('should evaluate conditions', async () => {
    const auto = new Automation({
      tenantId,
      workspaceId: 'w1',
      name: 'Conditional',
      trigger: {
        type: 'conversation_created',
        conditions: [{ field: 'status', operator: 'equals', value: 'active' }],
      },
      actions: [],
    });

    automationRepo.findByTriggerType.mockResolvedValue([auto]);

    const results = await useCase.execute({
      triggerType: 'conversation_created',
      tenantId: 't1',
      workspaceId: 'w1',
      data: { status: 'inactive' },
    });

    expect(results[0].executed).toBe(false);
  });

  it('should handle execution errors', async () => {
    const auto = new Automation({
      tenantId,
      workspaceId: 'w1',
      name: 'Broken',
      trigger: { type: 'message_received' },
      actions: [{ type: 'send_message', config: {}, order: 0 }],
    });

    automationRepo.findByTriggerType.mockResolvedValue([auto]);
    automationRepo.update
      .mockRejectedValueOnce(new Error('DB error'))
      .mockResolvedValueOnce(undefined);

    const results = await useCase.execute({
      triggerType: 'message_received',
      tenantId: 't1',
      workspaceId: 'w1',
      data: {},
    });

    expect(results[0].executed).toBe(false);
    expect(results[0].error).toBeDefined();
    expect(auto.getProps().errorCount).toBe(1);
  });

  it('should return empty array when no automations match', async () => {
    automationRepo.findByTriggerType.mockResolvedValue([]);
    const results = await useCase.execute({
      triggerType: 'nonexistent',
      tenantId: 't1',
      workspaceId: 'w1',
      data: {},
    });
    expect(results).toEqual([]);
  });
});
