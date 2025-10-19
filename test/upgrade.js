const { ethers, deployments, upgrades } = require("hardhat");
const { expect } = require("chai");

describe("Test upgrade", async function () {
  it("Should be able to deploy", async function () {
    const [signer] = await ethers.getSigners(); // 获取第一个账户: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
    console.log("signer address::", signer.address);

    //  1、通过代理合约部署NftAuction合约
    const nftAuction = await ethers.getContractFactory("NftAuction");
    const nftAuctionProxy = await upgrades.deployProxy(nftAuction, [], {
        initializer: "initialize",
    })
    const nftAuctionProxyAddress = await nftAuctionProxy.getAddress(); // 代理合约地址: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
    console.log("代理合约地址:", nftAuctionProxyAddress);  
    const nftAuctionAddress = await upgrades.erc1967.getImplementationAddress(nftAuctionProxyAddress)
    console.log("实现合约NftAuction地址：", nftAuctionAddress);   // 实现合约地址: 0x5FbDB2315678afecb367f032d93F642f64180aa3


    // 2. 部署 ERC721 合约
    const NftERC721 = await ethers.getContractFactory("NftERC721");
    const nftERC721 = await NftERC721.deploy();
    await nftERC721.waitForDeployment();
    const nftERC721Address = await nftERC721.getAddress();
    console.log("NFT ERC721合约地址:", nftERC721Address);
    // mint 10个 NFT
    for (let i = 0; i < 10; i++) {
        await nftERC721.mint(signer.address, i + 1);
    }
    // 给代理合约授权
    await nftERC721.setApprovalForAll(nftAuctionProxyAddress, true);

    // 3、 调用 createAuction 方法创建拍卖
    const nftAuctionImpl = await ethers.getContractAt(
      "NftAuction",
      nftAuctionProxyAddress
    );
    const tokenId = 1;
    await nftAuctionImpl.createAuction(
      nftERC721Address,  // NFT合约地址
      tokenId,   // NFT的tokenId
      10000,     // 拍卖时长
      ethers.parseEther("0.01"),  // 起拍价0.01 ETH
    );
    const auction = await nftAuctionImpl.auctions(0);

    // 4. 升级合约
    const nftAuctionV2 = await ethers.getContractFactory("NftAuctionV2");
    await upgrades.upgradeProxy(nftAuctionProxyAddress, nftAuctionV2, {
        initializer: "initialize",
    })
    const nftAuctionV2Address = await upgrades.erc1967.getImplementationAddress(nftAuctionProxyAddress);
    console.log("实现合约NftAuctionV2地址：", nftAuctionV2Address);   // 实现合约地址: 0x0B306BF915C4d645ff596e518fAf3F9669b97016
    
    // 5、比较 auction 和 auction2 的各个字段是否相等
    const nftAuctionV2Impl = await ethers.getContractAt(
        "NftAuctionV2",
        nftAuctionProxyAddress
    );
    const auction2 = await nftAuctionV2Impl.auctions(0);
    expect(auction2).to.deep.equal(auction);

    // 6、调用新加的方法 getRemainingTime
    const remainingTime = await nftAuctionV2Impl.getRemainingTime(0);
    console.log("remainingTime::", remainingTime);

    // // console.log("创建拍卖成功：：", await nftAuction.auctions(0));
    // expect(auction2.startTime).to.equal(auction.startTime);
    // // expect(implAddress1).to.not(implAddress2);
  });
});