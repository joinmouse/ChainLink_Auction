const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("开始部署合约到 Sepolia 测试网...");

  // 1. 部署 NftERC721 合约（普通合约）
  const NftERC721 = await ethers.getContractFactory("NftERC721");
  const nftERC721 = await NftERC721.deploy(); // 若构造函数有参数，需传入对应值
  await nftERC721.waitForDeployment(); // 等待部署完成
  const nftERC721Address = await nftERC721.getAddress();
  console.log("NftERC721 部署地址：", nftERC721Address);

  // 2. 部署 NftAuction 合约（UUPS 可升级，用 deployProxy）
  const NftAuction = await ethers.getContractFactory("NftAuction");
  // 部署代理合约 + 实现合约，并调用 initialize 初始化（替代构造函数）
  const nftAuctionProxy = await upgrades.deployProxy(NftAuction, [], {
    initializer: "initialize", // 指定初始化函数
    kind: "uups" // 明确 UUPS 模式
  });
  await nftAuctionProxy.waitForDeployment();
  const nftAuctionProxyAddress = await nftAuctionProxy.getAddress();
  console.log("NftAuction 代理合约地址：", nftAuctionProxyAddress);
  console.log("NftAuction 实现合约地址：", await upgrades.erc1967.getImplementationAddress(nftAuctionProxyAddress));

  console.log("所有合约部署完成！");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("部署失败：", error);
    process.exit(1);
  });