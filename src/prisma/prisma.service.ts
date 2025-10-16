import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        super({
            log: ['query', 'info', 'warn', 'error'],
        });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Cannot clean database in production');
        }

        // Delete all records in correct order to avoid foreign key constraints
        await this.deviceToken.deleteMany();
        await this.notification.deleteMany();
        await this.message.deleteMany();
        await this.chatMember.deleteMany();
        await this.chat.deleteMany();
        await this.match.deleteMany();
        await this.listing.deleteMany();
        await this.user.deleteMany();
    }
}