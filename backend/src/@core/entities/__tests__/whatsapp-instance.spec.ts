import { WhatsAppInstance } from '../whatsapp-instance';
import { TenantId } from '../../value-objects/tenant-id';

describe('WhatsAppInstance Entity', () => {
  const tenantId = new TenantId();

  const defaultProps = {
    tenantId,
    workspaceId: 'workspace-1',
    name: 'Main Instance',
    phoneNumber: '5511999999999',
    provider: 'evolution' as const,
    status: 'disconnected' as const,
  };

  it('should create with defaults', () => {
    const instance = new WhatsAppInstance(defaultProps);
    expect(instance.getId()).toBeDefined();
    expect(instance.getProps().isActive).toBe(true);
    expect(instance.getProps().maxConcurrentChats).toBe(50);
  });

  it('should connect', () => {
    const instance = new WhatsAppInstance(defaultProps);
    instance.connect();
    expect(instance.getProps().status).toBe('connecting');
  });

  it('should disconnect', () => {
    const instance = new WhatsAppInstance(defaultProps);
    instance.setConnected();
    instance.disconnect();
    expect(instance.getProps().status).toBe('disconnected');
  });

  it('should set connected', () => {
    const instance = new WhatsAppInstance(defaultProps);
    instance.setConnected();
    expect(instance.getProps().status).toBe('connected');
  });

  it('should set error', () => {
    const instance = new WhatsAppInstance(defaultProps);
    instance.setError();
    expect(instance.getProps().status).toBe('error');
  });

  it('should update QR code and set status to connecting', () => {
    const instance = new WhatsAppInstance(defaultProps);
    instance.updateQRCode('qr-code-data');
    expect(instance.getProps().qrCode).toBe('qr-code-data');
    expect(instance.getProps().status).toBe('connecting');
  });
});
