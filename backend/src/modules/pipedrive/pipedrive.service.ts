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

  private sanitize(obj: any): any {
    if (typeof obj === 'string') return obj.replace(/\0/g, '');
    if (Array.isArray(obj)) return obj.map(v => this.sanitize(v));
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k] = this.sanitize(v);
      }
      return result;
    }
    return obj;
  }

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

  private signState(payload: { tenantId: string; workspaceId: string }): string {
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const secret = this.configService.get<string>('jwt.secret');
    const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${sig}`;
  }

  private verifyState(state: string): { tenantId: string; workspaceId: string } {
    const [data, sig] = state.split('.');
    if (!data || !sig) throw new BadRequestException('Invalid state parameter');

    const secret = this.configService.get<string>('jwt.secret');
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (!this.timingSafeEquals(sig, expectedSig)) {
      throw new BadRequestException('Invalid state parameter');
    }

    try {
      return JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    } catch {
      throw new BadRequestException('Invalid state parameter');
    }
  }

  getOAuthUrl(tenantId: string, workspaceId: string, companyDomain?: string) {
    const state = this.signState({ tenantId, workspaceId });
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
    const { tenantId, workspaceId } = this.verifyState(state);

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
    });

    const tokenResponse = await fetch('https://oauth.pipedrive.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
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

  async registerWebhook(tenantId: string, workspaceId: string, integration: any) {
    try {
      const token = await this.getValidToken(integration);
      const backendUrl = this.configService.get<string>('backendUrl');
      const baseUrl = `${backendUrl}/api/v1/webhooks/pipedrive/${tenantId}/${workspaceId}`;

      const authUser = integration.webhookAuthUser || crypto.randomBytes(8).toString('hex');
      const authPass = integration.webhookAuthPass || crypto.randomBytes(16).toString('hex');

      const companyDomain = integration.companyDomain;
      const apiBase = companyDomain
        ? `https://${companyDomain}.pipedrive.com/api/v1`
        : this.apiBase;

      await this.removeWebhook(integration);

      const objects = ['deal', 'person', 'organization'];
      const ids: Record<string, number> = {};

      for (const object of objects) {
        const response = await fetch(`${apiBase}/webhooks`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription_url: baseUrl,
            event_action: '*',
            event_object: object,
            http_auth_user: authUser,
            http_auth_password: authPass,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          this.logger.error(`Failed to register Pipedrive webhook for ${object}: ${err}`);
          continue;
        }

        const body = await response.json();
        ids[object] = body.data?.id;
      }

      await this.prisma.pipedriveIntegration.update({
        where: { id: integration.id },
        data: {
          webhookId: ids.deal || null,
          webhookAuthUser: authUser,
          webhookAuthPass: authPass,
          webhookIds: ids,
        },
      });

      this.logger.log(`Pipedrive webhooks registered for tenant ${tenantId}: ${JSON.stringify(ids)}`);
    } catch (err: any) {
      this.logger.error(`Error registering Pipedrive webhooks: ${err.message}`);
    }
  }

  private async removeWebhook(integration: any) {
    try {
      const token = await this.getValidToken(integration);
      const companyDomain = integration.companyDomain;
      const apiBase = companyDomain
        ? `https://${companyDomain}.pipedrive.com/api/v1`
        : this.apiBase;

      const ids: number[] = [];
      if (integration.webhookId) ids.push(integration.webhookId);
      if (integration.webhookIds) {
        const stored: Record<string, number> = integration.webhookIds as any;
        for (const v of Object.values(stored)) {
          if (v && !ids.includes(v)) ids.push(v);
        }
      }

      for (const id of ids) {
        await fetch(`${apiBase}/webhooks/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch (err: any) {
      this.logger.error(`Error removing Pipedrive webhooks: ${err.message}`);
    }
  }

  /**
   * Validates Basic Auth credentials sent by Pipedrive on inbound webhook calls.
   */
  async verifyWebhookAuth(tenantId: string, workspaceId: string, authUser?: string, authPass?: string) {
    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration?.webhookAuthUser || !integration?.webhookAuthPass) return false;
    if (!authUser || !authPass) return false;

    return (
      this.timingSafeEquals(authUser, integration.webhookAuthUser) &&
      this.timingSafeEquals(authPass, integration.webhookAuthPass)
    );
  }

  private timingSafeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
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

  async updateFunnelConfig(tenantId: string, workspaceId: string, dto: { users: { name: string; weight: number }[] }) {
    const integration = await this.prisma.pipedriveIntegration.findUnique({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
    });

    if (!integration) {
      throw new NotFoundException('Pipedrive integration not found');
    }

    const totalWeight = dto.users.reduce((sum, u) => sum + u.weight, 0);
    if (totalWeight !== 100) {
      throw new BadRequestException('Total weight must equal 100');
    }

    const updated = await this.prisma.pipedriveIntegration.update({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
      data: { funnelConfig: dto.users as any },
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
      const phone = person.phone?.[0]?.value?.replace(/[^0-9]/g, '').replace(/\0/g, '') || '';
      const email = (person.email?.[0]?.value || '').replace(/\0/g, '');
      const name = (person.name || email || 'Unknown').replace(/\0/g, '');

      if (!phone && !email) continue;

      const existing = phone
        ? await this.prisma.contact.findUnique({
            where: { tenantId_phone: { tenantId, phone } },
          })
        : email
          ? await this.prisma.contact.findFirst({
              where: { tenantId, email },
            })
          : null;

      if (existing) {
        await this.prisma.contact.update({
          where: { id: existing.id },
          data: this.sanitize({
            name: name || existing.name,
            ...(email && { email }),
            metadata: {
              ...(existing.metadata as any),
              pipedrivePersonId: person.id,
              pipedriveUpdatedAt: person.update_time,
            },
          }),
        });
        updated++;
      } else {
        await this.prisma.contact.create({
          data: this.sanitize({
            tenantId,
            workspaceId,
            name,
            phone: phone || `pipedrive-${person.id}`,
            email: email || undefined,
            metadata: {
              pipedrivePersonId: person.id,
              pipedriveCreatedAt: person.add_time,
            },
          }),
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
      let contact: any = null;

      if (personId) {
        contact = await this.prisma.contact.findFirst({
          where: {
            tenantId,
            metadata: { path: ['pipedrivePersonId'], equals: personId },
          },
        });
      }

      if (!contact) {
        const personName = deal.person_name || '';
        contact = await this.prisma.contact.create({
          data: this.sanitize({
            tenantId,
            workspaceId,
            name: personName || deal.title || 'Pipedrive Deal',
            phone: `pipedrive-deal-${deal.id}`,
            metadata: { pipedrivePersonId: personId || null },
          }),
        });
      }

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
            contactId: contact.id,
            metadata: {
              ...(existing.metadata as any),
              pipedriveDealId: deal.id,
              pipedriveUpdatedAt: deal.update_time,
            },
          },
        });
        updated++;
      } else {
        await this.prisma.lead.create({
          data: this.sanitize({
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
          }),
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

  async syncPipelines(tenantId: string, workspaceId: string) {
    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) throw new NotFoundException('Pipedrive not connected');

    const token = await this.getValidToken(integration);

    const pipelinesData = await this.pipedriveGet(token, '/pipelines') || [];

    const hasExistingDefault = await this.prisma.pipeline.findFirst({
      where: { tenantId, workspaceId, isDefault: true },
    });

    let created = 0;
    let updated = 0;

    for (const pd of pipelinesData) {
      const stagesData = await this.pipedriveGet(token, `/stages?pipeline_id=${pd.id}`) || [];

      const stages = stagesData.map((s: any, idx: number) => ({
        id: `pipedrive-${s.id}`,
        pipedriveId: s.id,
        name: s.name,
        order: s.order_nr ?? idx,
        isDefault: idx === 0,
      }));

      const existing = await this.prisma.pipeline.findUnique({
        where: {
          tenantId_workspaceId_name: { tenantId, workspaceId, name: pd.name },
        },
      });

      if (existing) {
        await this.prisma.pipeline.update({
          where: { id: existing.id },
          data: this.sanitize({
            stages,
            isDefault: existing.isDefault,
          }),
        });
        updated++;
      } else {
        const isDefault = !hasExistingDefault && created === 0 && updated === 0;
        await this.prisma.pipeline.create({
          data: this.sanitize({
            tenantId,
            workspaceId,
            name: pd.name,
            description: null,
            stages,
            isDefault,
          }),
        });
        created++;
      }
    }

    await this.prisma.pipedriveIntegration.update({
      where: { tenantId_workspaceId: { tenantId, workspaceId } },
      data: { syncPipelines: true },
    });

    this.logger.log(`Pipedrive sync: ${created} pipelines created, ${updated} updated`);
    return { created, updated, total: pipelinesData.length };
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
    let person: any = null;

    if (personId) {
      person = await this.pipedriveGet(token, `/persons/${personId}`).catch(() => null);
      if (person) {
        contact = await this.upsertContactFromPerson(tenantId, workspaceId, person);
      }
    }

    const lead = await this.upsertLeadFromDeal(tenantId, workspaceId, deal, contact);

    // Fetch full deal with custom fields
    let fullDeal: any = null;
    try {
      fullDeal = await this.pipedriveGet(token, `/deals/${deal.id}`);
    } catch (e) {
      // non-critical, continue without custom fields
    }

    const contactPhones: string[] = [];
    if (person?.phone) {
      for (const entry of person.phone) {
        if (entry?.value) {
          const cleaned = entry.value.replace(/[^0-9]/g, '').replace(/\0/g, '');
          if (cleaned) contactPhones.push(cleaned);
        }
      }
    }
    if (contact?.phone && !contactPhones.includes(contact.phone)) {
      contactPhones.unshift(contact.phone);
    }

    return {
      action: body?.meta?.action,
      leadId: lead?.id,
      contactId: contact?.id,
      contactPhone: contact?.phone,
      contactPhones,
      contactName: contact?.name,
      pipedriveDealId: deal.id,
      pipelineId: deal.pipeline_id,
      stageId: deal.stage_id,
      previousStageId: previous?.stage_id,
      dealTitle: deal.title,
      value: deal.value,
      status: deal.status,
      personUserId: person?.owner_id?.id || person?.user_id?.id,
      personEmail: person?.email?.[0]?.value,
      orgName: deal.org_name,
      customFields: fullDeal ? this.extractCustomFields(fullDeal) : null,
    };
  }

  private extractCustomFields(deal: any): Record<string, any> {
    if (!deal) return {};
    const fields: Record<string, any> = {};
    for (const [key, value] of Object.entries(deal)) {
      if (key.startsWith('_')) continue;
      if (key.includes(' ')) continue;
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        fields[key] = value;
      }
    }
    return fields;
  }

  async processPersonWebhook(tenantId: string, workspaceId: string, body: any) {
    const person = body?.current;
    if (!person) return { status: 'ok' };

    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) return { status: 'ok' };

    const contact = await this.upsertContactFromPerson(tenantId, workspaceId, person);
    if (contact) {
      this.logger.log(`Pipedrive person ${person.id} synced to contact ${contact.id}`);
    }

    return { status: 'ok', contactId: contact?.id };
  }

  async processOrganizationWebhook(tenantId: string, workspaceId: string, body: any) {
    const org = body?.current;
    if (!org) return { status: 'ok' };

    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) return { status: 'ok' };

    const token = await this.getValidToken(integration);

    const name = (org.name || '').replace(/\0/g, '');
    const phone = ((org.cc_email || '').replace(/\0/g, '') || `pipedrive-org-${org.id}`);

    const existing = await this.prisma.contact.findFirst({
      where: {
        tenantId,
        metadata: { path: ['pipedriveOrgId'], equals: org.id },
      },
    });

    if (existing) {
      await this.prisma.contact.update({
        where: { id: existing.id },
        data: this.sanitize({
          name: name || existing.name,
          metadata: {
            ...(existing.metadata as any),
            pipedriveOrgId: org.id,
            pipedriveOrgUpdatedAt: org.update_time,
          },
        }),
      });
    } else {
      await this.prisma.contact.create({
        data: this.sanitize({
          tenantId,
          workspaceId,
          name: name || 'Pipedrive Organization',
          phone,
          metadata: {
            pipedriveOrgId: org.id,
            pipedriveOrgCreatedAt: org.add_time,
          },
        }),
      });
    }

    this.logger.log(`Pipedrive organization ${org.id} synced for tenant ${tenantId}`);
    return { status: 'ok' };
  }

  private async upsertContactFromPerson(tenantId: string, workspaceId: string, person: any) {
    const phone = person.phone?.[0]?.value?.replace(/[^0-9]/g, '').replace(/\0/g, '') || '';
    const email = (person.email?.[0]?.value || '').replace(/\0/g, '');
    const name = (person.name || email || 'Unknown').replace(/\0/g, '');

    if (!phone && !email) return null;

    const existing = phone
      ? await this.prisma.contact.findUnique({
          where: { tenantId_phone: { tenantId, phone } },
        })
      : email
        ? await this.prisma.contact.findFirst({
            where: { tenantId, email },
          })
        : null;

    if (existing) {
      return this.prisma.contact.update({
        where: { id: existing.id },
        data: this.sanitize({
          name: name || existing.name,
          ...(email && { email }),
          metadata: {
            ...(existing.metadata as any),
            pipedrivePersonId: person.id,
            pipedriveUpdatedAt: person.update_time,
          },
        }),
      });
    }

    return this.prisma.contact.create({
      data: this.sanitize({
        tenantId,
        workspaceId,
        name,
        phone: phone || `pipedrive-${person.id}`,
        email: email || undefined,
        metadata: {
          pipedrivePersonId: person.id,
          pipedriveCreatedAt: person.add_time,
        },
      }),
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
      const existingStageId = (existing.metadata as any)?.pipedriveStageId;
      const needPipelineUpdate = (existing.metadata as any)?.pipedrivePipelineId !== deal.pipeline_id
        || existingStageId !== deal.stage_id;

      let pipelineId = existing.pipelineId;
      let stageId = existing.stageId;

      if (needPipelineUpdate) {
        const pipelines = await this.prisma.pipeline.findMany({
          where: { tenantId, workspaceId },
        });
        const matchedPipeline = pipelines.find((p) => {
          const stages = (p.stages as any[]) || [];
          return stages.some((s: any) => s.pipedriveId === deal.stage_id);
        });
        const pipeline = matchedPipeline || pipelines.find((p) => p.isDefault);
        if (pipeline) {
          pipelineId = pipeline.id;
          const stages = (pipeline.stages as any[]) || [];
          const matchedStage = stages.find((s: any) => s.pipedriveId === deal.stage_id);
          stageId = (matchedStage || stages.find((s: any) => s.isDefault) || stages[0])?.id || stageId;
        }
      }

      return this.prisma.lead.update({
        where: { id: existing.id },
        data: {
          title: deal.title || existing.title,
          value: deal.value ? Number(deal.value) : existing.value,
          contactId: contact.id,
          pipelineId,
          stageId,
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

    if (!contact) {
      contact = await this.prisma.contact.create({
        data: this.sanitize({
          tenantId,
          workspaceId,
          name: deal.title || 'Pipedrive Deal',
          phone: `pipedrive-deal-${deal.id}`,
          metadata: { pipedrivePersonId: null },
        }),
      });
    }

    const pipelines = await this.prisma.pipeline.findMany({
      where: { tenantId, workspaceId },
    });

    const matchedPipeline = pipelines.find((p) => {
      const stages = (p.stages as any[]) || [];
      return stages.some((s: any) => s.pipedriveId === deal.stage_id);
    });

    const pipeline = matchedPipeline || pipelines.find((p) => p.isDefault);
    if (!pipeline) return null;

    const stages = (pipeline.stages as any[]) || [];
    const matchedStage = stages.find((s: any) => s.pipedriveId === deal.stage_id);
    const stage = matchedStage || stages.find((s: any) => s.isDefault) || stages[0];

    if (!stage) return null;

    return this.prisma.lead.create({
      data: {
        tenantId,
        workspaceId,
        pipelineId: pipeline.id,
        stageId: stage.id,
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

  async createNote(tenantId: string, workspaceId: string, dealId: number, content: string) {
    const integration = await this.getIntegration(tenantId, workspaceId);
    if (!integration) throw new NotFoundException('Pipedrive not connected');

    const token = await this.getValidToken(integration);

    const response = await fetch(`${this.apiBase}/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deal_id: dealId,
        content,
        pin_on_deal: true,
      }),
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

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: integration.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
    });

    const response = await fetch('https://oauth.pipedrive.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
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
