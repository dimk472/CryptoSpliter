// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SmartContract {
    error NotOwner();
    error NotEnoughParticipants();
    error EventClosed();
    error NotEnoughEther();
    error ErrorTransferingEther();
    error HasAlreadyPaid();
    error NoEvents();
    error NotAParticipant();
    error NotAllowed();
    error UnCompleted();
    error Completed();
    error TooMuchEther();
    error InvalidEventId();

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
        address _owner
    );
    event EventCreated(
        uint _eventId,
        bytes32 _offChainId,
        address _owner,
        uint _price,
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

    mapping(bytes32 => uint256) public offChainIdToEventId;
    mapping(bytes32 => bool) public offChainIdExists;

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
        uint256 _price,
        address[] memory _participants
    ) public {
        if (_participants.length == 0) revert NotEnoughParticipants();

        events.push();
        uint256 eventId = events.length - 1;
        Event storage e = events[eventId];

        uint256 totalParticipants = _participants.length + 1;

        e.owner = payable(msg.sender);
        e.eventId = eventId;
        e.offChainId = _offChainId;
        e.totalAmount = _price;
        e.shareAmount = _price / totalParticipants;
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
    function payment(bytes32 _offChainId) public payable {
        uint256 eventId = _getEventId(_offChainId);
        Event storage e = events[eventId];

        if (msg.sender == e.owner) revert NotAllowed();
        if (e.status == EventStatus.Closed) revert EventClosed();
        if (!e.isParticipant[msg.sender]) revert NotAParticipant();
        if (e.hasPaid[msg.sender]) revert HasAlreadyPaid();

        uint256 share = e.shareAmount;
        if (msg.value < share) revert NotEnoughEther();
        if (msg.value > share) revert TooMuchEther();

        e.hasPaid[msg.sender] = true;
        e.havePaidParticipants++;

        (bool sent, ) = e.owner.call{value: msg.value}("");
        if (!sent) revert ErrorTransferingEther();

        emit Payment(msg.sender, eventId, e.offChainId, msg.value, e.owner);
    }

    // -------------------------
    // READ FUNCTIONS
    // -------------------------
    function logEvents(bytes32 _offChainId) public view returns (uint256) {
        return events[_getEventId(_offChainId)].eventId;
    }

    function getPrice(bytes32 _offChainId) public view returns (uint256) {
        return events[_getEventId(_offChainId)].shareAmount;
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
}
