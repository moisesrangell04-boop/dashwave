import { WhatsAppInstance } from '../../../@core/entities/whatsapp-instance';
import { TenantId } from '../../../@core/value-objects/tenant-id';
import { WhatsAppInstanceRepository } from '../../ports/repositories/whatsapp-instance.repository';
import { WhatsAppProviderPort } from '../../ports/infrastructure/whatsapp-provider.port';

export class ConnectInstanceUseCase {
  constructor(
    private readonly instanceRepo: WhatsAppInstanceRepository,
    private readonly whatsappProvider: WhatsAppProviderPort,
  ) {}

  async execute(instanceId: string) {
    const instance = await this.instanceRepo.findById(instanceId);
    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    instance.connect();
    await this.instanceRepo.update(instanceId, { status: 'connecting' as any });

    try {
      const result = await this.whatsappProvider.connect(instanceId);

      if (result.qrCode) {
        instance.updateQRCode(result.qrCode);
        await this.instanceRepo.update(instanceId, {
          status: 'connecting' as any,
          qrCode: result.qrCode,
        });
      }

      return result;
    } catch {
      instance.setError();
      await this.instanceRepo.update(instanceId, { status: 'error' as any });
      throw new Error('Falha ao conectar instância');
    }
  }

  async disconnect(instanceId: string) {
    const instance = await this.instanceRepo.findById(instanceId);
    if (!instance) {
      throw new Error('Instância não encontrada');
    }

    await this.whatsappProvider.disconnect(instanceId);

    instance.disconnect();
    await this.instanceRepo.update(instanceId, { status: 'disconnected' as any, qrCode: null });
  }
}
