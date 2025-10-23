const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("NftAuction", function () {
  let nftAuction;
  let testERC721;
  let mockPriceFeed;
  let owner, seller, buyer1, buyer2;
  
  // 部署合约和准备测试数据
  beforeEach(async function () {
    [owner, seller, buyer1, buyer2] = await ethers.getSigners();
    
    // 部署测试用ERC721合约
    const TestERC721 = await ethers.getContractFactory("NftERC721");
    testERC721 = await TestERC721.deploy();
    await testERC721.waitForDeployment();
    
    // 部署模拟价格预言机
    const AggregatorV3 = await ethers.getContractFactory("AggregatorV3");
    mockPriceFeed = await AggregatorV3.deploy(ethers.parseUnits("1800", 8)); // 1 ETH = 1800 USD
    await mockPriceFeed.waitForDeployment();
    
    // 部署可升级的NFT拍卖合约
    const NftAuction = await ethers.getContractFactory("NftAuction");
    nftAuction = await upgrades.deployProxy(NftAuction, [], { initializer: 'initialize' });
    await nftAuction.waitForDeployment();
    
    // 设置价格预言机
    await nftAuction.setPriceFeed(ethers.ZeroAddress, await mockPriceFeed.getAddress());
    
    // 给卖家 mint 一个NFT
    for (let i = 1; i <= 5; i++) {
      await testERC721.mint(seller.address, i);
      await testERC721.connect(seller).approve(await nftAuction.getAddress(), i);
    }
  });
  
  describe("核心功能测试", function () {
    it("应该能够创建拍卖", async function () {
      const duration = 3600; // 1小时
      const startPrice = ethers.parseEther("0.1"); // 0.1 ETH
      
      // 创建拍卖
      await expect(nftAuction.connect(seller).createAuction(
        await testERC721.getAddress(),
        1,
        duration,
        startPrice
      ))
      .to.emit(nftAuction, "AuctionCreated")
      .withArgs(0, seller.address, await testERC721.getAddress(), 1);
      
      // 检查拍卖信息
      const auction = await nftAuction.auctions(0);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.nftContract).to.equal(await testERC721.getAddress());
      expect(auction.tokenId).to.equal(1);
      expect(auction.duration).to.equal(duration);
      expect(auction.startPrice).to.equal(startPrice);
      expect(auction.ended).to.equal(false);
      
      // 检查NFT是否转移到合约
      expect(await testERC721.ownerOf(1)).to.equal(await nftAuction.getAddress());
    });
    
    it("应该能够出价和结束拍卖", async function () {
      // 设置拍卖参数
      const duration = 360000;
      const startPrice = ethers.parseEther("0.1");
      
      // 创建拍卖
      await nftAuction.connect(seller).createAuction(
        await testERC721.getAddress(),
        1,
        duration,
        startPrice
      );
      
      // 买家1出价
      const bid1 = ethers.parseEther("0.15");
      await expect(nftAuction.connect(buyer1).bid(0, { value: bid1 }))
        .to.emit(nftAuction, "BidPlaced")
        .withArgs(0, buyer1.address, bid1);
      
      // 检查最高出价
      let auction = await nftAuction.auctions(0);
      expect(auction.highestBidder).to.equal(buyer1.address);
      expect(auction.highestBid).to.equal(bid1);
      
      // 买家2出更高价
      const bid2 = ethers.parseEther("0.2");
      await expect(nftAuction.connect(buyer2).bid(0, { value: bid2 }))
        .to.emit(nftAuction, "BidPlaced")
        .withArgs(0, buyer2.address, bid2);
      
      // 检查最高出价更新
      auction = await nftAuction.auctions(0);
      expect(auction.highestBidder).to.equal(buyer2.address);
      expect(auction.highestBid).to.equal(bid2);
      
      // 模拟时间流逝
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");
      
      // 结束拍卖
      await expect(nftAuction.endAuction(0))
        .to.emit(nftAuction, "AuctionEnded")
        .withArgs(0, buyer2.address, 1);

      // 检查拍卖状态
      auction = await nftAuction.auctions(0);
      expect(auction.ended).to.equal(true);
      
      // 检查NFT转移
      expect(await testERC721.ownerOf(1)).to.equal(buyer2.address);
    });
    
    it("当没有出价时应该返还NFT给卖家", async function () {
      const duration = 3600;
      const startPrice = ethers.parseEther("0.1");
      
      // 创建拍卖
      await nftAuction.connect(seller).createAuction(
        await testERC721.getAddress(),
        1,
        duration,
        startPrice
      );
      
      // 模拟时间流逝
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");
      
      // 结束拍卖
      await expect(nftAuction.endAuction(0))
        .to.emit(nftAuction, "AuctionEnded")
        .withArgs(0, ethers.ZeroAddress, 1);
      
      // 检查NFT是否返还给卖家
      expect(await testERC721.ownerOf(1)).to.equal(seller.address);
    });
  });
  
  describe("权限控制测试", function () {
    it("应该只有管理员可以设置价格预言机", async function () {
      await expect(nftAuction.connect(seller).setPriceFeed(ethers.ZeroAddress, await mockPriceFeed.getAddress()))
        .to.be.revertedWith("Only admin can set price feed");
    });
  });
  
  describe("边界条件测试", function () {
    it("不应该允许创建无效的拍卖", async function () {
      const duration = 3600;
      const startPrice = ethers.parseEther("0.1");
      
      // 无效的NFT合约地址
      await expect(nftAuction.connect(seller).createAuction(
        ethers.ZeroAddress,
        1,
        duration,
        startPrice
      )).to.be.revertedWith("NFT合约地址无效");
      
      // 拍卖时间为0
      await expect(nftAuction.connect(seller).createAuction(
        await testERC721.getAddress(),
        1,
        0,
        startPrice
      )).to.be.revertedWith("拍卖时间不能为0");
      
      // 起始价格为0
      await expect(nftAuction.connect(seller).createAuction(
        await testERC721.getAddress(),
        1,
        duration,
        0
      )).to.be.revertedWith("起始价格不能为0");
      
      // 拍卖不属于自己的NFT
      await expect(nftAuction.connect(buyer1).createAuction(
        await testERC721.getAddress(),
        1,
        duration,
        startPrice
      )).to.be.revertedWith("你不是NFT的所有者");
    });
    
    it("不应该允许无效的出价", async function () {
      const duration = 3600;
      const startPrice = ethers.parseEther("0.1");
      
      // 创建拍卖
      await nftAuction.connect(seller).createAuction(
        await testERC721.getAddress(),
        1,
        duration,
        startPrice
      );
      
      // 出价低于起始价
      await expect(nftAuction.connect(buyer1).bid(0, { value: ethers.parseEther("0.05") }))
        .to.be.revertedWith("出价不能低于起始价");
      
      // 出价等于当前最高价
      await nftAuction.connect(buyer1).bid(0, { value: startPrice });
      await expect(nftAuction.connect(buyer2).bid(0, { value: startPrice }))
        .to.be.revertedWith("出价必须高于当前最高价");
      
      // 拍卖结束后出价
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");
      await expect(nftAuction.connect(buyer2).bid(0, { value: ethers.parseEther("0.2") }))
        .to.be.revertedWith("拍卖时间已过");
    });
    
    it("不应该允许在拍卖结束前结束拍卖", async function () {
      const duration = 3600;
      const startPrice = ethers.parseEther("0.1");
      
      // 创建拍卖
      await nftAuction.connect(seller).createAuction(
        await testERC721.getAddress(),
        1,
        duration,
        startPrice
      );
      
      // 尝试立即结束拍卖
      await expect(nftAuction.endAuction(0))
        .to.be.revertedWith("拍卖时间未到");
    });
    
    it("不应该允许重复结束拍卖", async function () {
      const duration = 3600;
      const startPrice = ethers.parseEther("0.1");
      
      // 创建拍卖
      await nftAuction.connect(seller).createAuction(
        await testERC721.getAddress(),
        1,
        duration,
        startPrice
      );
      
      // 模拟时间流逝
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");
      
      // 第一次结束拍卖
      await nftAuction.endAuction(0);
      
      // 尝试再次结束拍卖
      await expect(nftAuction.endAuction(0))
        .to.be.revertedWith("拍卖已结束");
    });
  });
});
