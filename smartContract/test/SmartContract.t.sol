// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {SmartContract} from "../src/SmartContract.sol";
import {Test} from "forge-std/Test.sol";

contract SmartContractTest is Test {
    SmartContract public smartContract;

    receive() external payable {}

    function setUp() public {
        smartContract = new SmartContract();
        vm.deal(address(this), 100 ether);
        vm.deal(address(0x123), 100 ether);
        vm.deal(address(0x456), 100 ether);
        vm.deal(address(0x789), 100 ether);
    }

    // -------------------------
    // HELPER
    // -------------------------
    function _createEvent() internal {
        address[] memory participants = new address[](2);
        participants[0] = address(0x123);
        participants[1] = address(0x456);
        bytes32 offChainId = "abc";

        smartContract.createEvent(offChainId, 3 ether, participants);
    }

    function _createEvent2() internal {
        address[] memory participants = new address[](2);
        participants[0] = address(0x123);
        participants[1] = address(0x456);
        bytes32 offChainId = "def";

        smartContract.createEvent(offChainId, 3 ether, participants);
    }

    // =========================================================
    // CONSTRUCTOR
    // =========================================================

    function testConstructorSetsOwner() public view {
        assertEq(smartContract.contractOwner(), address(this));
    }

    // =========================================================
    // CREATE EVENT
    // =========================================================

    function testCreateEvent() public {
        _createEvent();

        (
            uint256 eventId,
            bytes32 offChainId,
            address eventOwner,
            uint256 totalAmount,
            uint256 shareAmount,
            uint256 participantsCount,
            uint256 havePaidParticipants,
            SmartContract.EventStatus status
        ) = smartContract.getEvent("abc");

        assertEq(eventId, 0);
        assertEq(offChainId, "abc");
        assertEq(eventOwner, address(this));
        assertEq(totalAmount, 3 ether);
        assertEq(shareAmount, 1 ether); // 3 ether / 3 participants
        assertEq(participantsCount, 3); // 2 participants + owner
        assertEq(havePaidParticipants, 1); // owner is pre-paid
        assertEq(uint(status), uint(SmartContract.EventStatus.Opened));
    }

    function testCreateEventOwnerIsPrePaid() public {
        _createEvent();

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        ); // ✅
        assertEq(havePaidParticipants, 1);
    }

    function testCreateMultipleEvents() public {
        _createEvent();
        _createEvent2();

        assertEq(smartContract.logEvents("abc"), 0);
        assertEq(smartContract.logEvents("def"), 1);
    }

    function testCreateEventWithNoParticipants() public {
        address[] memory participants = new address[](0);
        vm.expectRevert(SmartContract.NotEnoughParticipants.selector);
        smartContract.createEvent("abc", 1 ether, participants);
    }

    function testCreateEventShareAmountCalculation() public {
        _createEvent();
        assertEq(smartContract.getPrice("abc"), 1 ether);
    }

    // ✅ Νέο: duplicate offChainId
    function testCreateEventWithDuplicateOffChainId() public {
        _createEvent();
        address[] memory participants = new address[](1);
        participants[0] = address(0x123);
        // Δεν κάνει revert αλλά overwrite — καλό να το γνωρίζουμε
        smartContract.createEvent("abc", 2 ether, participants);
        // Το offChainId "abc" τώρα δείχνει στο event 1
        assertEq(smartContract.logEvents("abc"), 1);
    }

    // =========================================================
    // PAYMENT
    // =========================================================

    function testPayment() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: 1 ether}("abc");

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentTransfersEtherToOwner() public {
        _createEvent();

        uint256 ownerBefore = address(this).balance;

        vm.prank(address(0x123));
        smartContract.payment{value: 1 ether}("abc");

        assertEq(address(this).balance, ownerBefore + 1 ether);
    }

    function testPaymentWithInvalidEventId() public {
        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.payment{value: 1 ether}("xyz"); // ✅ άγνωστο offChainId
    }

    function testPaymentWhenOwnerTriesToPay() public {
        _createEvent();

        vm.expectRevert(SmartContract.NotAllowed.selector);
        smartContract.payment{value: 1 ether}("abc");
    }

    function testPaymentWhenEventIsClosed() public {
        _createEvent();
        smartContract.closeEvent("abc");

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.EventClosed.selector);
        smartContract.payment{value: 1 ether}("abc");
    }

    function testPaymentWhenNotAParticipant() public {
        _createEvent();

        vm.prank(address(0x789));
        vm.expectRevert(SmartContract.NotAParticipant.selector);
        smartContract.payment{value: 1 ether}("abc");
    }

    function testPaymentWhenAlreadyPaid() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: 1 ether}("abc");

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.HasAlreadyPaid.selector);
        smartContract.payment{value: 1 ether}("abc");
    }

    function testPaymentWithNotEnoughEther() public {
        _createEvent();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.NotEnoughEther.selector);
        smartContract.payment{value: 0.5 ether}("abc");
    }

    function testPaymentWithTooMuchEther() public {
        _createEvent();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.TooMuchEther.selector);
        smartContract.payment{value: 2 ether}("abc");
    }

    function testAllParticipantsPay() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: 1 ether}("abc");

        vm.prank(address(0x456));
        smartContract.payment{value: 1 ether}("abc");

        (
            ,
            ,
            ,
            ,
            ,
            uint256 participantsCount,
            uint256 havePaidParticipants,

        ) = smartContract.getEvent("abc");
        assertEq(havePaidParticipants, participantsCount);
    }

    // ✅ Νέο: ο owner λαμβάνει και τις δύο πληρωμές
    function testOwnerReceivesBothPayments() public {
        _createEvent();

        uint256 ownerBefore = address(this).balance;

        vm.prank(address(0x123));
        smartContract.payment{value: 1 ether}("abc");

        vm.prank(address(0x456));
        smartContract.payment{value: 1 ether}("abc");

        assertEq(address(this).balance, ownerBefore + 2 ether);
    }

    // =========================================================
    // COMPLETED
    // =========================================================

    function testIsEventComplete() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: 1 ether}("abc");

        vm.prank(address(0x456));
        smartContract.payment{value: 1 ether}("abc");

        assertEq(smartContract.completed("abc"), true);
    }

    function testEventIsNotCompleteAfterOnePayment() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: 1 ether}("abc");

        assertEq(smartContract.completed("abc"), false);
    }

    function testEventIsNotCompleteWhenJustCreated() public {
        _createEvent();
        assertEq(smartContract.completed("abc"), false);
    }

    function testCompletedWithInvalidEventId() public {
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.completed("xyz");
    }

    // =========================================================
    // GET EVENT
    // =========================================================

    function testGetEvent() public {
        _createEvent();

        (
            uint256 eventId,
            bytes32 offChainId,
            address eventOwner,
            uint256 totalAmount,
            uint256 shareAmount,
            uint256 participantsCount,
            uint256 havePaidParticipants,
            SmartContract.EventStatus status
        ) = smartContract.getEvent("abc"); // ✅ bytes32 όχι uint

        assertEq(eventId, 0);
        assertEq(offChainId, "abc");
        assertEq(eventOwner, address(this));
        assertEq(totalAmount, 3 ether);
        assertEq(shareAmount, 1 ether);
        assertEq(participantsCount, 3);
        assertEq(havePaidParticipants, 1);
        assertEq(uint(status), uint(SmartContract.EventStatus.Opened));
    }

    function testGetEventWithInvalidEventId() public {
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.getEvent("xyz");
    }

    // =========================================================
    // GET PRICE
    // =========================================================

    function testGetPrice() public {
        _createEvent();
        assertEq(smartContract.getPrice("abc"), 1 ether);
    }

    function testGetPriceWithInvalidEventId() public {
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.getPrice("xyz");
    }

    // =========================================================
    // LOG EVENTS
    // =========================================================

    function testLogEvents() public {
        _createEvent();
        assertEq(smartContract.logEvents("abc"), 0);
    }

    function testLogEventsWithInvalidEventId() public {
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.logEvents("xyz");
    }

    function testLogEventsReturnsCorrectIdForMultipleEvents() public {
        _createEvent();
        _createEvent2();

        assertEq(smartContract.logEvents("abc"), 0);
        assertEq(smartContract.logEvents("def"), 1);
    }

    // =========================================================
    // CLOSE EVENT
    // =========================================================

    function testCloseEvent() public {
        _createEvent();
        smartContract.closeEvent("abc");

        (, , , , , , , SmartContract.EventStatus status) = smartContract
            .getEvent("abc");
        assertEq(uint(status), uint(SmartContract.EventStatus.Closed));
    }

    function testCloseEventWithInvalidEventId() public {
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.closeEvent("xyz");
    }

    function testCloseEventWhenNotOwner() public {
        _createEvent();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.NotOwner.selector);
        smartContract.closeEvent("abc");
    }

    function testCloseAlreadyClosedEvent() public {
        _createEvent();
        smartContract.closeEvent("abc");
        smartContract.closeEvent("abc"); // should not revert

        (, , , , , , , SmartContract.EventStatus status) = smartContract
            .getEvent("abc");
        assertEq(uint(status), uint(SmartContract.EventStatus.Closed));
    }
}
