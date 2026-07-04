// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {SmartContract} from "../src/SmartContract.sol";
import {Test} from "forge-std/Test.sol";
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

// ─────────────────────────────────────────────
// Mock Chainlink Price Feed
// ETH/USD = $3000 (8 decimals → 300000000000)
// Υλοποιεί πλήρως το AggregatorV3Interface ώστε να
// μπορεί να περαστεί απευθείας όπου ζητείται
// AggregatorV3Interface (χωρίς implicit conversion error).
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
// Contract με receive/fallback ώστε να μπορεί να
// γίνει owner ενός event, αλλά ΔΕΝ δέχεται ETH.
// Χρησιμοποιείται για να καλυφθεί το branch
// ErrorTransferingEther στο paymentInEth().
// ─────────────────────────────────────────────
contract RejectingReceiver {
    SmartContract public target;

    constructor(SmartContract _target) {
        target = _target;
    }

    function createEvent(
        bytes32 offChainId,
        uint256 priceUsd,
        address[] memory participants
    ) external {
        target.createEvent(offChainId, priceUsd, participants);
    }

    // Σκόπιμα ΔΕΝ υπάρχει receive() ή fallback() payable
    // ώστε κάθε call{value: ...} προς αυτό το contract να αποτυγχάνει.
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

    // $30 total, 3 participants → $10/each
    uint256 constant PRICE_USD = 30e18;
    uint256 constant SHARE_USD = 10e18; // 30e18 / 3
    uint256 constant SHARE_WEI = 3333333333333333; // ~$10 at $3000/ETH

    receive() external payable {}

    function setUp() public {
        mockPriceFeed = new MockV3Aggregator(ETH_PRICE);
        mockTokenPriceFeed = new MockV3Aggregator(TOKEN_PRICE);
        mockToken = new MockERC20();

        // Ο constructor του SmartContract δεν δέχεται arguments
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

    // Το contract κάνει revert σε duplicate offChainId αντί να το αντικαταστήσει.
    function testCreateEventWithDuplicateOffChainIdReverts() public {
        _createEvent();
        address[] memory participants = new address[](1);
        participants[0] = address(0x123);

        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.createEvent("abc", PRICE_USD, participants);
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
    // PAYMENT — ETH
    // =========================================================

    function testPaymentEthWhenEthNotSupported() public {
        _createEvent();
        // _supportEth() ΔΕΝ καλείται

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    function testPaymentEth() public {
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
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
        // 1% under share — μέσα στο 2% tolerance
        uint256 slightlyUnder = SHARE_WEI - (SHARE_WEI / 200);

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: slightlyUnder}("abc");

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentEthWithinToleranceOver() public {
        _createEvent();
        _supportEth();
        // 1% over share — μέσα στο 2% tolerance
        uint256 slightlyOver = SHARE_WEI + (SHARE_WEI / 200);

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: slightlyOver}("abc");

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
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
        vm.expectEmit(false, false, false, false); // ελέγχει μόνο ότι γίνεται emit
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
        // Ο owner του event είναι ένα contract που δεν δέχεται ETH,
        // ώστε να καλυφθεί το branch ErrorTransferingEther.
        RejectingReceiver rejecter = new RejectingReceiver(smartContract);

        address[] memory participants = new address[](2);
        participants[0] = address(0x123);
        participants[1] = address(0x456);
        rejecter.createEvent("reject", PRICE_USD, participants);

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
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentInTokenTransfersTokenToOwner() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
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
        // _supportMockToken() ΔΕΝ καλείται

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
            address(mockToken)
        );
        uint256 slightlyUnder = tokenShare - (tokenShare / 200);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), slightlyUnder);
        smartContract.paymentInToken("abc", address(mockToken), slightlyUnder);
        vm.stopPrank();

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentInTokenWithinToleranceOver() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(mockToken)
        );
        uint256 slightlyOver = tokenShare + (tokenShare / 200);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), slightlyOver);
        smartContract.paymentInToken("abc", address(mockToken), slightlyOver);
        vm.stopPrank();

        (, , , , , , uint256 havePaidParticipants, ) = smartContract.getEvent(
            "abc"
        );
        assertEq(havePaidParticipants, 2);
    }

    function testPaymentInTokenOwnerTriesToPay() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
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

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(mockToken)
        );

        vm.startPrank(address(0x789));
        vm.expectRevert(SmartContract.NotAParticipant.selector);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();
    }

    function testPaymentInTokenWhenAlreadyPaid() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
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
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        vm.expectEmit(false, false, false, false); // ελέγχει μόνο ότι γίνεται emit
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

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), tokenShare);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();

        vm.startPrank(address(0x456));
        mockToken.approve(address(smartContract), tokenShare);
        smartContract.paymentInToken("abc", address(mockToken), tokenShare);
        vm.stopPrank();

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

    function testOwnerReceivesBothTokenPayments() public {
        _createEvent();
        _supportMockToken();

        uint256 tokenShare = smartContract.getSharedPriceInToken(
            "abc",
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
        // Δεν κάνει revert ακόμα κι αν το token δεν ήταν ποτέ supported —
        // το delete σε μη-υπάρχον mapping entry είναι no-op.
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
            address(0)
        );
        // $10 / $3000 ανά ETH ≈ 0.003333... ETH
        assertApproxEqRel(weiPrice, SHARE_WEI, 0.01e18); // 1% tolerance
    }

    function testGetSharedPriceInTokenChangesWithPrice() public {
        _createEvent();
        _supportEth();
        uint256 weiAt3000 = smartContract.getSharedPriceInToken(
            "abc",
            address(0)
        );

        // Το ETH τώρα κοστίζει $6000 — χρειάζεται μισό ETH
        mockPriceFeed.updateAnswer(600000000000);
        uint256 weiAt6000 = smartContract.getSharedPriceInToken(
            "abc",
            address(0)
        );

        assertApproxEqRel(weiAt3000, weiAt6000 * 2, 0.01e18);
    }

    function testGetSharedPriceInTokenWithInvalidEventId() public {
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.getSharedPriceInToken("xyz", address(0));
    }

    // =========================================================
    // PRICE CONVERTER — require(answer > 0) branch
    // =========================================================

    function testGetSharedPriceRevertsOnZeroAnswer() public {
        _createEvent();
        _supportEth();
        mockPriceFeed.updateAnswer(0);

        vm.expectRevert(bytes("Invalid price"));
        smartContract.getSharedPriceInToken("abc", address(0));
    }

    function testGetSharedPriceRevertsOnNegativeAnswer() public {
        _createEvent();
        _supportEth();
        mockPriceFeed.updateAnswer(-1);

        vm.expectRevert(bytes("Invalid price"));
        smartContract.getSharedPriceInToken("abc", address(0));
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
    // RECEIVE / FALLBACK
    // =========================================================

    function testReceiveReverts() public {
        vm.expectRevert(bytes("Use payment() function"));
        (bool success, ) = address(smartContract).call{value: 1 ether}("");
        // Το call{value} πάνω σε revert επιστρέφει false, όχι propagate εδώ,
        // οπότε ελέγχουμε ρητά και το success flag.
        success; // silence unused warning if vm.expectRevert δεν πιάσει το χαμηλού επιπέδου call
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
