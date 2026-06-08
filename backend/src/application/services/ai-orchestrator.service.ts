import { AIAgent, AIConfigProps } from '../../@core/entities/ai-agent';
import { AIProviderPort, AICompletionMessage } from '../ports/infrastructure/ai-provider.port';

export class AIOrchestratorService {
  constructor(private readonly aiProvider: AIProviderPort) {}

  buildSystemPrompt(agent: AIAgent, companyInfo?: string): string {
    const config = agent.getProps().config;
    const parts: string[] = [];

    parts.push(config.systemPrompt);

    if (config.personality === 'friendly') {
      parts.push('Seja amigável, caloroso e acolhedor. Use um tom informal mas profissional.');
    } else if (config.personality === 'professional') {
      parts.push('Mantenha um tom profissional e formal. Seja direto e objetivo.');
    } else if (config.personality === 'casual') {
      parts.push('Use um tom casual e descontraído. Seja natural como em uma conversa entre amigos.');
    } else if (config.personality === 'formal') {
      parts.push('Mantenha um tom formal e respeitoso. Use linguagem cortês.');
    }

    if (config.customInstructions) {
      parts.push(config.customInstructions);
    }

    if (config.useCompanyInfo && companyInfo) {
      parts.push(`Informações da empresa:\n${companyInfo}`);
    }

    if (config.language) {
      parts.push(`Responda sempre em ${config.language}.`);
    }

    if (config.fallbackToHuman) {
      parts.push('Se não souber responder ou o cliente estiver insatisfeito, informe que um atendente humano vai assumir.');
    }

    return parts.join('\n\n');
  }

  async shouldHandleMessage(
    agent: AIAgent,
    messageContent: string,
  ): Promise<boolean> {
    const triggers = agent.getProps().triggers;

    if (triggers.type === 'all_messages') return true;
    if (triggers.type === 'unassigned') return true;

    if (triggers.type === 'keywords' && triggers.keywords) {
      return triggers.keywords.some((keyword) =>
        messageContent.toLowerCase().includes(keyword.toLowerCase()),
      );
    }

    return false;
  }

  async generateResponse(
    agent: AIAgent,
    messageHistory: AICompletionMessage[],
    userMessage: string,
    companyInfo?: string,
  ): Promise<string> {
    const config = agent.getProps().config;
    const systemPrompt = this.buildSystemPrompt(agent, companyInfo);

    const messages: AICompletionMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(config.useChatHistory ? messageHistory.slice(-(config.contextLimit ?? 20)) : []),
      { role: 'user', content: userMessage },
    ];

    const result = await this.aiProvider.complete(messages, {
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      provider: config.provider,
    });

    return result.content;
  }
}
