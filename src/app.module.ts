import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from 'prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { AssetsModule } from './assets/assets.module';
import { HealthController } from './health/health.controller';
import { GiftpacksController } from './giftpacks/giftpacks.controller';

@Module({
  imports: [AuthModule, PrismaModule, AssetsModule, ConfigModule.forRoot({ isGlobal: true }),
  CacheModule.register({ ttl: 60 }),   ],
  controllers: [AppController, HealthController, GiftpacksController],
  providers: [AppService],
})
export class AppModule { }
