// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {SmartContract} from "../src/SmartContract.sol";

contract Deploy is Script {
    function run() external returns (SmartContract) {
        vm.startBroadcast();

        SmartContract sc = new SmartContract();

        vm.stopBroadcast();

        return sc;
    }
}
