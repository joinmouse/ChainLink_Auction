// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// 引入OpenZeppelin的ERC721接口（用于操作NFT）
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract SimpleNftAuction {
    // 拍卖信息结构体（只保留最核心的字段）
    struct Auction {
        address seller;        // 卖家地址
        uint256 startTime;     // 开始时间（时间戳）
        uint256 endTime;       // 结束时间（时间戳）
        uint256 startPrice;    // 起始价格（单位：wei，ETH的最小单位）
        bool ended;            // 拍卖是否已结束
        
        address nftContract;   // NFT合约地址
        uint256 tokenId;       // NFT的唯一ID
        
        address highestBidder; // 当前最高出价者
        uint256 highestBid;    // 当前最高出价（单位：wei）
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
        // 简单校验：参数不能为0
        require(nftContract != address(0), "NFT合约地址无效");
        require(duration > 0, "拍卖时间不能为0");
        require(startPrice > 0, "起始价格不能为0");

        // 校验：卖家必须是NFT的所有者（防止别人拍卖不属于自己的NFT）
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "你不是NFT的所有者");

        // 计算拍卖结束时间：开始时间（现在）+ 持续时间
        uint256 endTime = block.timestamp + duration;

        // 初始化拍卖信息
        auctions[nextAuctionId] = Auction({
            seller: msg.sender,
            startTime: block.timestamp,
            endTime: endTime,
            startPrice: startPrice,
            ended: false,
            nftContract: nftContract,
            tokenId: tokenId,
            highestBidder: address(0), // 初始无出价者
            highestBid: 0              // 初始无出价
        });

        // 将NFT从卖家转移到合约（托管，防止卖家中途转走）
        nft.transferFrom(msg.sender, address(this), tokenId);

        // 拍卖ID自增（下次创建用新ID）
        nextAuctionId++;
    }


    // -------------------------- 买家功能 --------------------------
    /**
     * 功能：对某个拍卖出价（只能用ETH）
     * 参数：auctionId：要出价的拍卖ID
     */
    function bid(uint256 auctionId) external payable {
        // 从映射中取出拍卖信息（用storage关键字，修改会同步到映射）
        Auction storage auction = auctions[auctionId];

        // 简单校验：
        require(!auction.ended, "拍卖已结束");
        require(block.timestamp < auction.endTime, "拍卖时间已过");
        require(msg.value > auction.highestBid, "出价必须高于当前最高价");
        require(msg.value >= auction.startPrice, "出价不能低于起始价");

        // 更新最高出价者和出价
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;
    }


    // -------------------------- 结束拍卖 --------------------------
    /**
     * 功能：结束拍卖（任何人都可以调用，只要时间到了）
     * 参数：auctionId：要结束的拍卖ID
     */
    function endAuction(uint256 auctionId) external {
        Auction storage auction = auctions[auctionId];

        // 校验：拍卖未结束，且时间已到
        require(!auction.ended, "拍卖已结束");
        require(block.timestamp >= auction.endTime, "拍卖时间未到");

        // 标记拍卖结束
        auction.ended = true;

        // 情况1：有最高出价者（成交）
        if (auction.highestBidder != address(0)) {
            // 1. 给卖家转ETH（拍卖所得）
            (bool success, ) = auction.seller.call{value: auction.highestBid}("");
            require(success, "转ETH给卖家失败");

            // 2. 给最高出价者转NFT
            IERC721(auction.nftContract).transferFrom(
                address(this), 
                auction.highestBidder, 
                auction.tokenId
            );
        } 
        // 情况2：无出价者（NFT返还卖家）
        else {
            IERC721(auction.nftContract).transferFrom(
                address(this), 
                auction.seller, 
                auction.tokenId
            );
        }
    }

    // 允许合约接收ETH（因为买家出价会转ETH到合约）
    receive() external payable {}
}