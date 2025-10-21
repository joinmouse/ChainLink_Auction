const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("本地测试预言机", function () {
  let mockPriceFeed; // 模拟预言机合约
  let priceConsumer; // 我们的价格消费合约

  beforeEach(async function () {
    // 1. 部署模拟预言机（MockV3Aggregator）
    // 参数：小数位数（8位，Chainlink标准）、初始价格（例如2000美元，带8位小数即2000*1e8=200000000000）
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    mockPriceFeed = await MockV3Aggregator.deploy(8, 200000000000); // 8位小数，初始价格2000美元
    console.log("mockv3 address", mockPriceFeed.target)
    // 2. 部署我们的价格消费合约，传入模拟预言机地址
    const LocalPriceConsumer = await ethers.getContractFactory("LocalPriceConsumer");
    priceConsumer = await LocalPriceConsumer.deploy(mockPriceFeed.target);
    // await priceConsumer.deployed();
  });

  it("应该能获取模拟的ETH价格", async function () {
    // 3. 从消费合约中获取价格
    const price = await priceConsumer.getLatestPrice();
    
    // 验证价格是否与模拟预言机设置的一致（200000000000 = 2000 * 1e8）
    expect(price).to.equal(200000000000);
    console.log("获取到的模拟价格（带8位小数）：", price.toString()); // 输出 200000000000
    console.log("实际价格（美元）：", price.toString() / 1e8); // 输出 2000
  });

  it("应该能更新模拟价格并获取新值", async function () {
    // 4. 模拟价格变动：将价格更新为3000美元（3000*1e8=300000000000）
    await mockPriceFeed.updateAnswer(300000000000);

    // 5. 获取更新后的价格
    const newPrice = await priceConsumer.getLatestPrice();
    
    expect(newPrice).to.equal(300000000000);
    console.log("更新后的模拟价格（带8位小数）：", newPrice.toString()); // 输出 300000000000
    console.log("更新后的实际价格（美元）：", newPrice.toString() / 1e8); // 输出 3000
  });
});