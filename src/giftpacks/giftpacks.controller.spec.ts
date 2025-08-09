import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GiftpacksController } from './giftpacks.controller';
import { GiftpacksService } from './giftpacks.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('GiftpacksController', () => {
  let controller: GiftpacksController;

  beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [GiftpacksController],
        providers: [
          GiftpacksService,
          {
            provide: ConfigService,
            useValue: {
              get: (key: string) => {
                switch (key) {
                  case 'SEPOLIA_BASE_RPC':
                    return 'http://localhost:8545';
                  case 'DEPLOYER_PRIVATE_KEY':
                    return '0x' + '1'.repeat(64);
                  case 'GIFT_ESCROW_ADDRESS':
                    return '0x0000000000000000000000000000000000000001';
                  default:
                    return null;
                }
              },
            },
          },
          { provide: PrismaService, useValue: { giftpack: { findUnique: jest.fn(), update: jest.fn() } } },
        ],
      }).compile();

    controller = module.get<GiftpacksController>(GiftpacksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
