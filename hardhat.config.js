require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades")

// 部署钱包的私钥（从 MetaMask 导出，仅用于测试网，勿用于主网）
const PRIVATE_KEY = process.env.PRIVATE_KEY;
// Alchemy/Infura API Key（用于连接测试网节点，二选一即可）
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;
// const INFURA_API_KEY = process.env.INFURA_API_KEY;

module.exports = {
  solidity: {
    version: "0.8.28", // 与合约指定的 Solidity 版本一致
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // 本地测试网（可选，用于部署前调试）
    hardhat: {},
    // Sepolia 测试网（核心配置）
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`, // Alchemy 节点
      accounts: [PRIVATE_KEY], // 部署用的钱包账号
      gas: 2100000, // 可选，设置 Gas 上限
      gasPrice: 8000000000 // 可选，设置 Gas 价格（8 Gwei）
    }
  }
};