import { TenantId } from '../value-objects/tenant-id';
import { v4 as uuid } from 'uuid';

export interface PipelineStageProps {
  id?: string;
  name: string;
  description?: string;
  order: number;
  color: string;
  isDefault?: boolean;
  isFinal?: boolean;
 winProbability?: number;
  rules?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PipelineProps {
  id?: string;
  tenantId: TenantId;
  workspaceId: string;
  name: string;
  description?: string;
  stages: PipelineStageProps[];
  isActive?: boolean;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PipelineStage {
  private readonly id: string;
  private props: PipelineStageProps;

  constructor(props: PipelineStageProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      color: props.color ?? '#6366f1',
      isDefault: props.isDefault ?? false,
      isFinal: props.isFinal ?? false,
      winProbability: props.winProbability ?? 0,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): PipelineStageProps {
    return { ...this.props, id: this.id };
  }
}

export class Pipeline {
  private readonly id: string;
  private stages: PipelineStage[];
  private props: Omit<PipelineProps, 'stages'>;

  constructor(props: PipelineProps) {
    this.id = props.id ?? uuid();
    this.stages = (props.stages || []).map((s) => new PipelineStage(s));
    this.props = {
      ...props,
      id: this.id,
      isActive: props.isActive ?? true,
      isDefault: props.isDefault ?? false,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): PipelineProps {
    return {
      ...this.props,
      stages: this.stages.map((s) => s.getProps()),
    };
  }

  addStage(stage: PipelineStageProps): void {
    const newStage = new PipelineStage({
      ...stage,
      order: this.stages.length,
    });
    this.stages.push(newStage);
    this.props.updatedAt = new Date();
  }

  removeStage(stageId: string): void {
    this.stages = this.stages.filter((s) => s.getId() !== stageId);
    this.props.updatedAt = new Date();
  }

  reorderStages(stageIds: string[]): void {
    this.stages.sort(
      (a, b) => stageIds.indexOf(a.getId()) - stageIds.indexOf(b.getId()),
    );
    this.stages.forEach((stage, index) => {
      const props = stage.getProps();
      this.stages[index] = new PipelineStage({ ...props, order: index });
    });
    this.props.updatedAt = new Date();
  }
}
