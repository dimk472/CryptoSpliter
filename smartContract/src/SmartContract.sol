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
        uint _priceUsd,
        uint _shareAmount
    );

    struct Event {
        uint256 eventId;
        bytes32 offChainId;
        address payable owner;
        uint256 totalAmount;
        uint256 shareAmount;
        uint256 participantsCount;
        uint256 havePaidParticipants;
        EventStatus status;
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

    // -------------------------
    // CREATE EVENT
    // -------------------------
    function createEvent(
        bytes32 _offChainId,
        uint256 _priceUsd,
        address[] memory _participants
    ) public {
        if (_participants.length == 0) revert NotEnoughParticipants();
        if (offChainIdExists[_offChainId]) revert InvalidEventId();
        if (_priceUsd == 0) revert NotEnoughFunds();

        events.push();
        uint256 eventId = events.length - 1;
        Event storage e = events[eventId];

        uint256 totalParticipants = _participants.length + 1;

        e.owner = payable(msg.sender);
        e.eventId = eventId;
        e.offChainId = _offChainId;
        e.totalAmount = _priceUsd;
        e.shareAmount = _priceUsd / totalParticipants;
        e.status = EventStatus.Opened;
        e.participantsCount = totalParticipants;
        e.havePaidParticipants = 1;

        e.isParticipant[msg.sender] = true;
        e.hasPaid[msg.sender] = true;

        offChainIdToEventId[_offChainId] = eventId;
        offChainIdExists[_offChainId] = true;

        for (uint256 i = 0; i < _participants.length; i++) {
            e.isParticipant[_participants[i]] = true;
        }

        emit EventCreated(
            eventId,
            e.offChainId,
            e.owner,
            e.totalAmount,
            e.shareAmount
        );
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

        uint256 share = e.shareAmount;
        uint256 tolerance = (share * TOLERANCE_BPS) / 10000;
        uint256 amountInUsd;

        SupportedToken storage tokenInfo = supportedTokens[_tokenAddress];

        if (!tokenInfo.isSupported) revert TokenNotSupported();

        amountInUsd = _amount.getTokenUsdValue(
            tokenInfo.decimals,
            tokenInfo.priceFeed
        );

        if (amountInUsd < share - tolerance) revert NotEnoughFunds();
        if (amountInUsd > share + tolerance) revert TooMuchFunds();

        IERC20(_tokenAddress).safeTransferFrom(msg.sender, e.owner, _amount);

        // =========================
        // UPDATE STATE
        // =========================
        e.hasPaid[msg.sender] = true;
        e.havePaidParticipants++;

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

        uint256 share = e.shareAmount;
        uint256 tolerance = (share * TOLERANCE_BPS) / 10000;
        if (amountInUsd < share - tolerance) revert NotEnoughFunds();
        if (amountInUsd > share + tolerance) revert TooMuchFunds();

        e.hasPaid[msg.sender] = true;
        e.havePaidParticipants++;

        (bool sent, ) = e.owner.call{value: msg.value}("");
        if (!sent) revert ErrorTransferingEther();

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

    function getPrice(bytes32 _offChainId) public view returns (uint256) {
        return events[_getEventId(_offChainId)].shareAmount;
    }

    function getSharedPriceInToken(
        bytes32 _offChainId,
        address _tokenAddress
    ) public view returns (uint256) {
        SupportedToken storage info = supportedTokens[_tokenAddress];

        uint256 share = events[_getEventId(_offChainId)].shareAmount;

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
            uint256 shareAmount,
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
            e.shareAmount,
            e.participantsCount,
            e.havePaidParticipants,
            e.status
        );
    }

    function closeEvent(bytes32 _offChainId) public onlyOwner {
        events[_getEventId(_offChainId)].status = EventStatus.Closed;
    }

    receive() external payable {
        revert("Use payment() function");
    }

    fallback() external payable {
        revert("Use payment() function");
    }
}
