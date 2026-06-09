import { Automation } from '../automation';
import { TenantId } from '../../value-objects/tenant-id';

describe('Automation Entity', () => {
  const tenantId = new TenantId();

  const defaultProps = {
    tenantId,
    workspaceId: 'workspace-1',
    name: 'Welcome Message',
    trigger: {
      type: 'conversation_created' as const,
    },
    actions: [
      { type: 'send_message' as const, config: { message: 'Welcome!' }, order: 0 },
    ],
  };

  it('should create with defaults', () => {
    const auto = new Automation(defaultProps);
    expect(auto.getId()).toBeDefined();
    expect(auto.getProps().isActive).toBe(true);
    expect(auto.getProps().priority).toBe(0);
    expect(auto.getProps().executionCount).toBe(0);
  });

  it('should activate and deactivate', () => {
    const auto = new Automation(defaultProps);
    auto.deactivate();
    expect(auto.getProps().isActive).toBe(false);
    auto.activate();
    expect(auto.getProps().isActive).toBe(true);
  });

  it('should increment execution count', () => {
    const auto = new Automation(defaultProps);
    auto.incrementExecution();
    expect(auto.getProps().executionCount).toBe(1);
    expect(auto.getProps().lastExecutedAt).toBeDefined();
  });

  it('should increment error count', () => {
    const auto = new Automation(defaultProps);
    auto.incrementError();
    expect(auto.getProps().errorCount).toBe(1);
  });

  it('should update trigger partially', () => {
    const auto = new Automation(defaultProps);
    auto.updateTrigger({ conditions: [{ field: 'status', operator: 'equals', value: 'active' }] });
    expect(auto.getProps().trigger.conditions).toHaveLength(1);
    expect(auto.getProps().trigger.type).toBe('conversation_created');
  });

  it('should update actions', () => {
    const auto = new Automation(defaultProps);
    const newActions = [
      { type: 'send_message' as const, config: { message: 'Hi!' }, order: 0 },
      { type: 'add_tag' as const, config: { tag: 'new' }, order: 1 },
    ];
    auto.updateActions(newActions);
    expect(auto.getProps().actions).toHaveLength(2);
    expect(auto.getProps().actions[1].type).toBe('add_tag');
  });

  it('should handle empty actions', () => {
    const auto = new Automation({ ...defaultProps, actions: [] });
    expect(auto.getProps().actions).toEqual([]);
  });
});
