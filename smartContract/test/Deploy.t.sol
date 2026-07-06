// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";
import {Deploy} from "../script/Deploy.s.sol";
import {SmartContract} from "../src/SmartContract.sol";

contract DeployTest is Test {
    function testRunDeploysSmartContract() public {
        Deploy deployer = new Deploy();

        SmartContract deployed = deployer.run();

        // The deployed contract must be a real, usable SmartContract instance.
        assertTrue(address(deployed) != address(0));
    }

    function testDeployedContractHasAnOwnerSet() public {
        Deploy deployer = new Deploy();

        SmartContract deployed = deployer.run();

        // SmartContract's constructor sets contractOwner = msg.sender at
        // deployment time. Whoever vm.startBroadcast() acted as, the owner
        // must be a real, non-zero address.
        assertTrue(deployed.contractOwner() != address(0));
    }

    function testDeployedContractIsFunctional() public {
        Deploy deployer = new Deploy();
        SmartContract deployed = deployer.run();

        // Sanity check: a freshly deployed contract should accept a basic
        // createEvent call, proving `run()` returned a working instance
        // and not just an empty/garbage address.
        address[] memory participants = new address[](1);
        participants[0] = address(this);
        uint256[] memory shares = new uint256[](1);
        shares[0] = 1e18;

        deployed.createEvent("deploy-test", 1e18, participants, shares);

        assertEq(deployed.getPrice("deploy-test", address(this)), 1e18);
    }
}
