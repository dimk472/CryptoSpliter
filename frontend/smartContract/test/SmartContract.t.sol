// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {SmartContract} from "../src/SmartContract.sol";
import {Test} from "forge-std/Test.sol";

// ─────────────────────────────────────────────
// Mock Chainlink Price Feed
// ETH/USD = $3000 (8 decimals → 300000000000)
// ─────────────────────────────────────────────
contract MockV3Aggregator {
    int256 public answer;
    uint8 public decimals = 8;

    constructor(int256 _initialAnswer) {
        answer = _initialAnswer;
    }

    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (0, answer, 0, 0, 0);
    }

    function updateAnswer(int256 _answer) external {
        answer = _answer;
    }
}

contract SmartContractTest is Test {
    SmartContract public smartContract;
    MockV3Aggregator public mockPriceFeed;

    // ETH price = $3000, 8 decimals
    int256 constant ETH_PRICE = 300000000000;
    // $3000 * 1e18 (18 decimals)
    uint256 constant ETH_PRICE_18 = 3000e18;

    // $30 total, 3 participants → $10/each
    // $10 in Wei = 10e18 / 3000e18 * 1e18 = 3333333333333333 Wei
    uint256 constant PRICE_USD = 30e18;
    uint256 constant SHARE_USD = 10e18; // 30e18 / 3
    uint256 constant SHARE_WEI = 3333333333333333; // ~$10 at $3000/ETH

    receive() external payable {}

    function setUp() public {
        mockPriceFeed = new MockV3Aggregator(ETH_PRICE);
        smartContract = new SmartContract(address(mockPriceFeed));

        vm.deal(address(this), 100 ether);
        vm.deal(address(0x123), 100 ether);
        vm.deal(address(0x456), 100 ether);
        vm.deal(address(0x789), 100 ether);
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    function _createEvent() internal {
        address[] memory participants = new address[](2);
        participants[0] = address(0x123);
        participants[1] = address(0x456);
        smartContract.createEvent("abc", PRICE_USD, participants);
    }

    function _createEvent2() internal {
        address[] memory participants = new address[](2);
        participants[0] = address(0x123);
        participants[1] = address(0x456);
        smartContract.createEvent("def", PRICE_USD, participants);
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
        assertEq(totalAmount, PRICE_USD);
        assertEq(shareAmount, SHARE_USD);
        assertEq(participantsCount, 3);
        assertEq(havePaidParticipants, 1); // owner pre-paid
        assertEq(uint(status), uint(SmartContract.EventStatus.Opened));
    }

    function testCreateEventOwnerIsPrePaid() public {
        _createEvent();
        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
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
        smartContract.createEvent("abc", PRICE_USD, participants);
    }

    function testCreateEventShareAmountCalculation() public {
        _createEvent();
        assertEq(smartContract.getPrice("abc"), SHARE_USD);
    }

    function testCreateEventOffChainIdMappingSet() public {
        _createEvent();
        assertEq(smartContract.offChainIdExists("abc"), true);
        assertEq(smartContract.offChainIdToEventId("abc"), 0);
    }

    function testCreateEventWithZeroPrice() public {
        address[] memory participants = new address[](1);
        participants[0] = address(0x123);
        vm.expectRevert(SmartContract.NotEnoughFunds.selector);
        smartContract.createEvent("abc", 0, participants);
    }

    function testCreateEventWithDuplicateOffChainId() public {
        _createEvent();
        address[] memory participants = new address[](1);
        participants[0] = address(0x123);
        // overwrite — νέο event με ίδιο offChainId
        smartContract.createEvent("abc", PRICE_USD, participants);
        assertEq(smartContract.logEvents("abc"), 1);
    }

    function testCreateEventWithSingleParticipant() public {
        address[] memory participants = new address[](1);
        participants[0] = address(0x123);
        smartContract.createEvent("single", 20e18, participants);

        (
            ,
            ,
            ,
            uint256 totalAmount,
            uint256 shareAmount,
            uint256 participantsCount,
            ,

        ) = smartContract.getEvent("single");

        assertEq(totalAmount, 20e18);
        assertEq(shareAmount, 10e18); // 20e18 / 2
        assertEq(participantsCount, 2);
    }

    function testCreateEventEmitsEvent() public {
        address[] memory participants = new address[](2);
        participants[0] = address(0x123);
        participants[1] = address(0x456);

        vm.expectEmit(true, true, true, true);
        emit SmartContract.EventCreated(
            0,
            "abc",
            address(this),
            PRICE_USD,
            SHARE_USD
        );
        smartContract.createEvent("abc", PRICE_USD, participants);
    }

    // =========================================================
    // PAYMENT
    // =========================================================

    function testPayment() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: SHARE_WEI}("abc");

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentTransfersEtherToOwner() public {
        _createEvent();
        uint256 ownerBefore = address(this).balance;

        vm.prank(address(0x123));
        smartContract.payment{value: SHARE_WEI}("abc");

        assertEq(address(this).balance, ownerBefore + SHARE_WEI);
    }

    function testPaymentWithinToleranceUnder() public {
        _createEvent();
        // 1% under share — εντός 2% tolerance
        uint256 slightlyUnder = SHARE_WEI - (SHARE_WEI / 200);

        vm.prank(address(0x123));
        smartContract.payment{value: slightlyUnder}("abc");

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentWithinToleranceOver() public {
        _createEvent();
        // 1% over share — εντός 2% tolerance
        uint256 slightlyOver = SHARE_WEI + (SHARE_WEI / 200);

        vm.prank(address(0x123));
        smartContract.payment{value: slightlyOver}("abc");

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentWithInvalidEventId() public {
        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.payment{value: SHARE_WEI}("xyz");
    }

    function testPaymentWhenOwnerTriesToPay() public {
        _createEvent();
        vm.expectRevert(SmartContract.NotAllowed.selector);
        smartContract.payment{value: SHARE_WEI}("abc");
    }

    function testPaymentWhenEventIsClosed() public {
        _createEvent();
        smartContract.closeEvent("abc");

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.EventClosed.selector);
        smartContract.payment{value: SHARE_WEI}("abc");
    }

    function testPaymentWhenNotAParticipant() public {
        _createEvent();

        vm.prank(address(0x789));
        vm.expectRevert(SmartContract.NotAParticipant.selector);
        smartContract.payment{value: SHARE_WEI}("abc");
    }

    function testPaymentWhenAlreadyPaid() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: SHARE_WEI}("abc");

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.HasAlreadyPaid.selector);
        smartContract.payment{value: SHARE_WEI}("abc");
    }

    function testPaymentWithNotEnoughEther() public {
        _createEvent();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.NotEnoughEther.selector);
        smartContract.payment{value: SHARE_WEI / 2}("abc");
    }

    function testPaymentWithTooMuchEther() public {
        _createEvent();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.TooMuchEther.selector);
        smartContract.payment{value: SHARE_WEI * 2}("abc");
    }

    function testPaymentEmitsEvent() public {
        _createEvent();

        vm.prank(address(0x123));
        vm.expectEmit(false, false, false, false); // just check it emits
        emit SmartContract.Payment(address(0x123), 0, "abc", 0, address(this));
        smartContract.payment{value: SHARE_WEI}("abc");
    }

    function testAllParticipantsPay() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: SHARE_WEI}("abc");

        vm.prank(address(0x456));
        smartContract.payment{value: SHARE_WEI}("abc");

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

    function testOwnerReceivesBothPayments() public {
        _createEvent();
        uint256 ownerBefore = address(this).balance;

        vm.prank(address(0x123));
        smartContract.payment{value: SHARE_WEI}("abc");

        vm.prank(address(0x456));
        smartContract.payment{value: SHARE_WEI}("abc");

        assertEq(address(this).balance, ownerBefore + SHARE_WEI * 2);
    }

    // =========================================================
    // GET SHARED PRICE IN ETH
    // =========================================================

    function testGetSharedPriceInEth() public {
        _createEvent();
        uint256 weiPrice = smartContract.getSharedPriceInEth("abc");
        // $10 / $3000 per ETH = 0.003333... ETH = 3333333333333333 Wei
        assertApproxEqRel(weiPrice, SHARE_WEI, 0.01e18); // 1% tolerance
    }

    function testGetSharedPriceInEthChangesWithEthPrice() public {
        _createEvent();
        uint256 weiAt3000 = smartContract.getSharedPriceInEth("abc");

        // ETH τώρα $6000 — χρειάζεσαι μισό ETH
        mockPriceFeed.updateAnswer(600000000000);
        uint256 weiAt6000 = smartContract.getSharedPriceInEth("abc");

        assertApproxEqRel(weiAt3000, weiAt6000 * 2, 0.01e18);
    }

    function testGetSharedPriceInEthWithInvalidEventId() public {
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.getSharedPriceInEth("xyz");
    }

    // =========================================================
    // COMPLETED
    // =========================================================

    function testIsEventComplete() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: SHARE_WEI}("abc");

        vm.prank(address(0x456));
        smartContract.payment{value: SHARE_WEI}("abc");

        assertEq(smartContract.completed("abc"), true);
    }

    function testEventIsNotCompleteAfterOnePayment() public {
        _createEvent();

        vm.prank(address(0x123));
        smartContract.payment{value: SHARE_WEI}("abc");

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
        ) = smartContract.getEvent("abc");

        assertEq(eventId, 0);
        assertEq(offChainId, "abc");
        assertEq(eventOwner, address(this));
        assertEq(totalAmount, PRICE_USD);
        assertEq(shareAmount, SHARE_USD);
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
        assertEq(smartContract.getPrice("abc"), SHARE_USD);
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
        smartContract.closeEvent("abc"); // δεν κάνει revert

        (, , , , , , , SmartContract.EventStatus status) = smartContract
            .getEvent("abc");
        assertEq(uint(status), uint(SmartContract.EventStatus.Closed));
    }

    // =========================================================
    // FUZZ TESTS
    // =========================================================

    function testFuzzCreateEventShareCalculation(
        uint256 price,
        uint8 numParticipants
    ) public {
        vm.assume(numParticipants > 0 && numParticipants <= 50);
        vm.assume(price > 0 && price <= 1_000_000e18);

        address[] memory participants = new address[](numParticipants);
        for (uint256 i = 0; i < numParticipants; i++) {
            participants[i] = address(uint160(i + 1));
        }

        smartContract.createEvent("fuzz", price, participants);

        uint256 totalParticipants = uint256(numParticipants) + 1;
        uint256 expectedShare = price / totalParticipants;
        assertEq(smartContract.getPrice("fuzz"), expectedShare);
    }
}
