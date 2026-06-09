import { ConnectInstanceUseCase } from '../whatsapp/connect-instance.use-case';
import { WhatsAppInstanceRepository } from '../../ports/repositories/whatsapp-instance.repository';
import { WhatsAppProviderPort } from '../../ports/infrastructure/whatsapp-provider.port';
import { WhatsAppInstance } from '../../../@core/entities/whatsapp-instance';
import { TenantId } from '../../../@core/value-objects/tenant-id';

describe('ConnectInstanceUseCase', () => {
  let useCase: ConnectInstanceUseCase;
  let instanceRepo: jest.Mocked<WhatsAppInstanceRepository>;
  let whatsappProvider: jest.Mocked<WhatsAppProviderPort>;

  beforeEach(() => {
    instanceRepo = { findById: jest.fn(), update: jest.fn(), create: jest.fn() } as any;
    whatsappProvider = { connect: jest.fn(), disconnect: jest.fn(), sendText: jest.fn() } as any;

    useCase = new ConnectInstanceUseCase(instanceRepo, whatsappProvider);
  });

  const createInstance = () => {
    return new WhatsAppInstance({
      tenantId: new TenantId(),
      workspaceId: 'w1',
      name: 'Main',
      phoneNumber: '5511999999999',
      provider: 'evolution' as const,
      status: 'disconnected' as const,
    });
  };

  describe('connect', () => {
    it('should throw if instance not found', async () => {
      instanceRepo.findById.mockResolvedValue(null);
      await expect(useCase.execute('i1')).rejects.toThrow('Instância não encontrada');
    });

    it('should connect and return QR code', async () => {
      const instance = createInstance();
      instanceRepo.findById.mockResolvedValue(instance);
      instanceRepo.update.mockResolvedValue(instance);
      whatsappProvider.connect.mockResolvedValue({ qrCode: 'qrcode-data' });

      const result = await useCase.execute('i1');
      expect(result.qrCode).toBe('qrcode-data');
      expect(instance.getProps().status).toBe('connecting');
      expect(instance.getProps().qrCode).toBe('qrcode-data');
    });

    it('should handle connection error', async () => {
      const instance = createInstance();
      instanceRepo.findById.mockResolvedValue(instance);
      whatsappProvider.connect.mockRejectedValue(new Error('Connection failed'));

      await expect(useCase.execute('i1')).rejects.toThrow('Falha ao conectar instância');
      expect(instance.getProps().status).toBe('error');
    });
  });

  describe('disconnect', () => {
    it('should throw if instance not found', async () => {
      instanceRepo.findById.mockResolvedValue(null);
      await expect(useCase.disconnect('i1')).rejects.toThrow('Instância não encontrada');
    });

    it('should disconnect instance', async () => {
      const instance = createInstance();
      instanceRepo.findById.mockResolvedValue(instance);
      instanceRepo.update.mockResolvedValue(instance);
      whatsappProvider.disconnect.mockResolvedValue(undefined);

      await useCase.disconnect('i1');
      expect(instance.getProps().status).toBe('disconnected');
      expect(whatsappProvider.disconnect).toHaveBeenCalledWith('i1');
    });
  });
});
