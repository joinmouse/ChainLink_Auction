// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8;

import "./NftAuction.sol";

contract NftAuctionV2 is NftAuction {
    // 新增功能：获取拍卖的剩余时间
    function getRemainingTime(uint256 auctionId) external view returns (uint256) {
        Auction storage auction = auctions[auctionId];
        if (block.timestamp >= auction.endTime) {
            return 0; // 拍卖已结束
        } else {
            return auction.endTime - block.timestamp; // 返回剩余时间
        }
    }
}