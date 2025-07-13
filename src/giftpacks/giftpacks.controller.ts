// apps/api/src/giftpacks/giftpacks.controller.ts
import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GiftpacksService } from './giftpacks.service';
import { WalletAuthGuard } from '../auth/wallet.guard';

@ApiTags('Giftpacks')
@Controller('giftpacks')
export class GiftpacksController {
  constructor(private readonly giftpacksService: GiftpacksService) {}

  @Post(':id/lock')
  @UseGuards(WalletAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock a draft GiftPack on-chain' })
  @ApiParam({ name: 'id', description: 'UUID of the draft GiftPack' })
  @ApiOkResponse({
    description: 'Lock tx submitted; returns transaction hash and on-chain giftId',
    schema: { example: { txHash: '0xabc...', giftIdOnChain: 0 } },
  })
  async lock(@Param('id') id: string) {
    return this.giftpacksService.lockGift(id);
  }
}
