import { createClient, RedisClientType } from 'redis';
import { EventEmitter } from 'events';

export interface JobData {
  id: string;
  task: string;
  data: any;
  retries?: number;
  runAt?: number; // Timestamp when the job should be run
}

export type JobCallback = (jobData: JobData) => Promise<void>;

export default class RedisJobQueue extends EventEmitter {
  private client: RedisClientType;
  private queueName: string;
  private processingQueueName: string;
  private deadLetterQueueName: string;
  private maxRetries: number;
  private retryDelay: number;
  private isProcessing: boolean = false;
  private processingInterval: number;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectInterval: number = 5000; // 5 seconds
  private jobCallback: JobCallback | null = null;

  constructor(queueName: string, maxRetries: number = 3, retryDelay: number = 1000, processingInterval: number = 1000) {
    super();
    this.queueName = queueName;
    this.processingQueueName = `${queueName}:processing`;
    this.deadLetterQueueName = `${queueName}:deadletter`;
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
    this.processingInterval = processingInterval;
    this.client = this.createRedisClient();
  }


  private createRedisClient(): RedisClientType {
    const client = createClient({
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection failed');
          }
          return Math.min(retries * 100, 3000);
        }
      }
    });

    client.on('error', (err) => {
      console.error('Redis client error:', err);
      this.emit('error', err);
    });

    client.on('connect', () => {
      console.log('Redis client connected');
      this.emit('connect');
      this.resumeProcessingIfNeeded();
    });

    client.on('reconnecting', () => {
      console.log('Redis client reconnecting');
      this.emit('reconnecting');
    });

    client.on('end', () => {
      console.log('Redis client connection closed');
      this.emit('end');
      this.scheduleReconnect();
    });

    return client as RedisClientType;
  }


  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (!this.client.isOpen) {
      this.reconnectTimeout = setTimeout(() => {
        console.log('Attempting to reconnect to Redis...');
        this.connect().catch((err) => {
          console.error('Failed to reconnect:', err);
          this.scheduleReconnect();
        });
      }, this.reconnectInterval);
    }
  }

  async connect(): Promise<void> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  
  async disconnect(): Promise<void> {
    this.stopProcessing();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        if (!this.client.isOpen) {
          await this.connect();
        }
        return await operation();
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
        lastError = error as Error;
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    throw new Error(`Operation failed after ${this.maxRetries} attempts. Last error: ${lastError?.message}`);
  }

  async enqueue(jobData: JobData, retries = 5): Promise<void> {
    if (!jobData.retries) {
      jobData.retries = retries;
    }
    const score = jobData.runAt || Date.now();
    await this.withRetry(async () => {
      await this.client.zAdd(this.queueName, {
        score,
        value: JSON.stringify(jobData)
      });
    });
    this.emit('jobEnqueued', jobData);
  }

  private async moveJobToProcessing(): Promise<JobData | null> {
    const now = Date.now();
    return await this.withRetry(async () => {
      const result = await this.client.eval(`
        local job = redis.call('ZRANGEBYSCORE', KEYS[1], '-inf', ARGV[1], 'LIMIT', 0, 1)
        if #job > 0 then
          redis.call('ZREM', KEYS[1], job[1])
          redis.call('ZADD', KEYS[2], ARGV[1], job[1])
          return job[1]
        end
        return nil
      `, {
        keys: [this.queueName, this.processingQueueName],
        arguments: [now.toString()]
      }) as string | null;
      
      if (result) {
        return JSON.parse(result) as JobData;
      }
      return null;
    });
  }

  private async finishJob(jobData: JobData): Promise<void> {
    await this.withRetry(async () => {
      await this.client.zRem(this.processingQueueName, JSON.stringify(jobData));
    });
  }

  async getQueueLength(): Promise<number> {
    return await this.withRetry(() => this.client.zCard(this.queueName));
  }

  startProcessing(callback: JobCallback): void {
    if (this.isProcessing) {
      console.warn('Job processing is already running.');
      return;
    }

    this.isProcessing = true;
    this.jobCallback = callback;
    this.processJobs();
  }

  stopProcessing(): void {
    this.isProcessing = false;
    this.jobCallback = null;
  }

  private async processJobs(): Promise<void> {
    while (this.isProcessing && this.jobCallback) {
      try {
        const job = await this.moveJobToProcessing();
        if (job) {
          try {
            await this.jobCallback(job);
            await this.finishJob(job);
            this.emit('jobProcessed', job);
          } catch (error) {
            console.error('Job processing failed:', error);
            if (job.retries && (job.retries || 0) > 0) {
              job.retries--;
              job.runAt = Date.now() + this.retryDelay; // Delay retry
              await this.enqueue(job);
              await this.finishJob(job);
              console.log(`Job ${job.id} requeued. Remaining retries: ${job.retries}`);
              this.emit('jobRetried', job);
            } else {
              console.error(`Job ${job.id} failed after all retry attempts. Move to dead letter queue.`);
              await this.moveToDeadLetterQueue(job);
              this.emit('jobFailed', job);
            }
          }
        } else {
          // No jobs ready, wait for the next interval
          await new Promise(resolve => setTimeout(resolve, this.processingInterval));
        }
      } catch (error) {
        console.error('Error in job processing loop:', error);
        // Wait before retrying to avoid tight loop on persistent errors
        await new Promise(resolve => setTimeout(resolve, this.processingInterval));
      }
    }
  }

  private resumeProcessingIfNeeded(): void {
    if (this.isProcessing && this.jobCallback && !this.client.isOpen) {
      console.log('Resuming job processing after reconnection');
      this.processJobs();
    }
  }


  async recoverInProgressJobs(): Promise<void> {
    const now = Date.now();
    const jobs = await this.client.zRangeByScore(this.processingQueueName, '-inf', now);
    for (const jobString of jobs) {
      const job = JSON.parse(jobString) as JobData;
      console.log(`Recovering job ${job.id}`);
      await this.enqueue(job);
      await this.client.zRem(this.processingQueueName, jobString);
    }
  }

  private async moveToDeadLetterQueue(job: JobData): Promise<void> {
    await this.client.zAdd(this.deadLetterQueueName, {
      score: Date.now(), // Add timestamp for sorting
      value: JSON.stringify(job),
    });
  }

  async replayDeadLetterQueue(callback: JobCallback): Promise<void> {
    const jobs = await this.client.zRangeByScore(this.deadLetterQueueName, '-inf', '+inf');
    for (const jobString of jobs) {
      const job = JSON.parse(jobString) as JobData;
      job.retries = this.maxRetries;
      await this.enqueue(job);
      await this.client.zRem(this.deadLetterQueueName, jobString);
    }
  }
}
