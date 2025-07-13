// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title GiftEscrow
 * @dev Escrows ERC-20 / ERC-721 tokens as gifts until claimed or expired
 */
contract GiftEscrow {
    struct Gift {
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
        address sender;
        address recipient;
        uint256 expiryTimestamp;
        bool claimed;
    }

    mapping(uint256 => Gift) public gifts;
    uint256 public nextGiftId;

    event GiftSent(uint256 indexed giftId, address indexed sender, address indexed recipient);
    event GiftClaimed(uint256 indexed giftId, address indexed claimer);
    event GiftExpired(uint256 indexed giftId);

    /**
     * @dev Sender escrows a gift. Supports ERC-20 (amount > 0) or ERC-721 (tokenId > 0).
     * @param tokenAddress Address of ERC-20 or ERC-721 contract
     * @param tokenId Token ID for ERC-721, or 0 for ERC-20
     * @param amount Amount for ERC-20, or 0 for ERC-721
     * @param recipient Recipient address eligible to claim
     * @param expiryDays Number of days until gift expires
     */
    function sendGift(
        address tokenAddress,
        uint256 tokenId,
        uint256 amount,
        address recipient,
        uint256 expiryDays
    ) external {
        require(recipient != address(0), "Invalid recipient");
        require(expiryDays > 0, "Expiry must be > 0");

        uint256 giftId = nextGiftId++;
        Gift storage g = gifts[giftId];
        g.tokenAddress = tokenAddress;
        g.tokenId = tokenId;
        g.amount = amount;
        g.sender = msg.sender;
        g.recipient = recipient;
        g.expiryTimestamp = block.timestamp + (expiryDays * 1 days);
        g.claimed = false;

        if (tokenId > 0) {
            // ERC-721
            IERC721(tokenAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        } else {
            // ERC-20
            require(amount > 0, "Amount must be > 0 for ERC20");
            IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        }

        emit GiftSent(giftId, msg.sender, recipient);
    }

    /**
     * @dev Recipient claims an escrowed gift before expiry.
     * @param giftId ID of the gift to claim
     */
    function claimGift(uint256 giftId) external {
        Gift storage g = gifts[giftId];
        require(!g.claimed, "Gift already claimed");
        require(msg.sender == g.recipient, "Not the recipient");
        require(block.timestamp <= g.expiryTimestamp, "Gift expired");

        g.claimed = true;

        if (g.tokenId > 0) {
            // ERC-721
            IERC721(g.tokenAddress).safeTransferFrom(address(this), msg.sender, g.tokenId);
        } else {
            // ERC-20
            require(g.amount > 0, "No ERC20 amount");
            IERC20(g.tokenAddress).transfer(msg.sender, g.amount);
        }

        emit GiftClaimed(giftId, msg.sender);
    }

    /**
     * @dev Refund expired gifts back to original senders.
     * @param giftIds Array of gift IDs to refund
     */
    function refundExpired(uint256[] calldata giftIds) external {
        for (uint256 i = 0; i < giftIds.length; i++) {
            uint256 giftId = giftIds[i];
            Gift storage g = gifts[giftId];

            if (g.claimed || block.timestamp <= g.expiryTimestamp) {
            continue; // Skip already claimed or not yet expired
            }

            g.claimed = true; // Mark as refunded to prevent re-entrancy

            if (g.tokenId > 0) {
            // ERC-721
            IERC721(g.tokenAddress).safeTransferFrom(address(this), g.sender, g.tokenId);
            } else if (g.amount > 0) {
            // ERC-20
            IERC20(g.tokenAddress).transfer(g.sender, g.amount);
            }

            emit GiftExpired(giftId);
        }
    }
}
