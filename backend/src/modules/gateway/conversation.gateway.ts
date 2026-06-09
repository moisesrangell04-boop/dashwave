import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface SseEvent {
  type: 'message:new' | 'conversation:updated' | 'conversation:new' | 'handler:changed';
  tenantId: string;
  conversationId?: string;
  data?: unknown;
}

@Injectable()
export class ConversationGateway {
  private readonly logger = new Logger(ConversationGateway.name);
  private readonly subjects = new Map<string, Subject<SseEvent>>();

  getSubjectForTenant(tenantId: string): Subject<SseEvent> {
    if (!this.subjects.has(tenantId)) {
      this.subjects.set(tenantId, new Subject<SseEvent>());
    }
    return this.subjects.get(tenantId)!;
  }

  removeSubject(tenantId: string) {
    this.subjects.delete(tenantId);
  }

  emitNewMessage(tenantId: string, conversationId: string, message: unknown) {
    this.subjects.get(tenantId)?.next({
      type: 'message:new',
      tenantId,
      conversationId,
      data: message,
    });
  }

  emitConversationUpdate(tenantId: string, conversation: unknown) {
    this.subjects.get(tenantId)?.next({
      type: 'conversation:updated',
      tenantId,
      data: conversation,
    });
  }

  emitConversationNew(tenantId: string, conversation: unknown) {
    this.subjects.get(tenantId)?.next({
      type: 'conversation:new',
      tenantId,
      data: conversation,
    });
  }

  emitHandlerChanged(tenantId: string, conversationId: string, handledBy: string) {
    this.subjects.get(tenantId)?.next({
      type: 'handler:changed',
      tenantId,
      conversationId,
      data: { handledBy },
    });
  }
}
