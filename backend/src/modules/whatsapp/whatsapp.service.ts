import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { CreateInstanceDto, WhatsAppProvider } from './dto/create-instance.dto';
import { UpdateInstanceDto } from './dto/update-instance.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { InstanceStatus } from '@prisma/client';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(tenantId: string, workspaceId: string, dto: CreateInstanceDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxWhatsAppInstances: true, _count: { select: { whatsappInstances: true } } },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    if (tenant._count.whatsappInstances >= tenant.maxWhatsAppInstances) {
      throw new ForbiddenException(
        `WhatsApp instance limit reached (${tenant.maxWhatsAppInstances}). Upgrade your plan to add more.`,
      );
    }

    const existing = await this.prisma.whatsAppInstance.findUnique({
      where: { tenantId_name: { tenantId, name: dto.name } },
    });

    if (existing) {
      throw new ConflictException(`Instance "${dto.name}" already exists in this tenant`);
    }

    const serverUrl =
      dto.serverUrl || this.configService.get<string>('whatsapp.evolution.serverUrl');
    const apikey = dto.apikey || this.configService.get<string>('whatsapp.evolution.globalApiKey');
    const frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:3000';
    const webhookUrl = `${frontendUrl}/api/v1/whatsapp/webhook/${uuidv4()}`;

    const instance = await this.prisma.whatsAppInstance.create({
      data: {
        tenantId,
        workspaceId,
        name: dto.name,
        phoneNumber: dto.phoneNumber,
        provider: dto.provider,
        serverUrl,
        apikey,
        webhookUrl,
        status: InstanceStatus.disconnected,
      },
    });

    this.logger.log(`WhatsApp instance created: ${instance.id} (${dto.provider})`);

    if (dto.provider === WhatsAppProvider.evolution) {
      await this.registerEvolutionWebhook(instance);
    }

    return instance;
  }

  async findAll(tenantId: string, workspaceId: string) {
    return this.prisma.whatsAppInstance.findMany({
      where: { tenantId, workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, workspaceId: string, id: string) {
    const instance = await this.prisma.whatsAppInstance.findFirst({
      where: { id, tenantId, workspaceId },
    });

    if (!instance) {
      throw new NotFoundException('WhatsApp instance not found');
    }

    return instance;
  }

  async update(tenantId: string, workspaceId: string, id: string, dto: UpdateInstanceDto) {
    const instance = await this.findOne(tenantId, workspaceId, id);

    if (dto.name && dto.name !== instance.name) {
      const existing = await this.prisma.whatsAppInstance.findUnique({
        where: { tenantId_name: { tenantId, name: dto.name } },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException(`Instance "${dto.name}" already exists in this tenant`);
      }
    }

    return this.prisma.whatsAppInstance.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.serverUrl && { serverUrl: dto.serverUrl }),
        ...(dto.apikey && { apikey: dto.apikey }),
        ...(dto.metaPhoneId !== undefined && { metaPhoneId: dto.metaPhoneId }),
        ...(dto.metaBusinessId !== undefined && { metaBusinessId: dto.metaBusinessId }),
        ...(dto.settings && { settings: dto.settings }),
        ...(instance.provider === WhatsAppProvider.meta_cloud &&
          dto.metaPhoneId !== undefined && {
            status: dto.metaPhoneId
              ? InstanceStatus.connected
              : InstanceStatus.disconnected,
          }),
      },
    });
  }

  getMetaWebhookInfo() {
    const backendUrl = this.configService.get<string>('backendUrl');
    const verifyToken = this.configService.get<string>('whatsapp.meta.webhookVerifyToken');

    return {
      webhookUrl: `${backendUrl}/api/v1/webhooks/meta`,
      verifyToken,
    };
  }

  async remove(tenantId: string, workspaceId: string, id: string) {
    const instance = await this.findOne(tenantId, workspaceId, id);

    if (instance.status === InstanceStatus.connected || instance.status === InstanceStatus.connecting) {
      try {
        await this.disconnectFromProvider(instance);
      } catch (err) {
        this.logger.warn(`Failed to disconnect provider during delete: ${err.message}`);
      }
    }

    await this.prisma.whatsAppInstance.delete({ where: { id } });

    this.logger.log(`WhatsApp instance deleted: ${id}`);

    return { message: 'Instance deleted successfully' };
  }

  async connect(tenantId: string, workspaceId: string, id: string) {
    const instance = await this.findOne(tenantId, workspaceId, id);

    if (instance.status === InstanceStatus.connected) {
      throw new BadRequestException('Instance is already connected');
    }

    await this.prisma.whatsAppInstance.update({
      where: { id },
      data: { status: InstanceStatus.connecting },
    });

    try {
      if (instance.provider === WhatsAppProvider.evolution) {
        return await this.connectEvolution(instance);
      }

      await this.prisma.whatsAppInstance.update({
        where: { id },
        data: { status: InstanceStatus.connected },
      });

      return { message: 'Instance connected successfully' };
    } catch (err) {
      await this.prisma.whatsAppInstance.update({
        where: { id },
        data: { status: InstanceStatus.error },
      });
      throw new BadRequestException(`Failed to connect: ${err.message}`);
    }
  }

  async disconnect(tenantId: string, workspaceId: string, id: string) {
    const instance = await this.findOne(tenantId, workspaceId, id);

    if (instance.status === InstanceStatus.disconnected) {
      throw new BadRequestException('Instance is already disconnected');
    }

    try {
      await this.disconnectFromProvider(instance);
    } catch (err) {
      this.logger.warn(`Provider disconnect failed: ${err.message}`);
    }

    return this.prisma.whatsAppInstance.update({
      where: { id },
      data: {
        status: InstanceStatus.disconnected,
        qrCode: null,
      },
    });
  }

  async restart(tenantId: string, workspaceId: string, id: string) {
    const instance = await this.findOne(tenantId, workspaceId, id);

    if (instance.provider !== WhatsAppProvider.evolution) {
      throw new BadRequestException('Restart is only supported for Evolution API instances');
    }

    try {
      const evolutionUrl = instance.serverUrl || this.configService.get<string>('whatsapp.evolution.serverUrl');
      const apiKey = instance.apikey || this.configService.get<string>('whatsapp.evolution.globalApiKey');

      await firstValueFrom(
        this.httpService.post(
          `${evolutionUrl}/instance/restart/${instance.name}`,
          {},
          { headers: { apikey: apiKey } },
        ),
      );

      await this.prisma.whatsAppInstance.update({
        where: { id },
        data: { status: InstanceStatus.connecting, qrCode: null },
      });

      return { message: 'Instance restart initiated' };
    } catch (err) {
      throw new BadRequestException(`Failed to restart instance: ${err.message}`);
    }
  }

  async getQRCode(tenantId: string, workspaceId: string, id: string) {
    const instance = await this.findOne(tenantId, workspaceId, id);

    if (instance.provider !== WhatsAppProvider.evolution) {
      throw new BadRequestException('QR code is only available for Evolution API instances');
    }

    if (instance.status === InstanceStatus.connected) {
      throw new BadRequestException('Instance is already connected');
    }

    try {
      const evolutionUrl = instance.serverUrl || this.configService.get<string>('whatsapp.evolution.serverUrl');
      const apiKey = instance.apikey || this.configService.get<string>('whatsapp.evolution.globalApiKey');

      const response = await firstValueFrom(
        this.httpService.get(`${evolutionUrl}/instance/qrcode/${instance.name}`, {
          headers: { apikey: apiKey },
        }),
      );

      const qrCode = response.data?.qrcode || response.data?.base64 || null;

      if (qrCode) {
        await this.prisma.whatsAppInstance.update({
          where: { id },
          data: { qrCode },
        });
      }

      return { qrCode, instanceId: id, name: instance.name };
    } catch (err) {
      if (err.response?.status === 404) {
        await this.connect(tenantId, workspaceId, id);

        const evolutionUrl = instance.serverUrl || this.configService.get<string>('whatsapp.evolution.serverUrl');
        const apiKey = instance.apikey || this.configService.get<string>('whatsapp.evolution.globalApiKey');

        const response = await firstValueFrom(
          this.httpService.get(`${evolutionUrl}/instance/qrcode/${instance.name}`, {
            headers: { apikey: apiKey },
          }),
        );

        const qrCode = response.data?.qrcode || response.data?.base64 || null;

        if (qrCode) {
          await this.prisma.whatsAppInstance.update({
            where: { id },
            data: { qrCode },
          });
        }

        return { qrCode, instanceId: id, name: instance.name };
      }

      throw new BadRequestException(`Failed to get QR code: ${err.message}`);
    }
  }

  async sendMessage(tenantId: string, workspaceId: string, id: string, dto: SendMessageDto) {
    const instance = await this.findOne(tenantId, workspaceId, id);

    if (instance.status !== InstanceStatus.connected) {
      throw new BadRequestException('Instance is not connected');
    }

    try {
      if (instance.provider === WhatsAppProvider.evolution) {
        return await this.sendEvolutionMessage(instance, dto);
      }

      return await this.sendMetaMessage(instance, dto);
    } catch (err) {
      throw new BadRequestException(`Failed to send message: ${err.message}`);
    }
  }

  private async connectEvolution(instance: any) {
    const evolutionUrl = instance.serverUrl || this.configService.get<string>('whatsapp.evolution.serverUrl');
    const apiKey = instance.apikey || this.configService.get<string>('whatsapp.evolution.globalApiKey');

    await firstValueFrom(
      this.httpService.post(
        `${evolutionUrl}/instance/create`,
        {
          instanceName: instance.name,
          webhookUrl: instance.webhookUrl,
          webhookByEvents: true,
          webhookBase64: false,
          qrcode: true,
        },
        { headers: { apikey: apiKey } },
      ),
    );

    const qrResponse = await firstValueFrom(
      this.httpService.get(`${evolutionUrl}/instance/qrcode/${instance.name}`, {
        headers: { apikey: apiKey },
      }),
    );

    const qrCode = qrResponse.data?.qrcode || qrResponse.data?.base64 || null;

    await this.prisma.whatsAppInstance.update({
      where: { id: instance.id },
      data: { qrCode },
    });

    return {
      message: 'Connection initiated. Scan the QR code to connect.',
      qrCode,
      instanceId: instance.id,
      name: instance.name,
    };
  }

  private async disconnectFromProvider(instance: any) {
    if (instance.provider === WhatsAppProvider.evolution) {
      const evolutionUrl = instance.serverUrl || this.configService.get<string>('whatsapp.evolution.serverUrl');
      const apiKey = instance.apikey || this.configService.get<string>('whatsapp.evolution.globalApiKey');

      await firstValueFrom(
        this.httpService.delete(`${evolutionUrl}/instance/logout/${instance.name}`, {
          headers: { apikey: apiKey },
        }),
      );
    }
  }

  private async sendEvolutionMessage(instance: any, dto: SendMessageDto) {
    const evolutionUrl = instance.serverUrl || this.configService.get<string>('whatsapp.evolution.serverUrl');
    const apiKey = instance.apikey || this.configService.get<string>('whatsapp.evolution.globalApiKey');

    const response = await firstValueFrom(
      this.httpService.post(
        `${evolutionUrl}/message/send`,
        {
          number: dto.to,
          text: dto.message,
          type: dto.type || 'text',
        },
        {
          headers: {
            apikey: apiKey,
            instance: instance.name,
          },
        },
      ),
    );

    return { success: true, provider: 'evolution', response: response.data };
  }

  private async sendMetaMessage(instance: any, dto: SendMessageDto) {
    const accessToken = this.configService.get<string>('whatsapp.meta.accessToken');
    const phoneId = instance.metaPhoneId;

    if (!phoneId) {
      throw new BadRequestException('Meta Phone ID is not configured for this instance');
    }

    const response = await firstValueFrom(
      this.httpService.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: dto.to,
          type: 'text',
          text: { body: dto.message },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return { success: true, provider: 'meta_cloud', response: response.data };
  }

  private async registerEvolutionWebhook(instance: any) {
    try {
      const evolutionUrl = instance.serverUrl || this.configService.get<string>('whatsapp.evolution.serverUrl');
      const apiKey = instance.apikey || this.configService.get<string>('whatsapp.evolution.globalApiKey');

      await firstValueFrom(
        this.httpService.post(
          `${evolutionUrl}/instance/setWebhook`,
          {
            webhookUrl: instance.webhookUrl,
            webhookByEvents: true,
            webhookBase64: false,
          },
          {
            headers: {
              apikey: apiKey,
              instance: instance.name,
            },
          },
        ),
      );

      this.logger.log(`Webhook registered for instance ${instance.name}`);
    } catch (err) {
      this.logger.warn(`Failed to register webhook for ${instance.name}: ${err.message}`);
    }
  }
}
