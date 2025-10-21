// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract LocalPriceConsumer {
    AggregatorV3Interface public priceFeed; // 预言机接口（可替换为模拟合约）

    // 构造函数：接收预言机地址（测试时传入模拟合约地址）
    constructor(address _priceFeed) {
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    // 获取最新价格（与真实环境逻辑一致）
    function getLatestPrice() public view returns (int) {
        (, int price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}