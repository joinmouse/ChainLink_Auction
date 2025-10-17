// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.28;

// 引入可升级合约核心依赖
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";


contract NftAuction is Initializable, UUPSUpgradeable {
    // 拍卖信息结构体
    struct Auction {
        // 基础信息
        address seller; // 卖家
        uint256 duration;  // 持续拍卖时间
        uint256 startPrice;  // 起始价格
        uint256 startTime;   // 开始时间
        uint256 endTime;     // 结束时间
        bool ended;          // 是否结束
        // nft信息
        address nftContract;    // nft合约地址
        uint256 tokenId;        // nft Id
        address tokenAddress;   // token地址
        // 拍卖状态
        address highestBidder;  // 最高出价
        uint256 highestBid;     // 最高价格
    }

    address public admin;  // 新增管理员，用于控制升级权限
    // 用映射存储所有拍卖：拍卖ID => 拍卖信息
    mapping(uint256 => Auction) public auctions;
    // 记录下一个拍卖的ID（从0开始自增）
    uint256 public nextAuctionId;

    // 初始化函数（替代构造函数）
    function initialize() public initializer {
        admin = msg.sender;  // 设置合约部署者为管理员
        nextAuctionId = 0;   // 初始化拍卖ID为0
    }

    // 实现UUPS升级权限控制（必须重写的函数）
    function _authorizeUpgrade(address) internal override {
        require(msg.sender == admin, "Only admin can upgrade"); // 仅管理员可升级
    }

    // -------------------------- 卖家功能 --------------------------
    /**
     * 功能：创建一个新的NFT拍卖(挂单)
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
        require(nftContract != address(0), unicode"NFT合约地址无效");
        require(duration > 0, unicode"拍卖时间不能为0");
        require(startPrice > 0, unicode"起始价格不能为0");

        // 校验：卖家必须是NFT的所有者(防止别人拍卖不属于自己的NFT)
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, unicode"你不是NFT的所有者");

        // 计算拍卖结束时间：开始时间（现在）+ 持续时间
        uint256 endTime = block.timestamp + duration;

        // 初始化拍卖信息
        auctions[nextAuctionId] = Auction({
            seller: msg.sender,                  // 1. 卖家
            duration: duration,                  // 2. 持续时间
            startPrice: startPrice,              // 3. 起始价格
            startTime: block.timestamp,          // 4. 开始时间
            endTime: endTime,                    // 5. 结束时间
            ended: false,                        // 6. 是否结束
            nftContract: nftContract,            // 7. NFT合约地址
            tokenId: tokenId,                    // 8. NFT ID
            tokenAddress: address(0),            // 9. 代币地址（暂不用设为0）
            highestBidder: address(0),           // 10. 最高出价者（初始为空）
            highestBid: 0                        // 11. 最高价格（初始为0）
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
        require(!auction.ended, unicode"拍卖已结束");
        require(block.timestamp < auction.endTime, unicode"拍卖时间已过");
        require(msg.value > auction.highestBid, unicode"出价必须高于当前最高价");
        require(msg.value >= auction.startPrice, unicode"出价不能低于起始价");

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
        require(!auction.ended, unicode"拍卖已结束");
        require(block.timestamp > auction.endTime, unicode"拍卖时间未到");

        // 标记拍卖结束
        auction.ended = true;

        // 情况1：有最高出价者（成交）
        if (auction.highestBidder != address(0)) {
            // 1. 给卖家转ETH（拍卖所得）
            (bool success, ) = auction.seller.call{value: auction.highestBid}("");
            require(success, unicode"转ETH给卖家失败");

            // 2. 给最高出价者转NFT
            IERC721(auction.nftContract).safeTransferFrom(
                address(this), 
                auction.highestBidder, 
                auction.tokenId
            );
        }else {  // 情况2：无出价者（NFT返还卖家）
            IERC721(auction.nftContract).safeTransferFrom(
                address(this),
                auction.seller, 
                auction.tokenId
            );
        }
    }

    // 允许合约接收ETH（因为买家出价会转ETH到合约）
    receive() external payable {}

    // 实现 IERC721Receiver 接口，允许合约接收 ERC721 NFT(必须，否则无法接收NFT)
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
