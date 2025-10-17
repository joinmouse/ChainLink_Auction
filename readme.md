# ChainLink_Auction - NFT 跨链拍卖市场

ChainLink_Auction 是一个基于 Hardhat 框架开发的 NFT 拍卖市场，集成 ChainLink 预言机实现实时价格计算与跨链功能，采用工厂模式管理拍卖，并通过 UUPS 代理模式支持合约升级。

## 项目特点

- 支持 ETH 竞价的 NFT 拍卖功能
- 基于时间的自动结束机制
- NFT 托管保证交易安全
- 实时价格计算与跨链交易（开发中）
- 可升级的智能合约架构（开发中）

## 项目初始化

### 环境搭建

```bash
# 安装核心依赖
pnpm add -D hardhat
pnpm add @openzeppelin/contracts @chainlink/contracts
pnpm add -D @nomiclabs/hardhat-ethers ethers hardhat-deploy
pnpm add -D @nomicfoundation/hardhat-chai-matchers chai dotenv

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

### 阶段 1：核心合约开发（已完成）

- **NFT 合约实现** ✅
  - 开发 `NftERC721.sol`（基于 ERC721 标准，已实现，见 contracts/NFTERC721.sol）
  - 实现基础功能：铸造（mint）、统一 tokenURI、合约 owner 权限控制
  - 单元测试：已编写基础测试，更多覆盖待补充

- **拍卖合约开发** ✅
  - 实现 `NftAuction.sol` 核心逻辑
  - 支持功能：创建拍卖、ETH出价、结束拍卖
  - 实现资金与 NFT 自动转移逻辑
  - ERC20代币支持（待开发）

### 阶段 2：合约升级（已完成）

- **代理模式实现** ✅
  - 基于 UUPS 模式开发可升级架构（已实现于 NftAuction.sol）
  - 实现拍卖合约的升级逻辑，升级权限由 admin 管理
  - 升级过程中的数据安全性已验证

- **权限管理** ✅
  - 添加管理员角色控制机制（admin）
  - 升级权限保护已实现
  - 多签验证（待开发）
  - 已编写升级场景测试用例

### 阶段 3：ChainLink 集成（1 周）

- **价格预言机集成**
  - 开发 `PriceOracle.sol`
  - 接入 ChainLink FeedData 获取价格数据
  - 实现 ETH/ERC20 到 USD 的实时转换

- **跨链功能实现**
  - 集成 ChainLink CCIP 协议
  - 实现 NFT 跨链转移功能
  - 支持跨链出价与结算流程

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

### 开发相关命令

```bash
# 安装依赖
pnpm install

# 编译合约
pnpm run compile
# 或
npx hardhat compile

# 运行测试
pnpm test
# 或
npx hardhat test
```

### 部署相关命令

```bash
# 部署到 Sepolia 测试网
pnpm run deploy:sepolia
# 或
npx hardhat deploy --network sepolia

# 验证合约（替换为实际地址）
pnpm run verify:sepolia CONTRACT_ADDRESS
# 或
npx hardhat verify --network sepolia CONTRACT_ADDRESS

# 查看部署记录
pnpm run deploy:sepolia:reset
# 或
npx hardhat deploy --network sepolia --reset
```

### pnpm 工作区管理

```bash
# 添加依赖到根目录
pnpm add -w package-name

# 添加依赖到特定工作区
pnpm add package-name --filter workspace-name
```

## 已完成功能


### NFT 合约 (NftERC721.sol)

- [x] 支持 ERC721 标准
- [x] 支持铸造（mint）
- [x] 合约 owner 权限控制
- [x] 可设置统一的 tokenURI

### NFT 拍卖合约 (NftAuction.sol)

- [x] 创建拍卖功能
  - NFT 托管机制
  - 起拍价设置
  - 拍卖时间控制
- [x] 竞拍功能
  - ETH 出价支持
  - 最高出价记录
  - 出价验证逻辑
- [x] 拍卖结束功能
  - 自动结算机制
  - NFT 转移处理
  - 资金转移处理

## 版本历史

- **v0.3.0** (2025.10.18)：完成合约升级功能（UUPS代理模式）、权限管理（admin），拍卖合约支持升级
- **v0.2.0** (2025.10.16)：完成基础 NFT 拍卖合约开发，并新增 NftERC721 合约实现
- **v0.1.0** (2025.10.15)：项目初始化完成，基础架构搭建完毕
