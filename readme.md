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
npm install --save-dev hardhat
npm install @openzeppelin/contracts @chainlink/contracts
npm install --save-dev @nomiclabs/hardhat-ethers ethers hardhat-deploy

# 初始化 Hardhat 项目（选择空配置）
npx hardhat
```

### 配置文件

创建 `.env` 文件（敏感信息）：

```env
PRIVATE_KEY=your_wallet_private_key
ALCHEMY_API_KEY=your_alchemy_api_key
```

## 开发计划

### 阶段 1：核心合约开发（已完成）

- **NFT 合约实现** ✅
  - 开发 `NftERC721.sol`（基于 ERC721 标准，已实现，见 contracts/NFTERC721.sol）
  - 实现基础功能：铸造（mint）、统一 tokenURI、合约 owner 权限控制
  - 单元测试：已编写基础测试

- **拍卖合约开发** ✅
  - 实现 `NftAuction.sol` 核心逻辑
  - 支持功能：创建拍卖、ETH出价、结束拍卖
  - 实现资金与 NFT 自动转移逻辑

### 阶段 2：合约升级（已完成）

- **代理模式实现** ✅
  - 基于 UUPS 模式开发可升级架构（已实现于 NftAuction.sol）
  - 实现拍卖合约的升级逻辑，升级权限由 admin 管理
  - 升级过程中的数据安全性已验证

- **权限管理** ✅
  - 添加管理员角色控制机制（admin）
  - 升级权限保护已实现
  - 已编写升级场景测试用例

### 阶段 3：ChainLink 集成 （已完成）

- **价格预言机集成** ✅
  - 开发 `LocalPriceConsumer.sol`做本地验证
  - `NftAuction.sol`接入 ChainLink FeedData 获取价格数据
  - 增加合约测试`test/nft_auction.js`

### 阶段 4：测试与部署（已完成）

- **全面测试**✅
  - 完成单元测试（覆盖核心功能点）
  - 编写集成测试（验证完整业务流程）
  - 进行边界测试与安全测试

- **部署上线**✅
  - 编写自动化部署脚本
  - 部署合约到 Sepolia 测试网
  - 验证合约并记录部署地址

- **部署合约地址**✅
  - NftERC721 部署地址： 0x1F761a7F0cEE38d4Df3729ec572De0fD0Edd4A96
  - NftAuction 代理合约地址： 0xE9DFB2D2a7feb671503ED09C988b4421D677D32c
  - NftAuction 实现合约地址： 0x3f198f869805B216edD543E34E196db3fF2F4d71

## 常用命令

### 开发相关命令

```bash
# 安装依赖
npm install

# 编译合约
npm run compile
# 或
npx hardhat compile

# 运行测试
npm test
# 或
npx hardhat test
```

### 部署相关命令

```bash
# 部署到 Sepolia 测试网
npm run deploy:sepolia
```

## 合约

### NFT 合约 (NftERC721.sol)

- [x] 支持 ERC721 标准  
  实现 ERC721 核心接口，包括代币所有权管理、转移（`transferFrom`、`safeTransferFrom`）等标准功能，并兼容 ERC721 元数据接口。

- [x] 支持铸造（mint）  
  提供 NFT 铸造功能，仅合约 owner 可调用，支持为指定地址铸造特定 tokenId 的 NFT，确保资产初始分配的可控性。

- [x] 合约 owner 权限控制  
  核心操作（如铸造、权限管理）受 owner 权限保护，防止未授权地址执行敏感操作，增强合约安全性。

- [x] 可设置统一的 tokenURI  
  支持设置全局或批量 NFT 的元数据 URI（如图片、描述等），简化 NFT 元数据管理，确保链下数据的一致性。

### NFT 拍卖合约 (NftAuction.sol)

- [x] 创建拍卖功能  
  - NFT 托管机制：创建拍卖时，NFT 从卖家地址转移至合约地址托管，防止卖家中途转移资产，保障竞拍者权益  
  - 起拍价设置：支持设置 ETH 计价的起始价格，且出价需不低于该价格，确保卖家最低收益  
  - 拍卖时间控制：通过 `duration` 参数设定拍卖持续时间，自动计算结束时间（`startTime + duration`），超时后拍卖自动终止  
  - 权限校验：仅 NFT 所有者可创建对应资产的拍卖，防止他人恶意操作非自有资产  
  - 事件通知：创建成功后触发 `AuctionCreated` 事件，记录拍卖 ID、卖家、NFT 合约及 tokenId，便于前端追踪  

- [x] 竞拍功能  
  - ETH 出价支持：竞拍者通过 ETH 直接出价，资金暂存于合约，待拍卖结束后统一结算  
  - 最高出价记录：实时更新并存储当前最高出价及出价者，确保竞拍过程透明可追溯  
  - 出价验证逻辑：  
    - 仅在拍卖未结束且未超时的情况下允许出价  
    - 出价金额必须高于当前最高出价且不低于起拍价  
    - 触发 `BidPlaced` 事件，记录拍卖 ID、出价者及金额，便于实时同步竞拍状态  

- [x] 拍卖结束功能  
  - 自动结算机制：任何人可在拍卖超时后调用结束函数，系统自动完成资金与资产的转移  
  - NFT 转移处理：  
    - 若有最高出价者：NFT 从合约转移至最高出价者地址  
    - 若无出价者：NFT 返还给原卖家  
  - 资金转移处理：将最高出价 ETH 从合约转账给卖家（若成交），确保资金安全到账  
  - 事件通知：触发 `AuctionEnded` 事件，记录拍卖 ID、最终赢家（或 0 地址表示流拍）及 NFT tokenId，明确拍卖结果  

- [x] 可升级性与管理  
  - 基于 UUPS 模式实现合约可升级，管理员可通过升级功能修复漏洞或扩展功能  
  - 支持 Chainlink 价格喂价配置（仅管理员），为后续多代币竞拍扩展预留接口  

- [x] 安全性保障  
  - 实现 `IERC721Receiver` 接口，确保合约可正确接收 NFT  
  - 内置 `receive` 函数，支持 ETH 直接转入（用于竞拍资金接收）  
  - 严格的权限校验（如管理员专属操作、拍卖状态校验），防止恶意调用

## 版本历史

- **v1.0.0** (2025.10.24)：新增部署脚本`script/deploy-testnet,js`将合约顺利部署到Sepolia 测试网, 完成上线和验证
- **v0.5.0** (2025.10.23)：合约引入预言机（ChainLink），支持拍卖过程中实时动态的获取eth的价格, 完善nftAuction合约的测试
- **v0.4.0** (2025.10.19)：新增合约升级的单元测试代码（UUPS代理模式），Hardhat从v3切换到v2(v3不支持@openzeppelin/hardhat-upgrades)
- **v0.3.0** (2025.10.18)：完成合约升级功能（UUPS代理模式）、权限管理（admin），拍卖合约支持升级
- **v0.2.0** (2025.10.16)：完成基础 NFT 拍卖合约开发，并新增 NftERC721 合约实现
- **v0.1.0** (2025.10.15)：项目初始化完成，使用hardhat进行基础架构搭建