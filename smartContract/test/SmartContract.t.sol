// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {SmartContract} from "../src/SmartContract.sol";
import {Test} from "forge-std/Test.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// ─────────────────────────────────────────────
// Mock Chainlink Price Feed
// ETH/USD = $3000 (8 decimals → 300000000000)
// ─────────────────────────────────────────────
contract MockV3Aggregator is AggregatorV3Interface {
    int256 public answer;
    uint8 private _decimals = 8;

    constructor(int256 _initialAnswer) {
        answer = _initialAnswer;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function description() external pure override returns (string memory) {
        return "Mock Price Feed";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(
        uint80 _roundId
    )
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (_roundId, answer, 0, 0, _roundId);
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (0, answer, 0, 0, 0);
    }

    function updateAnswer(int256 _answer) external {
        answer = _answer;
    }
}

// ─────────────────────────────────────────────
// Minimal Mock ERC20 (just enough for SafeERC20)
// ─────────────────────────────────────────────
contract MockERC20 {
    string public name = "MockToken";
    string public symbol = "MOCK";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

// ─────────────────────────────────────────────
// A contract that can own an event but rejects
// plain ETH transfers, used to cover the
// ErrorTransferingEther branch in paymentInEth().
// ─────────────────────────────────────────────
contract RejectingReceiver {
    SmartContract public target;

    constructor(SmartContract _target) {
        target = _target;
    }

    function createEvent(
        bytes32 offChainId,
        uint256 priceUsd,
        address[] memory participants,
        uint256[] memory shares
    ) external {
        target.createEvent(offChainId, priceUsd, participants, shares);
    }

    // Intentionally no receive() / payable fallback() so any
    // call{value: ...} sent to this contract fails.
}

contract SmartContractTest is Test {
    SmartContract public smartContract;
    MockV3Aggregator public mockPriceFeed;
    MockV3Aggregator public mockTokenPriceFeed;
    MockERC20 public mockToken;

    // ETH price = $3000, 8 decimals
    int256 constant ETH_PRICE = 300000000000;

    // Token price = $15, 8 decimals
    int256 constant TOKEN_PRICE = 1500000000;

    // 3 participants (owner + 2), $10 each => $30 total
    uint256 constant SHARE_USD = 10e18;
    uint256 constant PRICE_USD = 30e18; // 3 * SHARE_USD
    uint256 constant SHARE_WEI = 3333333333333333; // ~$10 at $3000/ETH

    receive() external payable {}

    function setUp() public {
        mockPriceFeed = new MockV3Aggregator(ETH_PRICE);
        mockTokenPriceFeed = new MockV3Aggregator(TOKEN_PRICE);
        mockToken = new MockERC20();

        smartContract = new SmartContract();

        vm.deal(address(this), 100 ether);
        vm.deal(address(0x123), 100 ether);
        vm.deal(address(0x456), 100 ether);
        vm.deal(address(0x789), 100 ether);

        mockToken.mint(address(0x123), 1000e18);
        mockToken.mint(address(0x456), 1000e18);
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    function _participantsAndShares()
        internal
        view
        returns (address[] memory participants, uint256[] memory shares)
    {
        participants = new address[](3);
        participants[0] = address(this); // owner must be a participant
        participants[1] = address(0x123);
        participants[2] = address(0x456);

        shares = new uint256[](3);
        shares[0] = SHARE_USD;
        shares[1] = SHARE_USD;
        shares[2] = SHARE_USD;
    }

    function _createEvent() internal {
        (
            address[] memory participants,
            uint256[] memory shares
        ) = _participantsAndShares();
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    function _createEvent2() internal {
        (
            address[] memory participants,
            uint256[] memory shares
        ) = _participantsAndShares();
        smartContract.createEvent("def", PRICE_USD, participants, shares);
    }

    function _supportMockToken() internal {
        smartContract.setSupportedToken(
            address(mockToken),
            mockTokenPriceFeed,
            18,
            true
        );
    }

    function _supportEth() internal {
        smartContract.setSupportedToken(address(0), mockPriceFeed, 18, true);
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
            uint256 participantsCount,
            uint256 havePaidParticipants,
            SmartContract.EventStatus status
        ) = smartContract.getEvent("abc");

        assertEq(eventId, 0);
        assertEq(offChainId, "abc");
        assertEq(eventOwner, address(this));
        assertEq(totalAmount, PRICE_USD);
        assertEq(participantsCount, 3);
        assertEq(havePaidParticipants, 1); // owner pre-paid
        assertEq(uint(status), uint(SmartContract.EventStatus.Opened));
    }

    function testCreateEventOwnerIsPrePaid() public {
        _createEvent();
        (, , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
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
        uint256[] memory shares = new uint256[](0);
        vm.expectRevert(SmartContract.NotEnoughParticipants.selector);
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    function testCreateEventShareAmountStoredPerParticipant() public {
        _createEvent();
        assertEq(smartContract.getPrice("abc", address(this)), SHARE_USD);
        assertEq(smartContract.getPrice("abc", address(0x123)), SHARE_USD);
        assertEq(smartContract.getPrice("abc", address(0x456)), SHARE_USD);
    }

    function testCreateEventOffChainIdMappingSet() public {
        _createEvent();
        assertEq(smartContract.offChainIdExists("abc"), true);
        assertEq(smartContract.offChainIdToEventId("abc"), 0);
    }

    function testCreateEventWithZeroPrice() public {
        address[] memory participants = new address[](1);
        participants[0] = address(this);
        uint256[] memory shares = new uint256[](1);
        shares[0] = 1;
        vm.expectRevert(SmartContract.NotEnoughFunds.selector);
        smartContract.createEvent("abc", 0, participants, shares);
    }

    function testCreateEventWithMismatchedArrayLengths() public {
        address[] memory participants = new address[](2);
        participants[0] = address(this);
        participants[1] = address(0x123);
        uint256[] memory shares = new uint256[](1);
        shares[0] = PRICE_USD;

        vm.expectRevert(SmartContract.NotEnoughParticipants.selector);
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    function testCreateEventWithDuplicateOffChainIdReverts() public {
        _createEvent();
        address[] memory participants = new address[](1);
        participants[0] = address(this);
        uint256[] memory shares = new uint256[](1);
        shares[0] = PRICE_USD;

        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    function testCreateEventWithSingleParticipant() public {
        address[] memory participants = new address[](1);
        participants[0] = address(this);
        uint256[] memory shares = new uint256[](1);
        shares[0] = 20e18;

        smartContract.createEvent("single", 20e18, participants, shares);

        (
            ,
            ,
            ,
            uint256 totalAmount,
            uint256 participantsCount,
            ,

        ) = smartContract.getEvent("single");

        assertEq(totalAmount, 20e18);
        assertEq(participantsCount, 1);
        assertEq(smartContract.getPrice("single", address(this)), 20e18);
    }

    function testCreateEventWithZeroAddressParticipantReverts() public {
        address[] memory participants = new address[](2);
        participants[0] = address(this);
        participants[1] = address(0);
        uint256[] memory shares = new uint256[](2);
        shares[0] = 15e18;
        shares[1] = 15e18;

        vm.expectRevert(SmartContract.InvalidParticipant.selector);
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    function testCreateEventWithZeroShareReverts() public {
        address[] memory participants = new address[](2);
        participants[0] = address(this);
        participants[1] = address(0x123);
        uint256[] memory shares = new uint256[](2);
        shares[0] = PRICE_USD;
        shares[1] = 0;

        vm.expectRevert(SmartContract.InvalidShare.selector);
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    function testCreateEventWithoutOwnerAsParticipantReverts() public {
        address[] memory participants = new address[](2);
        participants[0] = address(0x123);
        participants[1] = address(0x456);
        uint256[] memory shares = new uint256[](2);
        shares[0] = 15e18;
        shares[1] = 15e18;

        vm.expectRevert(SmartContract.OwnerNotParticipant.selector);
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    function testCreateEventWithDuplicateParticipantReverts() public {
        address[] memory participants = new address[](3);
        participants[0] = address(this);
        participants[1] = address(0x123);
        participants[2] = address(0x123);
        uint256[] memory shares = new uint256[](3);
        shares[0] = 10e18;
        shares[1] = 10e18;
        shares[2] = 10e18;

        vm.expectRevert(SmartContract.DuplicateParticipant.selector);
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    function testCreateEventWithSharesNotMatchingPriceReverts() public {
        address[] memory participants = new address[](2);
        participants[0] = address(this);
        participants[1] = address(0x123);
        uint256[] memory shares = new uint256[](2);
        shares[0] = 10e18;
        shares[1] = 10e18; // sums to 20e18, but priceUsd is 30e18

        vm.expectRevert(SmartContract.NotEnoughFunds.selector);
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    function testCreateEventEmitsEvent() public {
        (
            address[] memory participants,
            uint256[] memory shares
        ) = _participantsAndShares();

        vm.expectEmit(true, true, true, true);
        emit SmartContract.EventCreated(0, "abc", address(this), PRICE_USD);
        smartContract.createEvent("abc", PRICE_USD, participants, shares);
    }

    // =========================================================
    // PAYMENT — ETH
    // =========================================================

    function testPaymentEthWhenEthNotSupported() public {
        _createEvent();
        // _supportEth() NOT called

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    function testPaymentEth() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        (, , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentEthTransfersEtherToOwner() public {
        _createEvent();
        _supportEth();
        uint256 ownerBefore = address(this).balance;

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        assertEq(address(this).balance, ownerBefore + SHARE_WEI);
    }

    function testPaymentEthWithinToleranceUnder() public {
        _createEvent();
        _supportEth();
        uint256 slightlyUnder = SHARE_WEI - (SHARE_WEI / 200);

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: slightlyUnder}("abc");

        (, , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentEthWithinToleranceOver() public {
        _createEvent();
        _supportEth();
        uint256 slightlyOver = SHARE_WEI + (SHARE_WEI / 200);

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: slightlyOver}("abc");

        (, , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentEthWithInvalidEventId() public {
        _supportEth();
        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("xyz");
    }

    function testPaymentEthWhenOwnerTriesToPay() public {
        _createEvent();
        _supportEth();
        vm.expectRevert(SmartContract.NotAllowed.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    function testPaymentEthWhenEventIsClosed() public {
        _createEvent();
        _supportEth();
        smartContract.closeEvent("abc");

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.EventClosed.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    function testPaymentEthWhenNotAParticipant() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x789));
        vm.expectRevert(SmartContract.NotAParticipant.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    function testPaymentEthWhenAlreadyPaid() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.HasAlreadyPaid.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    function testPaymentEthWithNotEnoughFunds() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.NotEnoughFunds.selector);
        smartContract.paymentInEth{value: SHARE_WEI / 2}("abc");
    }

    function testPaymentEthWithTooMuchFunds() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.TooMuchFunds.selector);
        smartContract.paymentInEth{value: SHARE_WEI * 2}("abc");
    }

    function testPaymentEthEmitsEvent() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        vm.expectEmit(false, false, false, false); // only checks that an emit occurs
        emit SmartContract.Payment(
            address(0x123),
            0,
            "abc",
            0,
            address(this),
            address(0)
        );
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    function testAllParticipantsPayEth() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        vm.prank(address(0x456));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        (
            ,
            ,
            ,
            ,
            uint256 participantsCount,
            uint256 havePaidParticipants,

        ) = smartContract.getEvent("abc");
        assertEq(havePaidParticipants, participantsCount);
    }

    function testOwnerReceivesBothEthPayments() public {
        _createEvent();
        _supportEth();
        uint256 ownerBefore = address(this).balance;

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        vm.prank(address(0x456));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        assertEq(address(this).balance, ownerBefore + SHARE_WEI * 2);
    }

    function testPaymentEthTransferFails() public {
        // The event owner is a contract that rejects plain ETH,
        // covering the ErrorTransferingEther branch.
        RejectingReceiver rejecter = new RejectingReceiver(smartContract);

        address[] memory participants = new address[](3);
        participants[0] = address(rejecter);
        participants[1] = address(0x123);
        participants[2] = address(0x456);
        uint256[] memory shares = new uint256[](3);
        shares[0] = SHARE_USD;
        shares[1] = SHARE_USD;
        shares[2] = SHARE_USD;

        rejecter.createEvent("reject", PRICE_USD, participants, shares);

        _supportEth();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.ErrorTransferingEther.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("reject");
    }

    // =========================================================
    // PAYMENT — ERC20
    // =========================================================

    function testPaymentInToken() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();

        (, , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentInTokenTransfersTokenToOwner() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 ownerBefore = mockToken.balanceOf(address(this));

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(address(this)), ownerBefore + tokenShare);
    }

    function testPaymentInTokenWhenTokenNotSupported() public {
        _createEvent();
        // _supportMockToken() NOT called

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), 1000e18);
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.paymentInToken("abc", address(mockToken), 1000e18);
        vm.stopPrank();
    }

    function testPaymentInTokenWithinToleranceUnder() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 slightlyUnder = tokenShare - (tokenShare / 200);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), slightlyUnder);
        smartContract.paymentInToken("abc", address(mockToken), slightlyUnder);
        vm.stopPrank();

        (, , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentInTokenWithinToleranceOver() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 slightlyOver = tokenShare + (tokenShare / 200);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), slightlyOver);
        smartContract.paymentInToken("abc", address(mockToken), slightlyOver);
        vm.stopPrank();

        (, , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentInTokenOwnerTriesToPay() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(this),
            address(mockToken)
        );

        vm.startPrank(address(this));
        mockToken.approve(address(smartContract), tokenShare);
        vm.expectRevert(SmartContract.NotAllowed.selector);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();
    }

    function testPaymentInTokenWhenEventIsClosed() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        smartContract.closeEvent("abc");

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        vm.expectRevert(SmartContract.EventClosed.selector);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();
    }

    function testPaymentInTokenWhenNotAParticipant() public {
        _createEvent();
        _supportMockToken();

        vm.startPrank(address(0x789));
        mockToken.approve(address(smartContract), 1000e18);
        vm.expectRevert(SmartContract.NotAParticipant.selector);
        smartContract.paymentInToken("abc", address(mockToken), 1000e18);
        vm.stopPrank();
    }

    function testPaymentInTokenWhenAlreadyPaid() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare * 2);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);

        vm.expectRevert(SmartContract.HasAlreadyPaid.selector);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();
    }

    function testPaymentInTokenWithInvalidEventId() public {
        _supportMockToken();
        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), 1000e18);
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.paymentInToken("xyz", address(mockToken), 1000e18);
        vm.stopPrank();
    }

    function testPaymentInTokenWithNotEnoughFunds() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        vm.expectRevert(SmartContract.NotEnoughFunds.selector);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare / 2);
        vm.stopPrank();
    }

    function testPaymentInTokenWithTooMuchFunds() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare * 2);
        vm.expectRevert(SmartContract.TooMuchFunds.selector);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare * 2);
        vm.stopPrank();
    }

    function testPaymentInTokenEmitsEvent() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        vm.expectEmit(false, false, false, false); // only checks that an emit occurs
        emit SmartContract.Payment(
            address(0x123),
            0,
            "abc",
            0,
            address(this),
            address(mockToken)
        );
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();
    }

    function testPaymentInTokenWithUnsupportedTokenAddress() public {
        _createEvent();
        _supportMockToken();

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), 1000e18);
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.paymentInToken("abc", address(0x999), 1000e18);
        vm.stopPrank();
    }

    function testAllParticipantsPayInToken() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare123 = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 tokenShare456 = smartContract.getSharedPriceInToken(
            "abc",
            address(0x456),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare123);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare123);
        vm.stopPrank();

        vm.startPrank(address(0x456));
        mockToken.approve(address(smartContract), tokenShare456);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare456);
        vm.stopPrank();

        (
            ,
            ,
            ,
            ,
            uint256 participantsCount,
            uint256 havePaidParticipants,

        ) = smartContract.getEvent("abc");
        assertEq(havePaidParticipants, participantsCount);
    }

    function testOwnerReceivesBothTokenPayments() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 ownerBefore = mockToken.balanceOf(address(this));

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();

        vm.startPrank(address(0x456));
        mockToken.approve(address(smartContract), tokenShare);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();

        assertEq(
            mockToken.balanceOf(address(this)),
            ownerBefore + tokenShare * 2
        );
    }

    // =========================================================
    // SUPPORTED TOKENS
    // =========================================================

    function testSetSupportedToken() public {
        _supportMockToken();
        (
            address tokenAddress,
            ,
            uint8 tokenDecimals,
            bool isSupported
        ) = smartContract.supportedTokens(address(mockToken));

        assertEq(tokenAddress, address(mockToken));
        assertEq(tokenDecimals, 18);
        assertEq(isSupported, true);
    }

    function testSetSupportedTokenWhenNotOwner() public {
        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.NotOwner.selector);
        smartContract.setSupportedToken(
            address(mockToken),
            mockTokenPriceFeed,
            18,
            true
        );
    }

    function testSetSupportedTokenCanDisable() public {
        _supportMockToken();
        smartContract.setSupportedToken(
            address(mockToken),
            mockTokenPriceFeed,
            18,
            false
        );
        (, , , bool isSupported) = smartContract.supportedTokens(
            address(mockToken)
        );
        assertEq(isSupported, false);
    }

    // =========================================================
    // REMOVE SUPPORTED TOKEN
    // =========================================================

    function testRemoveSupportedToken() public {
        _supportMockToken();
        smartContract.removeSupportedToken(address(mockToken));

        (
            address tokenAddress,
            ,
            uint8 tokenDecimals,
            bool isSupported
        ) = smartContract.supportedTokens(address(mockToken));

        assertEq(tokenAddress, address(0));
        assertEq(tokenDecimals, 0);
        assertEq(isSupported, false);
    }

    function testRemoveSupportedTokenWhenNotOwner() public {
        _supportMockToken();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.NotOwner.selector);
        smartContract.removeSupportedToken(address(mockToken));
    }

    function testRemoveSupportedTokenThatWasNeverSupported() public {
        // delete on a non-existent mapping entry is a no-op, no revert
        smartContract.removeSupportedToken(address(mockToken));

        (, , , bool isSupported) = smartContract.supportedTokens(
            address(mockToken)
        );
        assertEq(isSupported, false);
    }

    function testPaymentInTokenAfterTokenRemoved() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        smartContract.removeSupportedToken(address(mockToken));

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();
    }

    function testRemoveSupportedEth() public {
        _supportEth();
        smartContract.removeSupportedToken(address(0));

        (, , , bool isSupported) = smartContract.supportedTokens(address(0));
        assertEq(isSupported, false);
    }

    function testPaymentEthAfterEthRemoved() public {
        _createEvent();
        _supportEth();
        smartContract.removeSupportedToken(address(0));

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    // =========================================================
    // GET SHARED PRICE IN TOKEN
    // =========================================================

    function testGetSharedPriceInTokenEth() public {
        _createEvent();
        _supportEth();
        uint256 weiPrice = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(0)
        );
        // $10 / $3000 per ETH ≈ 0.003333... ETH
        assertApproxEqRel(weiPrice, SHARE_WEI, 0.01e18); // 1% tolerance
    }

    function testGetSharedPriceInTokenChangesWithPrice() public {
        _createEvent();
        _supportEth();
        uint256 weiAt3000 = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(0)
        );

        // ETH now costs $6000 — half the ETH is needed
        mockPriceFeed.updateAnswer(600000000000);
        uint256 weiAt6000 = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(0)
        );

        assertApproxEqRel(weiAt3000, weiAt6000 * 2, 0.01e18);
    }

    function testGetSharedPriceInTokenWithInvalidEventId() public {
        _supportEth();
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.getSharedPriceInToken("xyz", address(0x123), address(0));
    }

    function testGetSharedPriceInTokenWithUnsupportedToken() public {
        _createEvent();
        // _supportEth() NOT called
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.getSharedPriceInToken("abc", address(0x123), address(0));
    }

    function testGetSharedPriceInTokenDiffersPerParticipant() public {
        address[] memory participants = new address[](3);
        participants[0] = address(this);
        participants[1] = address(0x123);
        participants[2] = address(0x456);
        uint256[] memory shares = new uint256[](3);
        shares[0] = 5e18;
        shares[1] = 10e18;
        shares[2] = 15e18;
        smartContract.createEvent("uneven", 30e18, participants, shares);
        _supportEth();

        uint256 share123 = smartContract.getSharedPriceInToken(
            "uneven",
            address(0x123),
            address(0)
        );
        uint256 share456 = smartContract.getSharedPriceInToken(
            "uneven",
            address(0x456),
            address(0)
        );

        assertApproxEqRel(share456, (share123 * 3) / 2, 0.01e18);
    }

    // =========================================================
    // PRICE CONVERTER — require(answer > 0) branch
    // =========================================================

    function testGetSharedPriceRevertsOnZeroAnswer() public {
        _createEvent();
        _supportEth();
        mockPriceFeed.updateAnswer(0);

        vm.expectRevert(bytes("Invalid price"));
        smartContract.getSharedPriceInToken("abc", address(0x123), address(0));
    }

    function testGetSharedPriceRevertsOnNegativeAnswer() public {
        _createEvent();
        _supportEth();
        mockPriceFeed.updateAnswer(-1);

        vm.expectRevert(bytes("Invalid price"));
        smartContract.getSharedPriceInToken("abc", address(0x123), address(0));
    }

    function testPaymentEthRevertsOnNonPositivePriceFeed() public {
        _createEvent();
        _supportEth();
        mockPriceFeed.updateAnswer(0);

        vm.prank(address(0x123));
        vm.expectRevert(bytes("Invalid price"));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    // =========================================================
    // COMPLETED
    // =========================================================

    function testIsEventComplete() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        vm.prank(address(0x456));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        assertEq(smartContract.completed("abc"), true);
    }

    function testEventIsNotCompleteAfterOnePayment() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

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
            uint256 participantsCount,
            uint256 havePaidParticipants,
            SmartContract.EventStatus status
        ) = smartContract.getEvent("abc");

        assertEq(eventId, 0);
        assertEq(offChainId, "abc");
        assertEq(eventOwner, address(this));
        assertEq(totalAmount, PRICE_USD);
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
        assertEq(smartContract.getPrice("abc", address(0x123)), SHARE_USD);
    }

    function testGetPriceForNonParticipantReturnsZero() public {
        _createEvent();
        assertEq(smartContract.getPrice("abc", address(0x789)), 0);
    }

    function testGetPriceWithInvalidEventId() public {
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.getPrice("xyz", address(0x123));
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

        (, , , , , , SmartContract.EventStatus status) = smartContract.getEvent(
            "abc"
        );
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

    function testCloseAlreadyClosedEventReverts() public {
        _createEvent();
        smartContract.closeEvent("abc");

        vm.expectRevert(SmartContract.EventClosed.selector);
        smartContract.closeEvent("abc");
    }

    // =========================================================
    // RECEIVE / FALLBACK
    // =========================================================

    function testReceiveReverts() public {
        vm.expectRevert(bytes("Use payment() function"));
        (bool success, ) = address(smartContract).call{value: 1 ether}("");
        success; // silence unused-variable warning
    }

    function testFallbackReverts() public {
        vm.expectRevert(bytes("Use payment() function"));
        (bool success, ) = address(smartContract).call{value: 1 ether}(
            abi.encodeWithSignature("nonExistentFunction()")
        );
        success;
    }

    // =========================================================
    // FUZZ TESTS
    // =========================================================

    function testFuzzCreateEventShareCalculation(
        uint256 share,
        uint8 numParticipants
    ) public {
        vm.assume(numParticipants > 0 && numParticipants <= 50);
        uint256 total = uint256(numParticipants) + 1; // +1 for the owner
        vm.assume(share > 0 && share <= 1_000_000e18 / total);

        address[] memory participants = new address[](total);
        uint256[] memory shares = new uint256[](total);

        participants[0] = address(this);
        shares[0] = share;

        for (uint256 i = 1; i < total; i++) {
            participants[i] = address(uint160(100000 + i));
            shares[i] = share;
        }

        uint256 priceUsd = share * total;

        smartContract.createEvent("fuzz", priceUsd, participants, shares);

        assertEq(smartContract.getPrice("fuzz", address(this)), share);
        assertEq(
            smartContract.getPrice("fuzz", participants[total - 1]),
            share
        );

        (
            ,
            ,
            ,
            uint256 totalAmount,
            uint256 participantsCount,
            ,

        ) = smartContract.getEvent("fuzz");
        assertEq(totalAmount, priceUsd);
        assertEq(participantsCount, total);
    }

    function testFuzzCreateEventUnequalSharesMustMatchTotal(
        uint256 shareA,
        uint256 shareB
    ) public {
        vm.assume(shareA > 0 && shareA <= 500_000e18);
        vm.assume(shareB > 0 && shareB <= 500_000e18);

        address[] memory participants = new address[](2);
        participants[0] = address(this);
        participants[1] = address(0x123);
        uint256[] memory shares = new uint256[](2);
        shares[0] = shareA;
        shares[1] = shareB;

        uint256 correctTotal = shareA + shareB;

        smartContract.createEvent(
            "fuzzUneven",
            correctTotal,
            participants,
            shares
        );

        assertEq(smartContract.getPrice("fuzzUneven", address(this)), shareA);
        assertEq(smartContract.getPrice("fuzzUneven", address(0x123)), shareB);
    }
}
