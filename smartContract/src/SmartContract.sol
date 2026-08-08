// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import {PriceConverter} from "./PriceConverter.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract SmartContract is ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 constant TOLERANCE_BPS = 200;
    using PriceConverter for uint256;
    uint256 public platformFeeBps = 50;
    address public treasuryWallet;

    error NotOwner();
    error NotEnoughParticipants();
    error EventClosed();
    error NotEnoughFunds();
    error ErrorTransferingEther();
    error HasAlreadyPaid();
    error NoEvents();
    error NotAParticipant();
    error NotAllowed();
    error UnCompleted();
    error Completed();
    error TooMuchFunds();
    error InvalidEventId();
    error UnsupportedDecimals();
    error TokenNotSupported();
    error OwnerNotParticipant();
    error DuplicateParticipant();
    error InvalidParticipant();
    error InvalidShare();
    error TreasuryWalletNotSet();

    address public contractOwner;

    enum EventStatus {
        Opened,
        Closed
    }

    event Payment(
        address _address,
        uint _eventId,
        bytes32 _offChainId,
        uint _amount,
        address _owner,
        address _tokenPaid
    );

    event EventCreated(
        uint _eventId,
        bytes32 _offChainId,
        address _owner,
        uint _priceUsd
    );

    struct Event {
        uint256 eventId;
        bytes32 offChainId;
        address payable owner;
        uint256 totalAmount;
        uint256 participantsCount;
        uint256 havePaidParticipants;
        EventStatus status;
        mapping(address => uint256) shares;
        mapping(address => bool) isParticipant;
        mapping(address => bool) hasPaid;
    }

    struct SupportedToken {
        address tokenAddress;
        AggregatorV3Interface priceFeed;
        uint8 decimals;
        bool isSupported;
    }

    mapping(bytes32 => uint256) public offChainIdToEventId;
    mapping(bytes32 => bool) public offChainIdExists;
    mapping(address => SupportedToken) public supportedTokens;

    Event[] public events;

    constructor() {
        contractOwner = msg.sender;
    }

    function _onlyOwner() internal view {
        if (msg.sender != contractOwner) revert NotOwner();
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _getEventId(bytes32 _offChainId) internal view returns (uint256) {
        if (!offChainIdExists[_offChainId]) revert InvalidEventId();
        return offChainIdToEventId[_offChainId];
    }

    function setPlatformFee(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 500, "Fee too high"); // max 5%
        platformFeeBps = _newFeeBps;
    }

    function setTreasuryWallet(address _treasuryWallet) external onlyOwner {
        require(_treasuryWallet != address(0), "Invalid address");
        treasuryWallet = _treasuryWallet;
    }

    // -------------------------
    // CREATE EVENT
    // -------------------------
    function createEvent(
        bytes32 _offChainId,
        uint256 _priceUsd,
        address[] memory _participants,
        uint256[] memory _shares
    ) public {
        if (_participants.length == 0) revert NotEnoughParticipants();
        if (offChainIdExists[_offChainId]) revert InvalidEventId();
        if (_priceUsd == 0) revert NotEnoughFunds();
        if (_participants.length != _shares.length)
            revert NotEnoughParticipants();

        bool ownerFound = false;
        uint256 totalShares = 0;

        uint256 length = _participants.length;

        for (uint256 i = 0; i < length; i++) {
            // Invalid address
            if (_participants[i] == address(0)) revert InvalidParticipant();

            // Share cannot be zero
            if (_shares[i] == 0) revert InvalidShare();

            // Check if creator is participant
            if (_participants[i] == msg.sender) ownerFound = true;

            totalShares += _shares[i];

            // Check duplicate participants
            for (uint256 j = i + 1; j < length; j++) {
                if (_participants[i] == _participants[j])
                    revert DuplicateParticipant();
            }
        }

        if (!ownerFound) revert OwnerNotParticipant();

        if (totalShares != _priceUsd) revert NotEnoughFunds();

        events.push();
        uint256 eventId = events.length - 1;
        Event storage e = events[eventId];

        e.eventId = eventId;
        e.offChainId = _offChainId;
        e.owner = payable(msg.sender);
        e.totalAmount = _priceUsd;
        e.participantsCount = _participants.length;
        e.havePaidParticipants = 1;
        e.status = EventStatus.Opened;

        e.hasPaid[msg.sender] = true;

        offChainIdToEventId[_offChainId] = eventId;
        offChainIdExists[_offChainId] = true;

        for (uint256 i = 0; i < length; i++) {
            e.isParticipant[_participants[i]] = true;
            e.shares[_participants[i]] = _shares[i];
        }

        emit EventCreated(eventId, e.offChainId, e.owner, e.totalAmount);
    }

    // -------------------------
    // PAYMENT
    // -------------------------
    function paymentInToken(
        bytes32 _offChainId,
        address _tokenAddress,
        uint256 _amount
    ) public nonReentrant {
        uint256 eventId = _getEventId(_offChainId);
        Event storage e = events[eventId];

        if (msg.sender == e.owner) revert NotAllowed();
        if (e.status == EventStatus.Closed) revert EventClosed();
        if (!e.isParticipant[msg.sender]) revert NotAParticipant();
        if (e.hasPaid[msg.sender]) revert HasAlreadyPaid();

        SupportedToken storage tokenInfo = supportedTokens[_tokenAddress];

        if (!tokenInfo.isSupported) revert TokenNotSupported();

        uint256 amountInUsd = _amount.getTokenUsdValue(
            tokenInfo.decimals,
            tokenInfo.priceFeed
        );

        uint256 share = e.shares[msg.sender];
        uint256 tolerance = (share * TOLERANCE_BPS) / 10000;

        if (amountInUsd < share - tolerance) revert NotEnoughFunds();
        if (amountInUsd > share + tolerance) revert TooMuchFunds();

        // =========================
        // PLATFORM FEE
        // =========================

        if (treasuryWallet == address(0)) revert TreasuryWalletNotSet();

        uint256 feeUsd = (amountInUsd * platformFeeBps) / 10000;

        uint256 feeToken = feeUsd.getTokenAmountFromUsd(
            tokenInfo.decimals,
            tokenInfo.priceFeed
        );

        uint256 ownerAmount = _amount - feeToken;

        // =========================
        // UPDATE STATE
        // =========================

        e.hasPaid[msg.sender] = true;
        e.havePaidParticipants++;

        IERC20 token = IERC20(_tokenAddress);

        // Παίρνει όλο το ποσό από τον χρήστη
        token.safeTransferFrom(msg.sender, address(this), _amount);

        // Στέλνει το ποσό στον owner
        token.safeTransfer(e.owner, ownerAmount);

        // Στέλνει το fee στο Treasury Wallet
        token.safeTransfer(treasuryWallet, feeToken);

        emit Payment(
            msg.sender,
            eventId,
            e.offChainId,
            amountInUsd,
            e.owner,
            _tokenAddress
        );
    }

    function paymentInEth(bytes32 _offChainId) public payable nonReentrant {
        uint256 eventId = _getEventId(_offChainId);
        Event storage e = events[eventId];

        if (msg.sender == e.owner) revert NotAllowed();
        if (e.status == EventStatus.Closed) revert EventClosed();
        if (!e.isParticipant[msg.sender]) revert NotAParticipant();
        if (e.hasPaid[msg.sender]) revert HasAlreadyPaid();

        SupportedToken storage tokenInfo = supportedTokens[address(0)];

        if (!tokenInfo.isSupported) revert TokenNotSupported();

        uint256 amountInUsd = msg.value.getTokenUsdValue(
            tokenInfo.decimals,
            tokenInfo.priceFeed
        );

        uint256 share = e.shares[msg.sender];
        uint256 tolerance = (share * TOLERANCE_BPS) / 10000;

        if (amountInUsd < share - tolerance) revert NotEnoughFunds();
        if (amountInUsd > share + tolerance) revert TooMuchFunds();

        // =========================
        // PLATFORM FEE
        // =========================
        if (treasuryWallet == address(0)) revert TreasuryWalletNotSet();

        uint256 feeUsd = (amountInUsd * platformFeeBps) / 10000;

        uint256 feeEth = feeUsd.getTokenAmountFromUsd(
            tokenInfo.decimals,
            tokenInfo.priceFeed
        );

        uint256 ownerAmount = msg.value - feeEth;

        // =========================
        // UPDATE STATE
        // =========================

        e.hasPaid[msg.sender] = true;
        e.havePaidParticipants++;

        // Στέλνει το ποσό στον owner
        (bool sentOwner, ) = e.owner.call{value: ownerAmount}("");
        if (!sentOwner) revert ErrorTransferingEther();

        // Στέλνει το fee στο Treasury
        (bool sentTreasury, ) = payable(treasuryWallet).call{value: feeEth}("");
        if (!sentTreasury) revert ErrorTransferingEther();

        emit Payment(
            msg.sender,
            eventId,
            e.offChainId,
            amountInUsd,
            e.owner,
            address(0)
        );
    }

    // -------------------------
    // READ FUNCTIONS
    // -------------------------
    function logEvents(bytes32 _offChainId) public view returns (uint256) {
        return events[_getEventId(_offChainId)].eventId;
    }

    function setSupportedToken(
        address _tokenAddress,
        AggregatorV3Interface _priceFeed,
        uint8 _decimals,
        bool _supported
    ) public onlyOwner {
        supportedTokens[_tokenAddress] = SupportedToken({
            tokenAddress: _tokenAddress,
            priceFeed: _priceFeed,
            decimals: _decimals,
            isSupported: _supported
        });
    }

    function removeSupportedToken(address _tokenAddress) public onlyOwner {
        delete supportedTokens[_tokenAddress];
    }

    function getPrice(
        bytes32 _offChainId,
        address _participant
    ) public view returns (uint256) {
        return events[_getEventId(_offChainId)].shares[_participant];
    }

    function getSharedPriceInToken(
        bytes32 _offChainId,
        address _participant,
        address _tokenAddress
    ) public view returns (uint256) {
        SupportedToken storage info = supportedTokens[_tokenAddress];
        if (!info.isSupported) revert TokenNotSupported();

        uint256 share = events[_getEventId(_offChainId)].shares[_participant];

        return share.getTokenAmountFromUsd(info.decimals, info.priceFeed);
    }

    function completed(bytes32 _offChainId) external view returns (bool) {
        Event storage e = events[_getEventId(_offChainId)];
        return e.participantsCount == e.havePaidParticipants;
    }

    function getEvent(
        bytes32 _offChainId
    )
        public
        view
        returns (
            uint256 eventId,
            bytes32 offChainId,
            address eventOwner,
            uint256 totalAmount,
            uint256 participantsCount,
            uint256 havePaidParticipants,
            EventStatus status
        )
    {
        Event storage e = events[_getEventId(_offChainId)];
        return (
            e.eventId,
            e.offChainId,
            e.owner,
            e.totalAmount,
            e.participantsCount,
            e.havePaidParticipants,
            e.status
        );
    }

    function closeEvent(bytes32 _offChainId) public {
        Event storage e = events[_getEventId(_offChainId)];
        if (e.status == EventStatus.Closed) revert EventClosed();

        if (msg.sender != e.owner) revert NotOwner();

        e.status = EventStatus.Closed;
    }

    receive() external payable {
        revert("Use payment() function");
    }

    fallback() external payable {
        revert("Use payment() function");
    }
}
