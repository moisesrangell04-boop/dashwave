import { TenantId } from '../value-objects/tenant-id';
import { v4 as uuid } from 'uuid';

export interface WorkspaceProps {
  id?: string;
  tenantId: TenantId;
  name: string;
  description?: string;
  isActive?: boolean;
  settings?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Workspace {
  private readonly id: string;
  private props: WorkspaceProps;

  constructor(props: WorkspaceProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): Readonly<WorkspaceProps> {
    return { ...this.props, id: this.id };
  }
}
