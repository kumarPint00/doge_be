
// apps/api/src/giftpacks/giftpacks.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonRpcProvider, Wallet, Contract } from 'ethers';
import { PrismaService } from 'prisma/prisma.service';
import GiftEscrowArtifact from './GiftEscrow.json';

const Prisma =  PrismaService.getPrismaClient();

@Injectable()
export class GiftpacksService {
  private provider: JsonRpcProvider;
  private signer: Wallet;
  private escrowAddress: string;

  constructor(
    private config: ConfigService,
  ) {
    this.provider = new JsonRpcProvider(
      this.config.get<string>('SEPOLIA_BASE_RPC'),
    );
    const deployerPrivateKey = this.config.get<string>('DEPLOYER_PRIVATE_KEY');
    if (!deployerPrivateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY is not set in configuration');
    }
    this.signer = new Wallet(
      deployerPrivateKey,
      this.provider,
    );
    const escrowAddress = this.config.get<string>('GIFT_ESCROW_ADDRESS');
    if (!escrowAddress) {
      throw new Error('GIFT_ESCROW_ADDRESS is not set in configuration');
    }
    this.escrowAddress = escrowAddress;
  }

  async lockGift(id: string) {
    const pack = await this.prisma.giftPack.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!pack || pack.status !== 'DRAFT') {
      throw new NotFoundException('Draft GiftPack not found');
    }

    const contract = new Contract(
      this.escrowAddress,
      GiftEscrowArtifact.abi,
      this.signer,
    );

    // MVP: assume single item
    const item = pack.items[0];
    const recipient = pack.recipientHash; // stored as keccak hash or actual address based on model
    const expiryDays = Math.ceil(
      (pack.expiry.getTime() - Date.now()) / (24 * 3600 * 1000),
    );

    const tx = await contract.sendGift(
      item.contract,
      item.tokenId || 0,
      item.amount || 0,
      recipient,
      expiryDays,
    );
    const receipt = await tx.wait();
    const event = receipt.events?.find((e) => e.event === 'GiftSent');
    const giftIdOnChain = event?.args?.giftId.toNumber();

    await this.prisma.giftPack.update({
      where: { id },
      data: { status: 'LOCKED', giftIdOnChain },
    });

    return { txHash: receipt.transactionHash, giftIdOnChain };
  }
}
