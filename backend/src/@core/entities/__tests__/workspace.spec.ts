import { Workspace } from '../workspace';
import { TenantId } from '../../value-objects/tenant-id';

describe('Workspace Entity', () => {
  const tenantId = new TenantId();

  const defaultProps = {
    tenantId,
    name: 'Main Workspace',
  };

  it('should create with defaults', () => {
    const workspace = new Workspace(defaultProps);
    expect(workspace.getId()).toBeDefined();
    expect(workspace.getProps().isActive).toBe(true);
    expect(workspace.getProps().createdAt).toBeDefined();
    expect(workspace.getProps().updatedAt).toBeDefined();
  });

  it('should accept custom id', () => {
    const workspace = new Workspace({ ...defaultProps, id: 'custom-id' });
    expect(workspace.getId()).toBe('custom-id');
  });

  it('should store optional fields', () => {
    const workspace = new Workspace({
      ...defaultProps,
      description: 'Main workspace for team',
      settings: { timezone: 'America/Sao_Paulo' },
    });
    const props = workspace.getProps();
    expect(props.description).toBe('Main workspace for team');
    expect(props.settings).toEqual({ timezone: 'America/Sao_Paulo' });
  });

  it('should accept custom id via constructor', () => {
    const customId = 'workspace-custom-123';
    const workspace = new Workspace({ ...defaultProps, id: customId });
    expect(workspace.getId()).toBe(customId);
  });
});
