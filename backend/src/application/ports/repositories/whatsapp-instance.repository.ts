import { WhatsAppInstance, WhatsAppInstanceProps } from '../../../@core/entities/whatsapp-instance';

export interface WhatsAppInstanceRepository {
  create(instance: WhatsAppInstance): Promise<WhatsAppInstance>;
  update(id: string, data: Partial<WhatsAppInstanceProps>): Promise<WhatsAppInstance>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<WhatsAppInstance | null>;
  findByTenantId(tenantId: string, workspaceId: string): Promise<WhatsAppInstance[]>;
  findByName(tenantId: string, name: string): Promise<WhatsAppInstance | null>;
  findByPhoneNumber(phoneNumber: string): Promise<WhatsAppInstance | null>;
}
