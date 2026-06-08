export interface MessageQueuePort {
  publish<T>(queue: string, message: T): Promise<void>;
  consume<T>(queue: string, handler: (message: T) => Promise<void>): Promise<void>;
  schedule<T>(queue: string, message: T, delayMs: number): Promise<void>;
  remove(queue: string, jobId: string): Promise<void>;
}
