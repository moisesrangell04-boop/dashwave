import { Lead } from '../lead';
import { TenantId } from '../../value-objects/tenant-id';

describe('Lead Entity', () => {
  const tenantId = new TenantId();

  const defaultProps = {
    tenantId,
    workspaceId: 'workspace-1',
    pipelineId: 'pipeline-1',
    stageId: 'stage-1',
    contactId: 'contact-1',
    title: 'Test Lead',
    status: 'active' as const,
    source: 'manual' as const,
    priority: 'medium' as const,
  };

  it('should create with defaults', () => {
    const lead = new Lead(defaultProps);
    expect(lead.getId()).toBeDefined();
    expect(lead.getProps().tags).toEqual([]);
    expect(lead.getProps().score).toBe(0);
  });

  it('should move to stage', () => {
    const lead = new Lead(defaultProps);
    lead.moveToStage('stage-2');
    expect(lead.getProps().stageId).toBe('stage-2');
    expect(lead.getProps().lastActivityAt).toBeDefined();
  });

  it('should assign user', () => {
    const lead = new Lead(defaultProps);
    lead.assignUser('user-1');
    expect(lead.getProps().assignedUserId).toBe('user-1');
  });

  it('should convert', () => {
    const lead = new Lead(defaultProps);
    lead.convert();
    expect(lead.getProps().status).toBe('converted');
    expect(lead.getProps().convertedAt).toBeDefined();
  });

  it('should mark as lost', () => {
    const lead = new Lead(defaultProps);
    lead.markAsLost('Not interested');
    expect(lead.getProps().status).toBe('lost');
    expect(lead.getProps().lostReason).toBe('Not interested');
  });

  it('should update score', () => {
    const lead = new Lead(defaultProps);
    lead.updateScore(85);
    expect(lead.getProps().score).toBe(85);
  });

  it('should archive', () => {
    const lead = new Lead(defaultProps);
    lead.archive();
    expect(lead.getProps().status).toBe('archived');
  });
});
