import { TenantId } from '../value-objects/tenant-id';
import { v4 as uuid } from 'uuid';

export type WhatsAppProvider = 'evolution' | 'meta_cloud';
export type InstanceStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'expired';

export interface WhatsAppInstanceProps {
  id?: string;
  tenantId: TenantId;
  workspaceId: string;
  name: string;
  phoneNumber: string;
  provider: WhatsAppProvider;
  status: InstanceStatus;
  qrCode?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  serverUrl?: string;
  apikey?: string;
  metaPhoneId?: string;
  metaBusinessId?: string;
  isActive?: boolean;
  maxConcurrentChats?: number;
  settings?: Record<string, unknown>;
  lastSyncAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WhatsAppInstance {
  private readonly id: string;
  private props: WhatsAppInstanceProps;

  constructor(props: WhatsAppInstanceProps) {
    this.id = props.id ?? uuid();
    this.props = {
      ...props,
      id: this.id,
      isActive: props.isActive ?? true,
      maxConcurrentChats: props.maxConcurrentChats ?? 50,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  getId(): string {
    return this.id;
  }

  getProps(): Readonly<WhatsAppInstanceProps> {
    return { ...this.props, id: this.id };
  }

  connect(): void {
    this.props.status = 'connecting';
    this.props.updatedAt = new Date();
  }

  disconnect(): void {
    this.props.status = 'disconnected';
    this.props.updatedAt = new Date();
  }

  setConnected(): void {
    this.props.status = 'connected';
    this.props.updatedAt = new Date();
  }

  setError(): void {
    this.props.status = 'error';
    this.props.updatedAt = new Date();
  }

  updateQRCode(qrCode: string): void {
    this.props.qrCode = qrCode;
    this.props.status = 'connecting';
    this.props.updatedAt = new Date();
  }
}
