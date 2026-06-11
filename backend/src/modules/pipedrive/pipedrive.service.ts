import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { UpdateSyncDto } from './dto/update-sync.dto';

@Injectable()
export class PipedriveService {
  private readonly logger = new Logger(PipedriveService.name);
  private readonly apiBase = 'https://api.pipedrive.com/api/v1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private get clientId() {
    return this.configService.get<string>('pipedrive.clientId');
  }

  private get clientSecret() {
    return this.configService.get<string>('pipedrive.clientSecret');
  }

  private get redirectUri() {
    return this.configService.get<string>('pipedrive.redirectUri');
  }

  async getIntegration(tenantId: string, workspaceId: string) {
    return this.prisma.pipedriveIntegration.findUnique({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
    });
  }

  getOAuthUrl(tenantId: string, workspaceId: string, companyDomain?: string) {
    const state = Buffer.from(JSON.stringify({ tenantId, workspaceId })).toString('base64');
    const url = new URL('https://oauth.pipedrive.com/oauth/authorize');

    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('state', state);

    if (companyDomain) {
      url.searchParams.set('company_domain', companyDomain);
    }

    return { url: url.toString() };
  }

  async handleCallback(code: string, state: string) {
    let payload: { tenantId: string; workspaceId: string };
    try {
      payload = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid state parameter');
    }

    const { tenantId, workspaceId } = payload;

    const tokenResponse = await fetch('https://oauth.pipedrive.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      this.logger.error(`Pipedrive token exchange failed: ${err}`);
      throw new BadRequestException('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();

    const me = await this.fetchPipedriveUser(tokens.access_token);

    const integration = await this.prisma.pipedriveIntegration.upsert({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
      create: {
        tenantId,
        workspaceId,
        companyDomain: me.company_domain || '',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        pipedriveUserId: me.id,
        pipedriveName: me.name,
        pipedriveEmail: me.email,
        isActive: true,
      },
      update: {
        companyDomain: me.company_domain || '',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        pipedriveUserId: me.id,
        pipedriveName: me.name,
        pipedriveEmail: me.email,
        isActive: true,
      },
    });

    this.logger.log(`Pipedrive integration connected for tenant ${tenantId}`);

    await this.registerWebhook(tenantId, workspaceId, integration);

    return {
      success: true,
      companyDomain: me.company_domain,
      name: me.name,
      email: me.email,
    };
  }

  async disconnect(tenantId: string, workspaceId: string) {
    const integration = await this.prisma.pipedriveIntegration.findUnique({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
    });

    if (!integration) {
      throw new NotFoundException('Pipedrive integration not found');
    }

    await this.removeWebhook(integration);

    await this.prisma.pipedriveIntegration.delete({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
    });

    this.logger.log(`Pipedrive integration disconnected for tenant ${tenantId}`);
    return { success: true };
  }

  /**
   * Registers a Pipedrive webhook (event_object=deal, event_action=*) pointing
   * back to our backend, so both new deals (e.g. organic leads from a website
   * form) and stage/field changes are pushed to us in real time.
   */
  async registerWebhook(tenantId: string, workspaceId: string, integration: any) {
    try {
      const token = await this.getValidToken(integration);
      const backendUrl = this.configService.get<string>('backendUrl');
      const subscriptionUrl = `${backendUrl}/api/webhooks/pipedrive/${tenantId}/${workspaceId}`;

      const authUser = integration.webhookAuthUser || crypto.randomBytes(8).toString('hex');
      const authPass = integration.webhookAuthPass || crypto.randomBytes(16).toString('hex');

      const response = await fetch(`${this.apiBase}/webhooks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_url: subscriptionUrl,
          event_action: '*',
          event_object: 'deal',
          http_auth_user: authUser,
          http_auth_password: authPass,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        this.logger.error(`Failed to register Pipedrive webhook: ${err}`);
        return;
      }

      const body = await response.json();

      await this.prisma.pipedriveIntegration.update({
        where: { id: integration.id },
        data: {
          webhookId: body.data?.id,
          webhookAuthUser: authUser,
          webhookAuthPass: authPass,
        },
      });

      this.logger.log(`Pipedrive webhook registered for tenant ${tenantId}`);
    } catch (err: any) {
      this.logger.error(`Error registering Pipedrive webhook: ${err.message}`);
    }
  }

  private async removeWebhook(integration: any) {
    if (!integration.webhookId) return;

    try {
      const token = await this.getValidToken(integration);
      await fetch(`${this.apiBase}/webhooks/${integration.webhookId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err: any) {
      this.logger.error(`Error removing Pipedrive webhook: ${err.message}`);
    }
  }

  /**
   * Validates Basic Auth credentials sent by Pipedrive on inbound webhook calls.
   */
  async verifyWebhookAuth(tenantId: string, workspaceId: string, authUser?: string, authPass?: string) {
    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration?.webhookAuthUser || !integration?.webhookAuthPass) return false;

    return authUser === integration.webhookAuthUser && authPass === integration.webhookAuthPass;
  }

  async updateSyncSettings(tenantId: string, workspaceId: string, dto: UpdateSyncDto) {
    const integration = await this.prisma.pipedriveIntegration.findUnique({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
    });

    if (!integration) {
      throw new NotFoundException('Pipedrive integration not found');
    }

    const updated = await this.prisma.pipedriveIntegration.update({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
      data: {
        ...(dto.syncContacts !== undefined && { syncContacts: dto.syncContacts }),
        ...(dto.syncLeads !== undefined && { syncLeads: dto.syncLeads }),
        ...(dto.syncPipelines !== undefined && { syncPipelines: dto.syncPipelines }),
      },
    });

    return updated;
  }

  async getPipelines(tenantId: string, workspaceId: string) {
    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) throw new NotFoundException('Pipedrive not connected');

    const token = await this.getValidToken(integration);
    const data = await this.pipedriveGet(token, '/pipelines');

    return data;
  }

  async getStages(tenantId: string, workspaceId: string, pipelineId?: number) {
    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) throw new NotFoundException('Pipedrive not connected');

    const token = await this.getValidToken(integration);
    const endpoint = pipelineId ? `/stages?pipeline_id=${pipelineId}` : '/stages';
    const data = await this.pipedriveGet(token, endpoint);

    return data;
  }

  async syncContacts(tenantId: string, workspaceId: string) {
    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) throw new NotFoundException('Pipedrive not connected');

    const token = await this.getValidToken(integration);

    const persons = await this.pipedriveGetAll(token, '/persons');

    let created = 0;
    let updated = 0;

    for (const person of persons) {
      const phone = person.phone?.[0]?.value?.replace(/[^0-9]/g, '') || '';
      const email = person.email?.[0]?.value || '';

      if (!phone && !email) continue;

      const existing = phone
        ? await this.prisma.contact.findUnique({
            where: { tenantId_phone: { tenantId, phone } },
          })
        : null;

      if (existing) {
        await this.prisma.contact.update({
          where: { id: existing.id },
          data: {
            name: person.name || existing.name,
            ...(email && { email }),
            metadata: {
              ...(existing.metadata as any),
              pipedrivePersonId: person.id,
              pipedriveUpdatedAt: person.update_time,
            },
          },
        });
        updated++;
      } else {
        const name = person.name || phone || email;
        await this.prisma.contact.create({
          data: {
            tenantId,
            workspaceId,
            name,
            phone: phone || 'unknown',
            email: email || undefined,
            metadata: {
              pipedrivePersonId: person.id,
              pipedriveCreatedAt: person.add_time,
            },
          },
        });
        created++;
      }
    }

    await this.prisma.pipedriveIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    this.logger.log(`Pipedrive sync: ${created} contacts created, ${updated} updated`);
    return { created, updated, total: persons.length };
  }

  async syncLeads(tenantId: string, workspaceId: string) {
    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) throw new NotFoundException('Pipedrive not connected');

    const token = await this.getValidToken(integration);

    const deals = await this.pipedriveGetAll(token, '/deals');

    let created = 0;
    let updated = 0;

    const defaultPipeline = await this.prisma.pipeline.findFirst({
      where: { tenantId, workspaceId, isDefault: true },
    });

    if (!defaultPipeline) {
      throw new BadRequestException('No default pipeline found. Create a pipeline first.');
    }

    const stages = defaultPipeline.stages as any[];
    const defaultStage = stages.find((s: any) => s.isDefault) || stages[0];

    if (!defaultStage) {
      throw new BadRequestException('No stages in default pipeline');
    }

    for (const deal of deals) {
      const personId = deal.person_id?.value || deal.person_id;
      const contact = personId
        ? await this.prisma.contact.findFirst({
            where: {
              tenantId,
              metadata: { path: ['pipedrivePersonId'], equals: personId },
            },
          })
        : null;

      const existing = await this.prisma.lead.findFirst({
        where: {
          tenantId,
          metadata: { path: ['pipedriveDealId'], equals: deal.id },
        },
      });

      if (existing) {
        await this.prisma.lead.update({
          where: { id: existing.id },
          data: {
            title: deal.title || existing.title,
            value: deal.value ? Number(deal.value) : existing.value,
            ...(contact && { contactId: contact.id }),
            metadata: {
              ...(existing.metadata as any),
              pipedriveDealId: deal.id,
              pipedriveUpdatedAt: deal.update_time,
            },
          },
        });
        updated++;
      } else if (contact) {
        await this.prisma.lead.create({
          data: {
            tenantId,
            workspaceId,
            pipelineId: defaultPipeline.id,
            stageId: defaultStage.id,
            contactId: contact.id,
            title: deal.title || 'Untitled Deal',
            value: deal.value ? Number(deal.value) : undefined,
            source: 'api',
            metadata: {
              pipedriveDealId: deal.id,
              pipedriveCreatedAt: deal.add_time,
            },
          },
        });
        created++;
      }
    }

    await this.prisma.pipedriveIntegration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    this.logger.log(`Pipedrive sync: ${created} deals created, ${updated} updated`);
    return { created, updated, total: deals.length };
  }

  /**
   * Handles an inbound "deal updated" webhook from Pipedrive: upserts the
   * corresponding contact/lead in Wave and returns an enriched payload that
   * can be fed to the automations engine (event `pipedrive.deal_updated`).
   */
  async processDealWebhook(tenantId: string, workspaceId: string, body: any) {
    const deal = body?.current;
    const previous = body?.previous;

    if (!deal) return null;

    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) return null;

    const token = await this.getValidToken(integration);

    const personId = typeof deal.person_id === 'object' ? deal.person_id?.value : deal.person_id;
    let contact: any = null;

    if (personId) {
      const person = await this.pipedriveGet(token, `/persons/${personId}`).catch(() => null);
      if (person) {
        contact = await this.upsertContactFromPerson(tenantId, workspaceId, person);
      }
    }

    const lead = await this.upsertLeadFromDeal(tenantId, workspaceId, deal, contact);

    return {
      action: body?.meta?.action, // 'added' | 'updated' | 'merged' | 'deleted'
      leadId: lead?.id,
      contactId: contact?.id,
      contactPhone: contact?.phone,
      contactName: contact?.name,
      pipedriveDealId: deal.id,
      pipelineId: deal.pipeline_id,
      stageId: deal.stage_id,
      previousStageId: previous?.stage_id,
      dealTitle: deal.title,
      value: deal.value,
    };
  }

  private async upsertContactFromPerson(tenantId: string, workspaceId: string, person: any) {
    const phone = person.phone?.[0]?.value?.replace(/[^0-9]/g, '') || '';
    const email = person.email?.[0]?.value || '';

    if (!phone && !email) return null;

    const existing = phone
      ? await this.prisma.contact.findUnique({
          where: { tenantId_phone: { tenantId, phone } },
        })
      : null;

    if (existing) {
      return this.prisma.contact.update({
        where: { id: existing.id },
        data: {
          name: person.name || existing.name,
          ...(email && { email }),
          metadata: {
            ...(existing.metadata as any),
            pipedrivePersonId: person.id,
            pipedriveUpdatedAt: person.update_time,
          },
        },
      });
    }

    return this.prisma.contact.create({
      data: {
        tenantId,
        workspaceId,
        name: person.name || phone || email,
        phone: phone || 'unknown',
        email: email || undefined,
        metadata: {
          pipedrivePersonId: person.id,
          pipedriveCreatedAt: person.add_time,
        },
      },
    });
  }

  private async upsertLeadFromDeal(tenantId: string, workspaceId: string, deal: any, contact: any) {
    const existing = await this.prisma.lead.findFirst({
      where: {
        tenantId,
        metadata: { path: ['pipedriveDealId'], equals: deal.id },
      },
    });

    if (existing) {
      return this.prisma.lead.update({
        where: { id: existing.id },
        data: {
          title: deal.title || existing.title,
          value: deal.value ? Number(deal.value) : existing.value,
          ...(contact && { contactId: contact.id }),
          lastActivityAt: new Date(),
          metadata: {
            ...(existing.metadata as any),
            pipedriveDealId: deal.id,
            pipedrivePipelineId: deal.pipeline_id,
            pipedriveStageId: deal.stage_id,
            pipedriveUpdatedAt: deal.update_time,
          },
        },
      });
    }

    if (!contact) return null;

    const defaultPipeline = await this.prisma.pipeline.findFirst({
      where: { tenantId, workspaceId, isDefault: true },
    });

    if (!defaultPipeline) return null;

    const stages = defaultPipeline.stages as any[];
    const defaultStage = stages.find((s: any) => s.isDefault) || stages[0];

    if (!defaultStage) return null;

    return this.prisma.lead.create({
      data: {
        tenantId,
        workspaceId,
        pipelineId: defaultPipeline.id,
        stageId: defaultStage.id,
        contactId: contact.id,
        title: deal.title || 'Untitled Deal',
        value: deal.value ? Number(deal.value) : undefined,
        source: 'api',
        metadata: {
          pipedriveDealId: deal.id,
          pipedrivePipelineId: deal.pipeline_id,
          pipedriveStageId: deal.stage_id,
          pipedriveCreatedAt: deal.add_time,
        },
      },
    });
  }

  /**
   * Updates the stage of a Pipedrive deal. Used by the `pipedrive_update_stage`
   * automation action so changes made in Wave flow back to Pipedrive.
   */
  async updateDealStage(tenantId: string, workspaceId: string, dealId: number, stageId: number) {
    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) throw new NotFoundException('Pipedrive not connected');

    const token = await this.getValidToken(integration);

    const response = await fetch(`${this.apiBase}/deals/${dealId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stage_id: stageId }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new BadRequestException(`Pipedrive API error: ${err}`);
    }

    return (await response.json()).data;
  }

  private async fetchPipedriveUser(accessToken: string) {
    const response = await fetch(`${this.apiBase}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new UnauthorizedException('Failed to fetch Pipedrive user');
    }

    const body = await response.json();
    return body.data;
  }

  private async getValidToken(integration: any): Promise<string> {
    if (!integration.tokenExpiresAt || new Date(integration.tokenExpiresAt) <= new Date()) {
      return this.refreshAccessToken(integration);
    }
    return integration.accessToken;
  }

  private async refreshAccessToken(integration: any): Promise<string> {
    if (!integration.refreshToken) {
      throw new UnauthorizedException('No refresh token available');
    }

    const response = await fetch('https://oauth.pipedrive.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: integration.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      await this.prisma.pipedriveIntegration.update({
        where: { id: integration.id },
        data: { isActive: false },
      });
      throw new UnauthorizedException('Failed to refresh Pipedrive token');
    }

    const tokens = await response.json();

    await this.prisma.pipedriveIntegration.update({
      where: { id: integration.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    return tokens.access_token;
  }

  private async pipedriveGet(token: string, path: string) {
    const response = await fetch(`${this.apiBase}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const err = await response.text();
      throw new BadRequestException(`Pipedrive API error: ${err}`);
    }

    const body = await response.json();
    return body.data;
  }

  private async pipedriveGetAll(token: string, path: string) {
    const allItems: any[] = [];
    let start = 0;
    const limit = 100;

    for (let i = 0; i < 50; i++) {
      const response = await fetch(`${this.apiBase}${path}?start=${start}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) break;

      const body = await response.json();
      const items = body.data || [];

      if (items.length === 0) break;

      allItems.push(...items);

      if (items.length < limit) break;

      start += limit;
    }

    return allItems;
  }
}
