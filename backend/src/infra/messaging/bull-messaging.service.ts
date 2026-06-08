import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { MessageQueuePort } from '../../application/ports/infrastructure/messaging.port';

@Injectable()
export class BullMessagingService implements MessageQueuePort {
  private readonly logger = new Logger(BullMessagingService.name);

  constructor(
    @InjectQueue('default') private readonly defaultQueue: Queue,
  ) {}

  async publish<T>(queue: string, message: T): Promise<void> {
    await this.defaultQueue.add(queue, message, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    this.logger.debug(`Message published to queue: ${queue}`);
  }

  async consume<T>(queue: string, handler: (message: T) => Promise<void>): Promise<void> {
    this.defaultQueue.process(queue, async (job) => {
      try {
        await handler(job.data as T);
        return Promise.resolve();
      } catch (error) {
        this.logger.error(`Error processing job ${job.id} in queue ${queue}: ${error.message}`);
        throw error;
      }
    });
  }

  async schedule<T>(queue: string, message: T, delayMs: number): Promise<void> {
    await this.defaultQueue.add(queue, message, {
      delay: delayMs,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    this.logger.debug(`Message scheduled in queue: ${queue} with delay: ${delayMs}ms`);
  }

  async remove(queue: string, jobId: string): Promise<void> {
    const job = await this.defaultQueue.getJob(jobId);
    if (job) {
      await job.remove();
      this.logger.debug(`Job ${jobId} removed from queue: ${queue}`);
    }
  }
}
