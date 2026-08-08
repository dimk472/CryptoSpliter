// SPDX-License-Identifier: MIT
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
// Minimal Mock ERC20
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
// Rejects ETH transfers
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
}

contract SmartContractTest is Test {
    SmartContract public smartContract;
    MockV3Aggregator public mockPriceFeed;
    MockV3Aggregator public mockTokenPriceFeed;
    MockERC20 public mockToken;

    address public treasuryWallet = address(0x999);
    address public owner;
    uint256 constant PLATFORM_FEE_BPS = 50;

    int256 constant ETH_PRICE = 300000000000;
    int256 constant TOKEN_PRICE = 1500000000;

    uint256 constant SHARE_USD = 10e18;
    uint256 constant PRICE_USD = 30e18;
    uint256 constant SHARE_WEI = 3333333333333333;

    uint256 constant FEE_BPS = 50;
    uint256 constant FEE_DIVISOR = 10000;

    receive() external payable {}

    function setUp() public {
        owner = address(this);

        mockPriceFeed = new MockV3Aggregator(ETH_PRICE);
        mockTokenPriceFeed = new MockV3Aggregator(TOKEN_PRICE);
        mockToken = new MockERC20();

        smartContract = new SmartContract();

        smartContract.setTreasuryWallet(treasuryWallet);
        smartContract.setPlatformFee(PLATFORM_FEE_BPS);

        vm.deal(address(this), 100 ether);
        vm.deal(address(0x123), 100 ether);
        vm.deal(address(0x456), 100 ether);
        vm.deal(address(0x789), 100 ether);
        vm.deal(treasuryWallet, 0 ether);

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
        participants[0] = address(this);
        participants[1] = address(0x123);
        participants[2] = address(0x456);

        shares = new uint256[](3);
        shares[0] = SHARE_USD;
        shares[1] = SHARE_USD;
        shares[2] = SHARE_USD;
    }

    function _createEvent() internal {
        (address[] memory p, uint256[] memory s) = _participantsAndShares();
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function _createEvent2() internal {
        (address[] memory p, uint256[] memory s) = _participantsAndShares();
        smartContract.createEvent("def", PRICE_USD, p, s);
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

    function _calculateFee(uint256 amount) internal pure returns (uint256) {
        return (amount * FEE_BPS) / FEE_DIVISOR;
    }

    // =========================================================
    // CONSTRUCTOR
    // =========================================================
    function testConstructorSetsOwner() public view {
        assertEq(smartContract.contractOwner(), address(this));
    }

    // =========================================================
    // SET PLATFORM FEE
    // =========================================================
    function testSetPlatformFee() public {
        smartContract.setPlatformFee(100);
        assertEq(smartContract.platformFeeBps(), 100);
    }

    function testSetPlatformFeeMax() public {
        smartContract.setPlatformFee(500);
        assertEq(smartContract.platformFeeBps(), 500);
    }

    function testSetPlatformFeeTooHighReverts() public {
        vm.expectRevert(bytes("Fee too high"));
        smartContract.setPlatformFee(501);
    }

    function testSetPlatformFeeZero() public {
        smartContract.setPlatformFee(0);
        assertEq(smartContract.platformFeeBps(), 0);
    }

    function testSetPlatformFeeWhenNotOwner() public {
        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.NotOwner.selector);
        smartContract.setPlatformFee(100);
    }

    // =========================================================
    // SET TREASURY WALLET
    // =========================================================
    function testSetTreasuryWallet() public {
        smartContract.setTreasuryWallet(address(0x888));
        assertEq(smartContract.treasuryWallet(), address(0x888));
    }

    function testSetTreasuryWalletZeroAddressReverts() public {
        vm.expectRevert(bytes("Invalid address"));
        smartContract.setTreasuryWallet(address(0));
    }

    function testSetTreasuryWalletWhenNotOwner() public {
        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.NotOwner.selector);
        smartContract.setTreasuryWallet(address(0x888));
    }

    // =========================================================
    // TREASURY WALLET NOT SET
    // =========================================================
    function testPaymentEthWhenTreasuryNotSetReverts() public {
        SmartContract nc = new SmartContract();
        nc.setPlatformFee(PLATFORM_FEE_BPS);
        nc.setSupportedToken(address(0), mockPriceFeed, 18, true);

        address[] memory p = new address[](3);
        p[0] = address(this);
        p[1] = address(0x123);
        p[2] = address(0x456);
        uint256[] memory s = new uint256[](3);
        s[0] = SHARE_USD;
        s[1] = SHARE_USD;
        s[2] = SHARE_USD;

        nc.createEvent("nt", PRICE_USD, p, s);

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.TreasuryWalletNotSet.selector);
        nc.paymentInEth{value: SHARE_WEI}("nt");
    }

    function testPaymentInTokenWhenTreasuryNotSetReverts() public {
        SmartContract nc = new SmartContract();
        nc.setPlatformFee(PLATFORM_FEE_BPS);
        nc.setSupportedToken(address(mockToken), mockTokenPriceFeed, 18, true);

        address[] memory p = new address[](3);
        p[0] = address(this);
        p[1] = address(0x123);
        p[2] = address(0x456);
        uint256[] memory s = new uint256[](3);
        s[0] = SHARE_USD;
        s[1] = SHARE_USD;
        s[2] = SHARE_USD;

        nc.createEvent("nt2", PRICE_USD, p, s);

        uint256 ts = nc.getSharedPriceInToken(
            "nt2",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(nc), ts);
        vm.expectRevert(SmartContract.TreasuryWalletNotSet.selector);
        nc.paymentInToken("nt2", address(mockToken), ts);
        vm.stopPrank();
    }

    // =========================================================
    // FEE = 0
    // =========================================================
    function testPaymentEthWithZeroFee() public {
        smartContract.setPlatformFee(0);
        _createEvent();
        _supportEth();

        uint256 ob = address(this).balance;
        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        assertEq(address(this).balance, ob + SHARE_WEI);
        assertEq(treasuryWallet.balance, 0);
    }

    function testPaymentInTokenWithZeroFee() public {
        smartContract.setPlatformFee(0);
        _createEvent();
        _supportMockToken();

        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 ob = mockToken.balanceOf(address(this));
        uint256 tb = mockToken.balanceOf(treasuryWallet);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(address(this)), ob + ts);
        assertEq(mockToken.balanceOf(treasuryWallet), tb);
    }

    // =========================================================
    // PAYMENT ETH WITH MAX FEE
    // =========================================================
    function testPaymentEthWithMaxFee() public {
        smartContract.setPlatformFee(500);
        _createEvent();
        _supportEth();

        uint256 ef = (SHARE_WEI * 500) / 10000;
        uint256 tb = treasuryWallet.balance;

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        assertEq(treasuryWallet.balance, tb + ef);
        smartContract.setPlatformFee(PLATFORM_FEE_BPS);
    }

    function testPaymentInTokenWithMaxFee() public {
        smartContract.setPlatformFee(500);
        _createEvent();
        _supportMockToken();

        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 ef = (ts * 500) / 10000;
        uint256 tb = mockToken.balanceOf(treasuryWallet);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(treasuryWallet), tb + ef);
        smartContract.setPlatformFee(PLATFORM_FEE_BPS);
    }

    // =========================================================
    // CREATE EVENT
    // =========================================================
    function testCreateEvent() public {
        _createEvent();
        (
            uint256 id,
            bytes32 oid,
            address eo,
            uint256 ta,
            uint256 pc,
            uint256 hp,
            SmartContract.EventStatus st
        ) = smartContract.getEvent("abc");
        assertEq(id, 0);
        assertEq(oid, "abc");
        assertEq(eo, address(this));
        assertEq(ta, PRICE_USD);
        assertEq(pc, 3);
        assertEq(hp, 1);
        assertEq(uint(st), uint(SmartContract.EventStatus.Opened));
    }

    function testCreateEventOwnerIsPrePaid() public {
        _createEvent();
        (, , , , , uint256 hp, ) = smartContract.getEvent("abc");
        assertEq(hp, 1);
    }

    function testCreateMultipleEvents() public {
        _createEvent();
        _createEvent2();
        assertEq(smartContract.logEvents("abc"), 0);
        assertEq(smartContract.logEvents("def"), 1);
    }

    function testCreateEventWithNoParticipants() public {
        address[] memory p = new address[](0);
        uint256[] memory s = new uint256[](0);
        vm.expectRevert(SmartContract.NotEnoughParticipants.selector);
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function testCreateEventShareAmountStoredPerParticipant() public {
        _createEvent();
        assertEq(smartContract.getPrice("abc", address(this)), SHARE_USD);
        assertEq(smartContract.getPrice("abc", address(0x123)), SHARE_USD);
        assertEq(smartContract.getPrice("abc", address(0x456)), SHARE_USD);
    }

    function testCreateEventOffChainIdMappingSet() public {
        _createEvent();
        assertTrue(smartContract.offChainIdExists("abc"));
        assertEq(smartContract.offChainIdToEventId("abc"), 0);
    }

    function testCreateEventWithZeroPrice() public {
        address[] memory p = new address[](1);
        p[0] = address(this);
        uint256[] memory s = new uint256[](1);
        s[0] = 1;
        vm.expectRevert(SmartContract.NotEnoughFunds.selector);
        smartContract.createEvent("abc", 0, p, s);
    }

    function testCreateEventWithMismatchedArrayLengths() public {
        address[] memory p = new address[](2);
        p[0] = address(this);
        p[1] = address(0x123);
        uint256[] memory s = new uint256[](1);
        s[0] = PRICE_USD;
        vm.expectRevert(SmartContract.NotEnoughParticipants.selector);
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function testCreateEventWithDuplicateOffChainIdReverts() public {
        _createEvent();
        address[] memory p = new address[](1);
        p[0] = address(this);
        uint256[] memory s = new uint256[](1);
        s[0] = PRICE_USD;
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function testCreateEventWithSingleParticipant() public {
        address[] memory p = new address[](1);
        p[0] = address(this);
        uint256[] memory s = new uint256[](1);
        s[0] = 20e18;
        smartContract.createEvent("single", 20e18, p, s);
        (, , , uint256 ta, uint256 pc, , ) = smartContract.getEvent("single");
        assertEq(ta, 20e18);
        assertEq(pc, 1);
        assertEq(smartContract.getPrice("single", address(this)), 20e18);
    }

    function testCreateEventWithZeroAddressParticipantReverts() public {
        address[] memory p = new address[](2);
        p[0] = address(this);
        p[1] = address(0);
        uint256[] memory s = new uint256[](2);
        s[0] = 15e18;
        s[1] = 15e18;
        vm.expectRevert(SmartContract.InvalidParticipant.selector);
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function testCreateEventWithZeroShareReverts() public {
        address[] memory p = new address[](2);
        p[0] = address(this);
        p[1] = address(0x123);
        uint256[] memory s = new uint256[](2);
        s[0] = PRICE_USD;
        s[1] = 0;
        vm.expectRevert(SmartContract.InvalidShare.selector);
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function testCreateEventWithoutOwnerAsParticipantReverts() public {
        address[] memory p = new address[](2);
        p[0] = address(0x123);
        p[1] = address(0x456);
        uint256[] memory s = new uint256[](2);
        s[0] = 15e18;
        s[1] = 15e18;
        vm.expectRevert(SmartContract.OwnerNotParticipant.selector);
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function testCreateEventWithDuplicateParticipantReverts() public {
        address[] memory p = new address[](3);
        p[0] = address(this);
        p[1] = address(0x123);
        p[2] = address(0x123);
        uint256[] memory s = new uint256[](3);
        s[0] = 10e18;
        s[1] = 10e18;
        s[2] = 10e18;
        vm.expectRevert(SmartContract.DuplicateParticipant.selector);
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function testCreateEventWithSharesNotMatchingPriceReverts() public {
        address[] memory p = new address[](2);
        p[0] = address(this);
        p[1] = address(0x123);
        uint256[] memory s = new uint256[](2);
        s[0] = 10e18;
        s[1] = 10e18;
        vm.expectRevert(SmartContract.NotEnoughFunds.selector);
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function testCreateEventEmitsEvent() public {
        (address[] memory p, uint256[] memory s) = _participantsAndShares();
        vm.expectEmit(true, true, true, true);
        emit SmartContract.EventCreated(0, "abc", address(this), PRICE_USD);
        smartContract.createEvent("abc", PRICE_USD, p, s);
    }

    function testCreateEventWithMaxParticipants() public {
        uint256 count = 50;
        address[] memory p = new address[](count);
        uint256[] memory s = new uint256[](count);
        p[0] = address(this);
        s[0] = 1e18;
        for (uint256 i = 1; i < count; i++) {
            p[i] = address(uint160(200000 + i));
            s[i] = 1e18;
        }
        uint256 total = 1e18 * count;
        smartContract.createEvent("maxpart", total, p, s);
        assertEq(smartContract.logEvents("maxpart"), 0);
        assertEq(smartContract.getPrice("maxpart", p[count - 1]), 1e18);
    }

    // =========================================================
    // PAYMENT — ETH (WITH FEE)
    // =========================================================
    function testPaymentEthWhenEthNotSupported() public {
        _createEvent();
        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
    }

    function testPaymentEth() public {
        _createEvent();
        _supportEth();
        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
        (, , , , , uint256 hp, ) = smartContract.getEvent("abc");
        assertEq(hp, 2);
    }

    function testPaymentEthTransfersEtherToOwnerMinusFee() public {
        _createEvent();
        _supportEth();
        uint256 ob = address(this).balance;
        uint256 tb = treasuryWallet.balance;
        uint256 ef = _calculateFee(SHARE_WEI);

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        assertEq(address(this).balance, ob + SHARE_WEI - ef);
        assertEq(treasuryWallet.balance, tb + ef);
    }

    function testPaymentEthTransfersFeeToTreasury() public {
        _createEvent();
        _supportEth();
        uint256 tb = treasuryWallet.balance;
        uint256 ef = _calculateFee(SHARE_WEI);

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        assertEq(treasuryWallet.balance, tb + ef);
    }

    function testPaymentEthWithinToleranceUnder() public {
        _createEvent();
        _supportEth();
        uint256 su = SHARE_WEI - (SHARE_WEI / 200);
        vm.prank(address(0x123));
        smartContract.paymentInEth{value: su}("abc");
        (, , , , , uint256 hp, ) = smartContract.getEvent("abc");
        assertEq(hp, 2);
    }

    function testPaymentEthWithinToleranceOver() public {
        _createEvent();
        _supportEth();
        uint256 so = SHARE_WEI + (SHARE_WEI / 200);
        vm.prank(address(0x123));
        smartContract.paymentInEth{value: so}("abc");
        (, , , , , uint256 hp, ) = smartContract.getEvent("abc");
        assertEq(hp, 2);
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
        vm.expectEmit(false, false, false, false);
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
        (, , , , uint256 pc, uint256 hp, ) = smartContract.getEvent("abc");
        assertEq(hp, pc);
    }

    function testOwnerReceivesBothEthPaymentsMinusFees() public {
        _createEvent();
        _supportEth();
        uint256 ob = address(this).balance;
        uint256 tb = treasuryWallet.balance;
        uint256 ef = _calculateFee(SHARE_WEI);

        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
        vm.prank(address(0x456));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        assertEq(address(this).balance, ob + (SHARE_WEI - ef) * 2);
        assertEq(treasuryWallet.balance, tb + ef * 2);
    }

    function testPaymentEthTransferFailsOnOwnerLeg() public {
        RejectingReceiver rr = new RejectingReceiver(smartContract);
        address[] memory p = new address[](3);
        p[0] = address(rr);
        p[1] = address(0x123);
        p[2] = address(0x456);
        uint256[] memory s = new uint256[](3);
        s[0] = SHARE_USD;
        s[1] = SHARE_USD;
        s[2] = SHARE_USD;
        rr.createEvent("reject", PRICE_USD, p, s);
        _supportEth();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.ErrorTransferingEther.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("reject");
    }

    function testPaymentEthTransferFailsOnTreasuryLeg() public {
        RejectingReceiver bt = new RejectingReceiver(smartContract);
        smartContract.setTreasuryWallet(address(bt));
        _createEvent();
        _supportEth();

        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.ErrorTransferingEther.selector);
        smartContract.paymentInEth{value: SHARE_WEI}("abc");

        smartContract.setTreasuryWallet(treasuryWallet);
    }

    // =========================================================
    // PAYMENT — ERC20 (WITH FEE)
    // =========================================================
    function testPaymentInToken() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.stopPrank();

        (, , , , , uint256 hp, ) = smartContract.getEvent("abc");
        assertEq(hp, 2);
    }

    function testPaymentInTokenTransfersTokenToOwnerMinusFee() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 ob = mockToken.balanceOf(address(this));
        uint256 tb = mockToken.balanceOf(treasuryWallet);
        uint256 ef = _calculateFee(ts);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(address(this)), ob + ts - ef);
        assertEq(mockToken.balanceOf(treasuryWallet), tb + ef);
    }

    function testPaymentInTokenTransfersFeeToTreasury() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 tb = mockToken.balanceOf(treasuryWallet);
        uint256 ef = _calculateFee(ts);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(treasuryWallet), tb + ef);
    }

    function testPaymentInTokenWhenTokenNotSupported() public {
        _createEvent();
        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), 1000e18);
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.paymentInToken("abc", address(mockToken), 1000e18);
        vm.stopPrank();
    }

    function testPaymentInTokenWithinToleranceUnder() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 su = ts - (ts / 200);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), su);
        smartContract.paymentInToken("abc", address(mockToken), su);
        vm.stopPrank();

        (, , , , , uint256 hp, ) = smartContract.getEvent("abc");
        assertEq(hp, 2);
    }

    function testPaymentInTokenWithinToleranceOver() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 so = ts + (ts / 200);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), so);
        smartContract.paymentInToken("abc", address(mockToken), so);
        vm.stopPrank();

        (, , , , , uint256 hp, ) = smartContract.getEvent("abc");
        assertEq(hp, 2);
    }

    function testPaymentInTokenOwnerTriesToPay() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(this),
            address(mockToken)
        );

        vm.startPrank(address(this));
        mockToken.approve(address(smartContract), ts);
        vm.expectRevert(SmartContract.NotAllowed.selector);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.stopPrank();
    }

    function testPaymentInTokenWhenEventIsClosed() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        smartContract.closeEvent("abc");

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        vm.expectRevert(SmartContract.EventClosed.selector);
        smartContract.paymentInToken("abc", address(mockToken), ts);
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
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts * 2);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.expectRevert(SmartContract.HasAlreadyPaid.selector);
        smartContract.paymentInToken("abc", address(mockToken), ts);
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
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        vm.expectRevert(SmartContract.NotEnoughFunds.selector);
        smartContract.paymentInToken("abc", address(mockToken), ts / 2);
        vm.stopPrank();
    }

    function testPaymentInTokenWithTooMuchFunds() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts * 2);
        vm.expectRevert(SmartContract.TooMuchFunds.selector);
        smartContract.paymentInToken("abc", address(mockToken), ts * 2);
        vm.stopPrank();
    }

    function testPaymentInTokenEmitsEvent() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        vm.expectEmit(false, false, false, false);
        emit SmartContract.Payment(
            address(0x123),
            0,
            "abc",
            0,
            address(this),
            address(mockToken)
        );
        smartContract.paymentInToken("abc", address(mockToken), ts);
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
        uint256 ts123 = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 ts456 = smartContract.getSharedPriceInToken(
            "abc",
            address(0x456),
            address(mockToken)
        );

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts123);
        smartContract.paymentInToken("abc", address(mockToken), ts123);
        vm.stopPrank();

        vm.startPrank(address(0x456));
        mockToken.approve(address(smartContract), ts456);
        smartContract.paymentInToken("abc", address(mockToken), ts456);
        vm.stopPrank();

        (, , , , uint256 pc, uint256 hp, ) = smartContract.getEvent("abc");
        assertEq(hp, pc);
    }

    function testOwnerReceivesBothTokenPaymentsMinusFees() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        uint256 ob = mockToken.balanceOf(address(this));
        uint256 tb = mockToken.balanceOf(treasuryWallet);
        uint256 ef = _calculateFee(ts);

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.stopPrank();

        vm.startPrank(address(0x456));
        mockToken.approve(address(smartContract), ts);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.stopPrank();

        assertEq(mockToken.balanceOf(address(this)), ob + (ts - ef) * 2);
        assertEq(mockToken.balanceOf(treasuryWallet), tb + ef * 2);
    }

    // =========================================================
    // SUPPORTED TOKENS
    // =========================================================
    function testSetSupportedToken() public {
        _supportMockToken();
        (address ta, , uint8 td, bool isSupported) = smartContract
            .supportedTokens(address(mockToken));
        assertEq(ta, address(mockToken));
        assertEq(td, 18);
        assertTrue(isSupported);
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
        assertFalse(isSupported);
    }

    // =========================================================
    // REMOVE SUPPORTED TOKEN
    // =========================================================
    function testRemoveSupportedToken() public {
        _supportMockToken();
        smartContract.removeSupportedToken(address(mockToken));
        (address ta, , uint8 td, bool isSupported) = smartContract
            .supportedTokens(address(mockToken));
        assertEq(ta, address(0));
        assertEq(td, 0);
        assertFalse(isSupported);
    }

    function testRemoveSupportedTokenWhenNotOwner() public {
        _supportMockToken();
        vm.prank(address(0x123));
        vm.expectRevert(SmartContract.NotOwner.selector);
        smartContract.removeSupportedToken(address(mockToken));
    }

    function testRemoveSupportedTokenThatWasNeverSupported() public {
        smartContract.removeSupportedToken(address(mockToken));
        (, , , bool isSupported) = smartContract.supportedTokens(
            address(mockToken)
        );
        assertFalse(isSupported);
    }

    function testPaymentInTokenAfterTokenRemoved() public {
        _createEvent();
        _supportMockToken();
        uint256 ts = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(mockToken)
        );
        smartContract.removeSupportedToken(address(mockToken));

        vm.startPrank(address(0x123));
        mockToken.approve(address(smartContract), ts);
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.paymentInToken("abc", address(mockToken), ts);
        vm.stopPrank();
    }

    function testRemoveSupportedEth() public {
        _supportEth();
        smartContract.removeSupportedToken(address(0));
        (, , , bool isSupported) = smartContract.supportedTokens(address(0));
        assertFalse(isSupported);
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
        uint256 wp = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(0)
        );
        assertApproxEqRel(wp, SHARE_WEI, 0.01e18);
    }

    function testGetSharedPriceInTokenForOwner() public {
        _createEvent();
        _supportEth();
        uint256 os = smartContract.getSharedPriceInToken(
            "abc",
            address(this),
            address(0)
        );
        assertApproxEqRel(os, SHARE_WEI, 0.01e18);
    }

    function testGetSharedPriceInTokenForNonParticipant() public {
        _createEvent();
        _supportEth();
        uint256 r = smartContract.getSharedPriceInToken(
            "abc",
            address(0x789),
            address(0)
        );
        assertEq(r, 0);
    }

    function testGetSharedPriceInTokenChangesWithPrice() public {
        _createEvent();
        _supportEth();
        uint256 w3000 = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(0)
        );
        mockPriceFeed.updateAnswer(600000000000);
        uint256 w6000 = smartContract.getSharedPriceInToken(
            "abc",
            address(0x123),
            address(0)
        );
        assertApproxEqRel(w3000, w6000 * 2, 0.01e18);
    }

    function testGetSharedPriceInTokenWithInvalidEventId() public {
        _supportEth();
        vm.expectRevert(SmartContract.InvalidEventId.selector);
        smartContract.getSharedPriceInToken("xyz", address(0x123), address(0));
    }

    function testGetSharedPriceInTokenWithUnsupportedToken() public {
        _createEvent();
        vm.expectRevert(SmartContract.TokenNotSupported.selector);
        smartContract.getSharedPriceInToken("abc", address(0x123), address(0));
    }

    function testGetSharedPriceInTokenDiffersPerParticipant() public {
        address[] memory p = new address[](3);
        p[0] = address(this);
        p[1] = address(0x123);
        p[2] = address(0x456);
        uint256[] memory s = new uint256[](3);
        s[0] = 5e18;
        s[1] = 10e18;
        s[2] = 15e18;
        smartContract.createEvent("uneven", 30e18, p, s);
        _supportEth();

        uint256 s123 = smartContract.getSharedPriceInToken(
            "uneven",
            address(0x123),
            address(0)
        );
        uint256 s456 = smartContract.getSharedPriceInToken(
            "uneven",
            address(0x456),
            address(0)
        );
        assertApproxEqRel(s456, (s123 * 3) / 2, 0.01e18);
    }

    // =========================================================
    // PRICE CONVERTER — require(answer > 0)
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
        assertTrue(smartContract.completed("abc"));
    }

    function testEventIsNotCompleteAfterOnePayment() public {
        _createEvent();
        _supportEth();
        vm.prank(address(0x123));
        smartContract.paymentInEth{value: SHARE_WEI}("abc");
        assertFalse(smartContract.completed("abc"));
    }

    function testEventIsNotCompleteWhenJustCreated() public {
        _createEvent();
        assertFalse(smartContract.completed("abc"));
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
            uint256 id,
            bytes32 oid,
            address eo,
            uint256 ta,
            uint256 pc,
            uint256 hp,
            SmartContract.EventStatus st
        ) = smartContract.getEvent("abc");
        assertEq(id, 0);
        assertEq(oid, "abc");
        assertEq(eo, address(this));
        assertEq(ta, PRICE_USD);
        assertEq(pc, 3);
        assertEq(hp, 1);
        assertEq(uint(st), uint(SmartContract.EventStatus.Opened));
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
        (, , , , , , SmartContract.EventStatus st) = smartContract.getEvent(
            "abc"
        );
        assertEq(uint(st), uint(SmartContract.EventStatus.Closed));
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
        (bool ok, ) = address(smartContract).call{value: 1 ether}("");
        ok;
    }

    function testFallbackReverts() public {
        vm.expectRevert(bytes("Use payment() function"));
        (bool ok, ) = address(smartContract).call{value: 1 ether}(
            abi.encodeWithSignature("nonExistentFunction()")
        );
        ok;
    }

    // =========================================================
    // FUZZ TESTS
    // =========================================================
    function testFuzzCreateEventShareCalculation(
        uint256 share,
        uint8 numParticipants
    ) public {
        vm.assume(numParticipants > 0 && numParticipants <= 50);
        uint256 total = uint256(numParticipants) + 1;
        vm.assume(share > 0 && share <= 1_000_000e18 / total);

        address[] memory p = new address[](total);
        uint256[] memory s = new uint256[](total);
        p[0] = address(this);
        s[0] = share;
        for (uint256 i = 1; i < total; i++) {
            p[i] = address(uint160(100000 + i));
            s[i] = share;
        }

        uint256 priceUsd = share * total;
        smartContract.createEvent("fuzz", priceUsd, p, s);

        assertEq(smartContract.getPrice("fuzz", address(this)), share);
        assertEq(smartContract.getPrice("fuzz", p[total - 1]), share);
        (, , , uint256 ta, uint256 pc, , ) = smartContract.getEvent("fuzz");
        assertEq(ta, priceUsd);
        assertEq(pc, total);
    }

    function testFuzzCreateEventUnequalSharesMustMatchTotal(
        uint256 shareA,
        uint256 shareB
    ) public {
        vm.assume(shareA > 0 && shareA <= 500_000e18);
        vm.assume(shareB > 0 && shareB <= 500_000e18);

        address[] memory p = new address[](2);
        p[0] = address(this);
        p[1] = address(0x123);
        uint256[] memory s = new uint256[](2);
        s[0] = shareA;
        s[1] = shareB;

        uint256 correctTotal = shareA + shareB;
        smartContract.createEvent("fuzzUneven", correctTotal, p, s);

        assertEq(smartContract.getPrice("fuzzUneven", address(this)), shareA);
        assertEq(smartContract.getPrice("fuzzUneven", address(0x123)), shareB);
    }

    function testFuzzSetPlatformFee(uint256 feeBps) public {
        vm.assume(feeBps <= 500);
        smartContract.setPlatformFee(feeBps);
        assertEq(smartContract.platformFeeBps(), feeBps);
    }

    function testFuzzSetPlatformFeeTooHighReverts(uint256 feeBps) public {
        vm.assume(feeBps > 500);
        vm.expectRevert(bytes("Fee too high"));
        smartContract.setPlatformFee(feeBps);
    }
}
