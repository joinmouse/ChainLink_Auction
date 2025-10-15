# ChainLink_Auction - NFT 跨链拍卖市场

ChainLink_Auction 是一个基于 Hardhat 框架开发的 NFT 拍卖市场，集成 ChainLink 预言机实现实时价格计算与跨链功能，采用工厂模式管理拍卖，并通过 UUPS 代理模式支持合约升级。

## 项目初始化

### 环境搭建

```bash
# 创建项目并进入目录
mkdir chainlink-auction && cd chainlink-auction

# 初始化 npm 项目
npm init -y

# 安装核心依赖
npm install --save-dev hardhat
npm install @openzeppelin/contracts @chainlink/contracts
npm install --save-dev @nomiclabs/hardhat-ethers ethers hardhat-deploy
npm install --save-dev @nomicfoundation/hardhat-chai-matchers chai dotenv

# 初始化 Hardhat 项目（选择空配置）
npx hardhat
```

### 配置文件

创建 `.env` 文件（敏感信息）：

```env
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_infura_api_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

配置 `hardhat.config.js`：

```javascript
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("@nomicfoundation/hardhat-chai-matchers");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  namedAccounts: {
    deployer: {
      default: 0 // 默认使用第一个账户作为部署者
    }
  }
};
```

### 创建基础目录结构

```bash
mkdir -p contracts/{nft,auction,factory,proxy,oracle} deploy test/{unit,integration} docs
```

## 开发计划

### 阶段 1：核心合约开发（1-2 周）

- **NFT 合约实现**
  - 开发 `ChainLinkNFT.sol`（基于 ERC721 标准）
  - 实现基础功能：铸造、转移、授权
  - 编写单元测试验证功能正确性

- **拍卖合约开发**
  - 实现 `Auction.sol` 核心逻辑
  - 支持功能：创建拍卖、出价（ETH/ERC20）、结束拍卖
  - 实现资金与 NFT 自动转移逻辑

- **工厂模式实现**
  - 开发 `AuctionFactory.sol`
  - 功能：创建拍卖合约实例、管理所有拍卖记录
  - 实现拍卖索引与状态查询接口

### 阶段 2：ChainLink 集成（1 周）

- **价格预言机集成**
  - 开发 `PriceOracle.sol`
  - 接入 ChainLink FeedData 获取价格数据
  - 实现 ETH/ERC20 到 USD 的实时转换

- **跨链功能实现**
  - 集成 ChainLink CCIP 协议
  - 实现 NFT 跨链转移功能
  - 支持跨链出价与结算流程

### 阶段 3：合约升级（1 周）

- **代理模式实现**
  - 基于 UUPS 模式开发可升级架构
  - 实现拍卖合约与工厂合约的升级逻辑
  - 确保升级过程中的数据安全性

- **权限管理**
  - 添加管理员角色控制机制
  - 实现升级权限保护与多签验证
  - 编写升级场景测试用例

### 阶段 4：测试与部署（1 周）

- **全面测试**
  - 完成单元测试（覆盖核心功能点）
  - 编写集成测试（验证完整业务流程）
  - 进行边界测试与安全测试

- **部署上线**
  - 编写自动化部署脚本
  - 部署合约到 Sepolia 测试网
  - 验证合约并记录部署地址

## 常用命令

```bash
# 编译合约
npx hardhat compile

# 运行测试
npx hardhat test

# 部署到 Sepolia 测试网
npx hardhat deploy --network sepolia

# 验证合约（替换为实际地址）
npx hardhat verify --network sepolia CONTRACT_ADDRESS

# 查看部署记录
npx hardhat deploy --network sepolia --reset
```

## 版本历史

- **v0.1.0**：项目初始化完成，基础架构搭建完毕