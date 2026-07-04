// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// Why is this a library and not abstract?
// Why not an interface?
library PriceConverter {
    using PriceConverter for uint256;

    // =========================
    // GET PRICE (token/USD)
    // =========================
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        require(answer > 0, "Invalid price");
        // Chainlink feeds are usually 8 decimals → convert to 18
        return uint256(answer) * 1e10;
    }

    // =========================
    // TOKEN → USD
    // =========================
    function getTokenUsdValue(
        uint256 tokenAmount,
        uint8 tokenDecimals,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 price = getPrice(priceFeed); // USD per token (18 decimals)

        // normalize token to 18 decimals
        uint256 normalized = tokenAmount * (10 ** (18 - tokenDecimals));

        // USD value in 18 decimals
        return (normalized * price) / 1e18;
    }

    // =========================
    // USD → TOKEN
    // =========================
    function getTokenAmountFromUsd(
        uint256 usdAmount,
        uint8 tokenDecimals,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 price = getPrice(priceFeed);

        uint256 tokenAmount = (usdAmount * 1e18) / price;

        // de-normalize back to token decimals
        return tokenAmount / (10 ** (18 - tokenDecimals));
    }
}
