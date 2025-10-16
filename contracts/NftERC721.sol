// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// 导入 OpenZeppelin 的 ERC721Enumerable 合约（支持枚举功能的 ERC721）
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// 导入 Ownable 合约用于权限控制
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NftERC721
 * @dev 一个简单的 NFT 合约，继承自 ERC721Enumerable 和 Ownable
 * - ERC721Enumerable：提供了枚举功能的 ERC721 标准实现
 * - Ownable：提供了基本的访问控制机制
 */
contract NftERC721 is ERC721Enumerable, Ownable {
    // NFT 元数据 URI，所有 token 共用同一个 URI
    string private _tokenURI;

    /**
     * @dev 构造函数
     * - 初始化 ERC721 的名称为 "Troll"，符号为 "Troll"
     * - 设置合约部署者为 owner
     */
    constructor() ERC721("Troll", "Troll") Ownable(msg.sender) {}

    /**
     * @dev 铸造新的 NFT
     * @param to 接收 NFT 的地址
     * @param tokenId 要铸造的 token ID
     * @notice 只有合约 owner 可以调用此函数
     */
    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }

    /** 
    * @dev 获取 token 的元数据 URI
    * @return 返回 token 的元数据 URI
    * @notice 所有 token 共用同一个 URI（无需指定 tokenId）
    */
    function tokenURI(uint256) public view override returns (string memory) {
        return _tokenURI;
    }

    /**
    * @dev 设置所有 token 的元数据 URI
    * @param newTokenURI 新的元数据 URI
    * @notice 只有合约 owner 可以调用此函数
    */
    function setTokenURI(string memory newTokenURI) external onlyOwner {
        _tokenURI = newTokenURI;
    }
}