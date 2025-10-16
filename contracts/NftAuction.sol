// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NftAuction {
    // 拍卖信息结构体
    struct Auction {
        // 基础信息
        address seller; // 卖家
        uint256 duration;  // 持续拍卖时间
        uint256 startPrice;  // 起始价格
        uint256 startTime;   // 开始时间
        bool ended;          // 是否结束
        // nft信息
        address nftContract;    // nft合约地址
        uint256 tokenId;        // nft Id
        address tokenAddress;   // token地址
        // 拍卖状态
        address highestBidder;  // 最高出价
        uint256 highestBid;     // 最高价格
    }

    // 用映射存储所有拍卖：拍卖ID => 拍卖信息
    mapping(uint256 => Auction) public auctions;
    // 记录下一个拍卖的ID（从0开始自增）
    uint256 public nextAuctionId = 0;


    // -------------------------- 卖家功能 --------------------------
    /**
     * 功能：创建一个新的NFT拍卖
     * 参数：
     * - nftContract：NFT所在的合约地址
     * - tokenId：要拍卖的NFT的ID
     * - duration：拍卖持续时间（秒）
     * - startPrice：起始价格（ETH，单位wei）
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        uint256 duration,
        uint256 startPrice
    ) external {
        require(nftContract != address(0), "NFT合约地址无效");
        require(duration > 0, "拍卖时间不能为0");
        require(startPrice > 0, "起始价格不能为0");

        // 校验：卖家必须是NFT的所有者(防止别人拍卖不属于自己的NFT)
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "你不是NFT的所有者");
    }
}
