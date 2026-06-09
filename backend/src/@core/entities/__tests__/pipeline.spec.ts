import { Pipeline, PipelineStage } from '../pipeline';
import { TenantId } from '../../value-objects/tenant-id';

describe('PipelineStage Entity', () => {
  it('should create with defaults', () => {
    const stage = new PipelineStage({ name: 'Lead', order: 0, color: '#6366f1' });
    expect(stage.getId()).toBeDefined();
    expect(stage.getProps().isDefault).toBe(false);
    expect(stage.getProps().isFinal).toBe(false);
    expect(stage.getProps().winProbability).toBe(0);
  });

  it('should accept custom id', () => {
    const stage = new PipelineStage({ id: 'custom-id', name: 'Won', order: 1, color: '#22c55e' });
    expect(stage.getId()).toBe('custom-id');
  });
});

describe('Pipeline Entity', () => {
  const tenantId = new TenantId();

  const defaultProps = {
    tenantId,
    workspaceId: 'workspace-1',
    name: 'Sales Pipeline',
    stages: [
      { name: 'Lead', order: 0, color: '#6366f1' },
      { name: 'Won', order: 1, color: '#22c55e', isFinal: true, winProbability: 100 },
    ],
  };

  it('should create with defaults', () => {
    const pipeline = new Pipeline(defaultProps);
    expect(pipeline.getId()).toBeDefined();
    expect(pipeline.getProps().isActive).toBe(true);
    expect(pipeline.getProps().isDefault).toBe(false);
  });

  it('should convert stages to PipelineStage objects', () => {
    const pipeline = new Pipeline(defaultProps);
    const stages = pipeline.getProps().stages;
    expect(stages).toHaveLength(2);
    expect(stages[0].name).toBe('Lead');
    expect(stages[1].isFinal).toBe(true);
  });

  it('should add stage', () => {
    const pipeline = new Pipeline(defaultProps);
    pipeline.addStage({ name: 'Proposal', color: '#f59e0b', order: 2, winProbability: 60 });
    expect(pipeline.getProps().stages).toHaveLength(3);
    expect(pipeline.getProps().stages[2].order).toBe(2);
  });

  it('should remove stage', () => {
    const pipeline = new Pipeline(defaultProps);
    const stageId = pipeline.getProps().stages[0].id!;
    pipeline.removeStage(stageId);
    expect(pipeline.getProps().stages).toHaveLength(1);
  });

  it('should reorder stages', () => {
    const pipeline = new Pipeline(defaultProps);
    const stages = pipeline.getProps().stages;
    const reordered = [stages[1].id!, stages[0].id!];
    pipeline.reorderStages(reordered);
    const updated = pipeline.getProps().stages;
    expect(updated[0].name).toBe('Won');
    expect(updated[0].order).toBe(0);
    expect(updated[1].name).toBe('Lead');
    expect(updated[1].order).toBe(1);
  });
});
