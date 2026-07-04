// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {SmartContract} from "../src/SmartContract.sol";

contract Deploy is Script {
    address constant SEPOLIA_PRICE_FEED =
        0x694AA1769357215DE4FAC081bf1f309aDC325306;

    function run() external returns (SmartContract) {
        vm.startBroadcast();

        SmartContract sc = new SmartContract(SEPOLIA_PRICE_FEED);

        vm.stopBroadcast();

        return sc;
    }
}
