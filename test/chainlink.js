const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainlinkPrice", function () {
  let priceDemo;
  let mockPriceFeed;
  let admin;
  let user;

  beforeEach(async function () {
    // 部署Mock价格喂价合约
    const AggregatorFactory = await ethers.getContractFactory("AggreagatorV3");
    console.log("✅ 获取合约工厂成功", AggregatorFactory);
    mockPriceFeed = await AggregatorFactory.deploy(1800);
    console.log("✅ 部署Mock合约成功");
    console.log("📄 合约地址:", await mockPriceFeed.getAddress());  // 0x5FbDB2315678afecb367f032d93F642f64180aa3
    console.log("📄 合约地址:", mockPriceFeed.target); // 0x5FbDB2315678afecb367f032d93F642f64180aa3
   
    // 部署主合约（使用管理员）
    [admin, user] = await ethers.getSigners();
    const LocalPriceConsumer = await ethers.getContractFactory("LocalPriceConsumer", admin);
    console.log("PriceDemo", LocalPriceConsumer)
    priceDemo = await LocalPriceConsumer.deploy();
    await priceDemo.waitForDeployment();
    console.log("合约部署完成，地址:", await priceDemo.getAddress()); // 地址: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  });

  describe("权限控制", async function () {
    it("非管理员不能设置价格喂价", async function () {
      // 用普通用户尝试设置喂价，应失败
      // console.log("xxx:", await priceDemo.connect(user).setPriceFeed(ethers.ZeroAddress, ETH_USD_FEED_MAINNET))
      // await expect(
      //   priceDemo.setPriceFeed(ethers.ZeroAddress, ETH_USD_FEED_MAINNET)
      // ).to.be.revertedWith("Only admin can set feed");

      await expect(
        priceDemo.connect(user).setPriceFeed(ethers.ZeroAddress, ETH_USD_FEED_MAINNET)
      ).to.be.revertedWith("Only admin can set feed");
    });

    // it("管理员可以设置价格喂价", async function () {
    //   // 管理员设置ETH的喂价合约
    //   await priceDemo.setPriceFeed(ethers.ZeroAddress, ETH_USD_FEED_MAINNET);
      
    //   // 验证喂价合约地址是否正确存储
    //   const storedFeed = await priceDemo.priceFeeds(ethers.ZeroAddress);
    //   expect(storedFeed).to.equal(ETH_USD_FEED_MAINNET);
    // });
  });

  describe("价格读取", function () {
    // it("未设置喂价时读取价格应失败", async function () {
    //   // 未设置喂价时调用getTokenPriceUSD，应失败
    //   await expect(
    //     priceDemo.getTokenPriceUSD(ethers.ZeroAddress)
    //   ).to.be.revertedWith("Price feed not set");
    // });

    // it("设置喂价后可以读取ETH价格（主网fork测试）", async function () {
    //   // 注意：此测试需要主网fork环境（Hardhat配置forking）
    //   // 1. 管理员设置ETH喂价合约
    //   await priceDemo.setPriceFeed(ethers.ZeroAddress, ETH_USD_FEED_MAINNET);
      
    //   // 2. 读取价格（实际主网价格，非固定值）
    //   const ethPrice = await priceDemo.getTokenPriceUSD(ethers.ZeroAddress);
      
    //   // 3. 验证价格格式（Chainlink价格带8位小数，必然大于0）
    //   expect(ethPrice).to.be.gt(0);
    //   console.log(`当前ETH/USD价格（Chainlink格式）：${ethPrice.toString()}`);
    //   console.log(`当前ETH/USD价格（美元）：${Number(ethPrice) / 1e8}`);
    // });

    // it("模拟价格返回值格式（本地测试）", async function () {
    //   // 本地测试：不依赖主网，仅验证逻辑（实际项目中可用Mock合约）
    //   // 1. 假设已设置喂价（此处跳过实际喂价合约交互）
    //   await priceDemo.setPriceFeed(ethers.ZeroAddress, ETH_USD_FEED_MAINNET);
      
    //   // 2. 模拟价格逻辑：验证返回值应为正数且符合8位小数格式
    //   // （实际项目中可用Chainlink的MockV3Aggregator模拟价格）
    //   const ethPrice = await priceDemo.getTokenPriceUSD(ethers.ZeroAddress);
    //   expect(ethPrice).to.be.a("bigint");
    //   expect(ethPrice).to.be.gt(0);
    // });
  });
});