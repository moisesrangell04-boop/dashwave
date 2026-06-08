import { TenantId } from '../value-objects/tenant-id';
import { Email } from '../value-objects/email';
import { v4 as uuid } from 'uuid';

export type UserRole = 'owner' | 'admin' | 'supervisor' | 'agent' | 'viewer';

export interface UserProps {
  id?: string;
  tenantId: TenantId;
  workspaceId: string;
  name: string;
  email: Email;
  password: string;
  role: UserRole;
  isActive?: boolean;
  avatar?: string;
  twoFactorSecret?: string;
  twoFactorEnabled?: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private readonly id: string;
  private props: UserProps;

  constructor(props: UserProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      isActive: props.isActive ?? true,
      twoFactorEnabled: props.twoFactorEnabled ?? false,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): Readonly<UserProps> {
    return { ...this.props, id: this.id };
  }

  isOwner(): boolean {
    return this.props.role === 'owner';
  }

  isAdmin(): boolean {
    return this.props.role === 'admin' || this.isOwner();
  }

  canManageUsers(): boolean {
    return ['owner', 'admin'].includes(this.props.role);
  }

  canManagePipelines(): boolean {
    return ['owner', 'admin', 'supervisor'].includes(this.props.role);
  }

  updatePassword(password: string): void {
    this.props.password = password;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  enable2FA(secret: string): void {
    this.props.twoFactorSecret = secret;
    this.props.twoFactorEnabled = true;
    this.props.updatedAt = new Date();
  }

  disable2FA(): void {
    this.props.twoFactorSecret = undefined;
    this.props.twoFactorEnabled = false;
    this.props.updatedAt = new Date();
  }

  updateLastLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }
}
