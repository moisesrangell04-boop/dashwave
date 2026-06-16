import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { CreateAgentDto, AIProvider } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async create(tenantId: string, workspaceId: string, dto: CreateAgentDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { maxAgents: true },
    });

    const existingCount = await this.prisma.aIAgent.count({
      where: { tenantId },
    });

    if (tenant && existingCount >= tenant.maxAgents) {
      throw new ConflictException('Maximum number of AI agents reached for this tenant');
    }

    const agent = await this.prisma.aIAgent.create({
      data: {
        tenantId,
        workspaceId,
        name: dto.name,
        description: dto.description,
        config: dto.config as any,
        triggers: dto.triggers as any,
      },
    });

    this.logger.log(`AI Agent "${agent.name}" created in tenant ${tenantId}`);

    return agent;
  }

  async findAll(tenantId: string, workspaceId: string) {
    const agents = await this.prisma.aIAgent.findMany({
      where: { tenantId, workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return agents.map((agent) => ({
      ...agent,
      config: typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config,
      triggers: typeof agent.triggers === 'string' ? JSON.parse(agent.triggers) : agent.triggers,
    }));
  }

  async findById(id: string, tenantId: string) {
    const agent = await this.prisma.aIAgent.findFirst({
      where: { id, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('AI Agent not found');
    }

    const conversationsCount = await this.prisma.conversation.count({
      where: { assignedAgentId: id, tenantId },
    });

    return {
      ...agent,
      config: typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config,
      triggers: typeof agent.triggers === 'string' ? JSON.parse(agent.triggers) : agent.triggers,
      stats: {
        conversationsHandled: agent.totalConversationsHandled,
        messagesSent: agent.totalMessagesSent,
        avgResponseTime: agent.avgResponseTime,
        satisfactionRate: agent.satisfactionRate,
        activeConversations: conversationsCount,
      },
    };
  }

  async update(id: string, tenantId: string, dto: UpdateAgentDto) {
    const agent = await this.prisma.aIAgent.findFirst({
      where: { id, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('AI Agent not found');
    }

    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.config !== undefined) {
      const existingConfig = typeof agent.config === 'string' ? JSON.parse(agent.config) : agent.config;
      data.config = { ...existingConfig, ...dto.config };
    }
    if (dto.triggers !== undefined) {
      const existingTriggers = typeof agent.triggers === 'string' ? JSON.parse(agent.triggers) : agent.triggers;
      data.triggers = { ...existingTriggers, ...dto.triggers };
    }

    return this.prisma.aIAgent.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string) {
    const agent = await this.prisma.aIAgent.findFirst({
      where: { id, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('AI Agent not found');
    }

    await this.prisma.aIAgent.delete({ where: { id } });

    this.logger.log(`AI Agent ${id} deleted from tenant ${tenantId}`);

    return { message: 'AI Agent deleted successfully' };
  }

  async activate(id: string, tenantId: string) {
    const agent = await this.prisma.aIAgent.findFirst({
      where: { id, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('AI Agent not found');
    }

    return this.prisma.aIAgent.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async deactivate(id: string, tenantId: string) {
    const agent = await this.prisma.aIAgent.findFirst({
      where: { id, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('AI Agent not found');
    }

    return this.prisma.aIAgent.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async testAgent(id: string, tenantId: string, message: string) {
    const agent = await this.prisma.aIAgent.findFirst({
      where: { id, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('AI Agent not found');
    }

    const response = await this.callAIProvider(agent.config as any, message, []);

    return {
      agentId: id,
      agentName: agent.name,
      message,
      response,
    };
  }

  async getStats(id: string, tenantId: string) {
    const agent = await this.prisma.aIAgent.findFirst({
      where: { id, tenantId },
    });

    if (!agent) {
      throw new NotFoundException('AI Agent not found');
    }

    const activeConversations = await this.prisma.conversation.count({
      where: { assignedAgentId: id, tenantId, status: { in: ['active', 'pending', 'waiting'] } },
    });

    const recentMessages = await this.prisma.message.count({
      where: { aiAgentId: id, tenantId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    });

    const messagesByDay = await this.prisma.message.groupBy({
      by: ['createdAt'],
      where: { aiAgentId: id, tenantId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _count: { id: true },
    });

    return {
      general: {
        conversationsHandled: agent.totalConversationsHandled,
        messagesSent: agent.totalMessagesSent,
        avgResponseTime: agent.avgResponseTime,
        satisfactionRate: agent.satisfactionRate,
        activeConversations,
        lastActiveAt: agent.lastActiveAt,
      },
      daily: {
        messagesLast24h: recentMessages,
      },
      messagesByDay,
    };
  }

  async processMessage(agentId: string, message: string, conversationId: string) {
    const agent = await this.prisma.aIAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent || !agent.isActive) {
      this.logger.warn(`Agent ${agentId} not found or inactive`);
      return null;
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: { content: true, direction: true, origin: true },
        },
      },
    });

    if (!conversation) {
      this.logger.warn(`Conversation ${conversationId} not found`);
      return null;
    }

    const conversationHistory = conversation.messages.reverse().map((msg) => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const startTime = Date.now();

    try {
      const aiResponse = await this.callAIProvider(agent.config as any, message, conversationHistory);

      const responseTime = Date.now() - startTime;

      const existingMessages = agent.totalMessagesSent;
      const existingConversations = agent.totalConversationsHandled;
      const existingAvgTime = agent.avgResponseTime;

      const newAvgResponseTime = existingMessages > 0
        ? (existingAvgTime * existingMessages + responseTime) / (existingMessages + 1)
        : responseTime;

      await this.prisma.aIAgent.update({
        where: { id: agentId },
        data: {
          totalMessagesSent: { increment: 1 },
          totalConversationsHandled: existingConversations === 0 ? { increment: 1 } : undefined,
          avgResponseTime: newAvgResponseTime,
          lastActiveAt: new Date(),
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { lastActivityAt: new Date() },
      });

      return aiResponse;
    } catch (error) {
      this.logger.error(`AI provider call failed for agent ${agentId}: ${error.message}`);

      await this.prisma.aIAgent.update({
        where: { id: agentId },
        data: { lastActiveAt: new Date() },
      });

      return null;
    }
  }

  private async callAIProvider(
    config: {
      provider: AIProvider;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      personality?: string;
      customInstructions?: string;
      language?: string;
    },
    message: string,
    history: { role: string; content: string }[],
  ): Promise<string> {
    const provider = config.provider || AIProvider.openai;
    const temperature = config.temperature ?? 0.7;
    const maxTokens = config.maxTokens ?? 1024;

    const systemPrompt = this.buildSystemPrompt(config);

    switch (provider) {
      case AIProvider.openai:
        return this.callOpenAI(systemPrompt, message, history, config.model || 'gpt-4o', temperature, maxTokens);
      case AIProvider.anthropic:
        return this.callAnthropic(systemPrompt, message, history, config.model || 'claude-3-haiku-20240307', temperature, maxTokens);
      case AIProvider.gemini:
        return this.callGemini(systemPrompt, message, history, config.model || 'gemini-pro', temperature, maxTokens);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }

  private buildSystemPrompt(config: {
    systemPrompt?: string;
    personality?: string;
    customInstructions?: string;
    language?: string;
  }): string {
    const personality = config.personality || 'friendly';

    const personalityPrompts: Record<string, string> = {
      friendly: 'Be warm, approachable, and helpful. Use a conversational tone and show empathy.',
      professional: 'Be formal, concise, and business-appropriate. Maintain professionalism at all times.',
      casual: 'Be relaxed and informal. Use everyday language and be relatable.',
      formal: 'Be highly formal and courteous. Use proper business language and structure.',
      custom: '',
    };

    const parts: string[] = [
      config.systemPrompt || 'You are a helpful AI support agent for Wave CRM. Assist customers with their inquiries accurately and efficiently.',
      personalityPrompts[personality] || personalityPrompts.friendly,
    ];

    if (config.customInstructions) {
      parts.push(config.customInstructions);
    }

    if (config.language) {
      parts.push(`Always respond in ${config.language}.`);
    }

    return parts.join('\n\n');
  }

  private async callOpenAI(
    systemPrompt: string,
    message: string,
    history: { role: string; content: string }[],
    model: string,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('ai.openai.apiKey');
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: message },
    ];

    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.openai.com/v1/chat/completions',
        { model, messages, temperature, max_tokens: maxTokens },
        {
          timeout: 30000,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data.choices[0]?.message?.content || '';
  }

  private async callAnthropic(
    systemPrompt: string,
    message: string,
    history: { role: string; content: string }[],
    model: string,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('ai.anthropic.apiKey');
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const messages = [
      ...history.map((msg) => ({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content })),
      { role: 'user', content: message },
    ];

    const response = await firstValueFrom(
      this.httpService.post(
        'https://api.anthropic.com/v1/messages',
        {
          model,
          system: systemPrompt,
          messages,
          temperature,
          max_tokens: maxTokens,
        },
        {
          timeout: 30000,
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data.content[0]?.text || '';
  }

  private async callGemini(
    systemPrompt: string,
    message: string,
    history: { role: string; content: string }[],
    model: string,
    temperature: number,
    maxTokens: number,
  ): Promise<string> {
    const apiKey = this.configService.get<string>('ai.gemini.apiKey');
    if (!apiKey) throw new Error('Gemini API key not configured');

    const contents = [
      ...history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const response = await firstValueFrom(
      this.httpService.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        },
        {
          timeout: 30000,
          params: { key: apiKey },
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
