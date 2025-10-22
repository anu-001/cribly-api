import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor() {
        super({
            log: ['error', 'warn'],
            errorFormat: 'pretty',
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Database connected successfully');
        } catch (error) {
            this.logger.error('❌ Database connection failed', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('📊 Database disconnected');
    }

    /**
     * Clean database - only for testing purposes
     */
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot clean database in production environment');
        }

        const models = Reflect.ownKeys(this).filter(
            (key) =>
                typeof key === 'string' &&
                !key.startsWith('_') &&
                !key.startsWith('$')
        );

        return Promise.all(
            models.map((modelKey) => {
                const model = this[modelKey as string];
                if (model && typeof model.deleteMany === 'function') {
                    return model.deleteMany();
                }
            }),
        );
    }

    /**
     * Enable query logging in development
     */
    enableQueryLogging() {
        if (process.env.NODE_ENV === 'development') {
            this.$on('query' as never, (e: any) => {
                this.logger.debug(`Query: ${e.query}`);
                this.logger.debug(`Duration: ${e.duration}ms`);
            });
        }
    }
}
