import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber, Contract } from 'ethers';

describe('GiftEscrow', function () {
  let owner: any;
  let recipient: any;
  let other: any;
  let giftEscrow: any;
  let erc20: Contract;
  const DAY = 24 * 60 * 60;

  beforeEach(async function () {
    [owner, recipient, other] = await ethers.getSigners();

    // Deploy ERC20 token (OpenZeppelin preset)
    const ERC20 = await ethers.getContractFactory('ERC20PresetMinterPauser', owner);
    erc20 = await ERC20.deploy('TestToken', 'TTK');
    await erc20.deployed();

    // Deploy GiftEscrow
    const Gift = await ethers.getContractFactory('GiftEscrow', owner);
    giftEscrow = await Gift.deploy();
    await giftEscrow.deployed();

    // Mint & approve
    await erc20.mint(owner.address, ethers.utils.parseUnits('100', 18));
    await erc20.approve(giftEscrow.address, ethers.utils.parseUnits('100', 18));
  });

  it('escrows ERC-20 tokens and emits GiftSent', async function () {
    const amount = ethers.utils.parseUnits('10', 18);
    const tx = await giftEscrow.sendGift(
      erc20.address,
      0,
      amount,
      recipient.address,
      7
    );
    const receipt = await tx.wait();

    const event = receipt.events?.find(e => e.event === 'GiftSent');
    expect(event?.args?.giftId).to.equal(BigNumber.from(0));
    expect(event?.args?.sender).to.equal(owner.address);
    expect(event?.args?.recipient).to.equal(recipient.address);

    const balance = await erc20.balanceOf(giftEscrow.address);
    expect(balance).to.equal(amount);
  });

  it('allows recipient to claim before expiry', async function () {
    const amount = ethers.utils.parseUnits('5', 18);
    await giftEscrow.sendGift(erc20.address, 0, amount, recipient.address, 7);
    const before = await erc20.balanceOf(recipient.address);

    await giftEscrow.connect(recipient).claimGift(0);
    const after = await erc20.balanceOf(recipient.address);
    expect(after.sub(before)).to.equal(amount);
  });

  it('reverts if non-recipient tries to claim', async function () {
    await giftEscrow.sendGift(erc20.address, 0, ethers.utils.parseUnits('1', 18), recipient.address, 7);
    await expect(
      giftEscrow.connect(other).claimGift(0)
    ).to.be.revertedWith('Not recipient');
  });

  it('refunds expired gifts to sender', async function () {
    const amount = ethers.utils.parseUnits('3', 18);
    await giftEscrow.sendGift(erc20.address, 0, amount, recipient.address, 1);

    // Fast-forward 2 days
    await ethers.provider.send('evm_increaseTime', [2 * DAY]);
    await ethers.provider.send('evm_mine');

    const before = await erc20.balanceOf(owner.address);
    await giftEscrow.refundExpired([0]);
    const after = await erc20.balanceOf(owner.address);
    expect(after.sub(before)).to.equal(amount);
  });

  it('prevents double claim or double refund', async function () {
    const amount = ethers.utils.parseUnits('2', 18);
    await giftEscrow.sendGift(erc20.address, 0, amount, recipient.address, 7);
    await giftEscrow.connect(recipient).claimGift(0);
    await expect(
      giftEscrow.connect(recipient).claimGift(0)
    ).to.be.revertedWith('Already claimed');

    // Send second gift for refund
    await giftEscrow.sendGift(erc20.address, 0, amount, recipient.address, 1);
    await ethers.provider.send('evm_increaseTime', [2 * DAY]);
    await ethers.provider.send('evm_mine');
    await giftEscrow.refundExpired([1]);
    await expect(
      giftEscrow.refundExpired([1])
    ).to.not.emit(giftEscrow, 'GiftExpired');
  });
});
