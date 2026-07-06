// src/blockchain/contract.ts

import { getContract } from "thirdweb";
import { client } from "../ThirdwebClient";

export const EVENT_CONTRACT_ADDRESS = {
  11155111: "0x97D775D88340694bDD022e75d0fA3a0c8Bd80776",
};

type ChainWithId = {
  id: number;
};

export function getEventContract(chain: ChainWithId) {
  const address =
    EVENT_CONTRACT_ADDRESS[chain.id as keyof typeof EVENT_CONTRACT_ADDRESS];

  if (!address) {
    throw new Error(`No contract address for chain ${chain.id}`);
  }

  return getContract({
    client,
    chain: chain as Parameters<typeof getContract>[0]["chain"],
    address: address as `0x${string}`,
    abi: [
      {
        type: "constructor",
        inputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "fallback",
        stateMutability: "payable",
      },
      {
        type: "receive",
        stateMutability: "payable",
      },
      {
        type: "function",
        name: "closeEvent",
        inputs: [{ name: "eventId", type: "bytes32" }],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "completed",
        inputs: [{ name: "eventId", type: "bytes32" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "contractOwner",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "createEvent",
        inputs: [
          { name: "offChainId", type: "bytes32" },
          { name: "totalAmount", type: "uint256" },
          { name: "participants", type: "address[]" },
          { name: "shares", type: "uint256[]" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "events",
        inputs: [{ name: "", type: "uint256" }],
        outputs: [
          { name: "id", type: "uint256" },
          { name: "offChainId", type: "bytes32" },
          { name: "creator", type: "address" },
          { name: "totalAmount", type: "uint256" },
          { name: "collectedAmount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "getEvent",
        inputs: [{ name: "offChainId", type: "bytes32" }],
        outputs: [
          { name: "id", type: "uint256" },
          { name: "eventId", type: "bytes32" },
          { name: "creator", type: "address" },
          { name: "totalAmount", type: "uint256" },
          { name: "collectedAmount", type: "uint256" },
          { name: "createdAt", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "getPrice",
        inputs: [
          { name: "eventId", type: "bytes32" },
          { name: "participant", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "getSharedPriceInToken",
        inputs: [
          { name: "eventId", type: "bytes32" },
          { name: "participant", type: "address" },
          { name: "token", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "logEvents",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "offChainIdExists",
        inputs: [{ name: "offChainId", type: "bytes32" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "offChainIdToEventId",
        inputs: [{ name: "offChainId", type: "bytes32" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "paymentInEth",
        inputs: [{ name: "offChainId", type: "bytes32" }],
        outputs: [],
        stateMutability: "payable",
      },
      {
        type: "function",
        name: "paymentInToken",
        inputs: [
          { name: "offChainId", type: "bytes32" },
          { name: "token", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "removeSupportedToken",
        inputs: [{ name: "token", type: "address" }],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "setSupportedToken",
        inputs: [
          { name: "token", type: "address" },
          { name: "priceFeed", type: "address" },
          { name: "decimals", type: "uint8" },
          { name: "enabled", type: "bool" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "supportedTokens",
        inputs: [{ name: "", type: "address" }],
        outputs: [
          { name: "tokenAddress", type: "address" },
          { name: "priceFeed", type: "address" },
          { name: "decimals", type: "uint8" },
          { name: "enabled", type: "bool" },
        ],
        stateMutability: "view",
      },
      {
        type: "event",
        name: "EventCreated",
        inputs: [
          { name: "id", type: "uint256", indexed: false },
          { name: "offChainId", type: "bytes32", indexed: true },
          { name: "creator", type: "address", indexed: true },
          { name: "totalAmount", type: "uint256", indexed: false },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "Payment",
        inputs: [
          { name: "participant", type: "address", indexed: true },
          { name: "amount", type: "uint256", indexed: false },
          { name: "offChainId", type: "bytes32", indexed: true },
          { name: "eventId", type: "uint256", indexed: false },
          { name: "tokenPaid", type: "address", indexed: false },
          { name: "creator", type: "address", indexed: false },
        ],
        anonymous: false,
      },
      { type: "error", name: "Completed", inputs: [] },
      { type: "error", name: "DuplicateParticipant", inputs: [] },
      { type: "error", name: "ErrorTransferingEther", inputs: [] },
      { type: "error", name: "EventClosed", inputs: [] },
      { type: "error", name: "HasAlreadyPaid", inputs: [] },
      { type: "error", name: "InvalidEventId", inputs: [] },
      { type: "error", name: "InvalidParticipant", inputs: [] },
      { type: "error", name: "InvalidShare", inputs: [] },
      { type: "error", name: "NoEvents", inputs: [] },
      { type: "error", name: "NotAParticipant", inputs: [] },
      { type: "error", name: "NotAllowed", inputs: [] },
      { type: "error", name: "NotEnoughFunds", inputs: [] },
      { type: "error", name: "NotEnoughParticipants", inputs: [] },
      { type: "error", name: "NotOwner", inputs: [] },
      { type: "error", name: "OwnerNotParticipant", inputs: [] },
      { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
      {
        type: "error",
        name: "SafeERC20FailedOperation",
        inputs: [{ name: "token", type: "address" }],
      },
      { type: "error", name: "TokenNotSupported", inputs: [] },
      { type: "error", name: "TooMuchFunds", inputs: [] },
      { type: "error", name: "UnCompleted", inputs: [] },
      { type: "error", name: "UnsupportedDecimals", inputs: [] },
    ],
  });
}
