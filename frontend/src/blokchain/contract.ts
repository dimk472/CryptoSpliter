// src/blockchain/contract.ts

import { getContract } from "thirdweb";
import { client } from "../ThirdwebClient";

export const EVENT_CONTRACT_ADDRESS = {
  11155111: "0x846E85305636fCe90FcF995E89E6a9941EFAD931",
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
        type: "receive",
        stateMutability: "payable",
      },
      {
        type: "fallback",
        stateMutability: "payable",
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
        name: "offChainIdToEventId",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "offChainIdExists",
        inputs: [{ name: "", type: "bytes32" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "supportedTokens",
        inputs: [{ name: "", type: "address" }],
        outputs: [
          { name: "tokenAddress", type: "address" },
          { name: "priceFeed", type: "address" },
          { name: "decimals", type: "uint8" },
          { name: "isSupported", type: "bool" },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "events",
        inputs: [{ name: "", type: "uint256" }],
        outputs: [
          { name: "eventId", type: "uint256" },
          { name: "offChainId", type: "bytes32" },
          { name: "owner", type: "address" },
          { name: "totalAmount", type: "uint256" },
          { name: "shareAmount", type: "uint256" },
          { name: "participantsCount", type: "uint256" },
          { name: "havePaidParticipants", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "createEvent",
        inputs: [
          { name: "_offChainId", type: "bytes32" },
          { name: "_priceUsd", type: "uint256" },
          { name: "_participants", type: "address[]" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "paymentInToken",
        inputs: [
          { name: "_offChainId", type: "bytes32" },
          { name: "_tokenAddress", type: "address" },
          { name: "_amount", type: "uint256" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "paymentInEth",
        inputs: [{ name: "_offChainId", type: "bytes32" }],
        outputs: [],
        stateMutability: "payable",
      },
      {
        type: "function",
        name: "logEvents",
        inputs: [{ name: "_offChainId", type: "bytes32" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "setSupportedToken",
        inputs: [
          { name: "_tokenAddress", type: "address" },
          { name: "_priceFeed", type: "address" },
          { name: "_decimals", type: "uint8" },
          { name: "_supported", type: "bool" },
        ],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "removeSupportedToken",
        inputs: [{ name: "_tokenAddress", type: "address" }],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "function",
        name: "getPrice",
        inputs: [{ name: "_offChainId", type: "bytes32" }],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "getSharedPriceInToken",
        inputs: [
          { name: "_offChainId", type: "bytes32" },
          { name: "_tokenAddress", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "completed",
        inputs: [{ name: "_offChainId", type: "bytes32" }],
        outputs: [{ name: "", type: "bool" }],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "getEvent",
        inputs: [{ name: "_offChainId", type: "bytes32" }],
        outputs: [
          { name: "eventId", type: "uint256" },
          { name: "offChainId", type: "bytes32" },
          { name: "eventOwner", type: "address" },
          { name: "totalAmount", type: "uint256" },
          { name: "shareAmount", type: "uint256" },
          { name: "participantsCount", type: "uint256" },
          { name: "havePaidParticipants", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        stateMutability: "view",
      },
      {
        type: "function",
        name: "closeEvent",
        inputs: [{ name: "_offChainId", type: "bytes32" }],
        outputs: [],
        stateMutability: "nonpayable",
      },
      {
        type: "event",
        name: "Payment",
        inputs: [
          { name: "_address", type: "address", indexed: false },
          { name: "_eventId", type: "uint256", indexed: false },
          { name: "_offChainId", type: "bytes32", indexed: false },
          { name: "_amount", type: "uint256", indexed: false },
          { name: "_owner", type: "address", indexed: false },
          { name: "_tokenPaid", type: "address", indexed: false },
        ],
        anonymous: false,
      },
      {
        type: "event",
        name: "EventCreated",
        inputs: [
          { name: "_eventId", type: "uint256", indexed: false },
          { name: "_offChainId", type: "bytes32", indexed: false },
          { name: "_owner", type: "address", indexed: false },
          { name: "_priceUsd", type: "uint256", indexed: false },
          { name: "_shareAmount", type: "uint256", indexed: false },
        ],
        anonymous: false,
      },
      { type: "error", name: "NotOwner", inputs: [] },
      { type: "error", name: "NotEnoughParticipants", inputs: [] },
      { type: "error", name: "EventClosed", inputs: [] },
      { type: "error", name: "NotEnoughFunds", inputs: [] },
      { type: "error", name: "ErrorTransferingEther", inputs: [] },
      { type: "error", name: "HasAlreadyPaid", inputs: [] },
      { type: "error", name: "NoEvents", inputs: [] },
      { type: "error", name: "NotAParticipant", inputs: [] },
      { type: "error", name: "NotAllowed", inputs: [] },
      { type: "error", name: "UnCompleted", inputs: [] },
      { type: "error", name: "Completed", inputs: [] },
      { type: "error", name: "TooMuchFunds", inputs: [] },
      { type: "error", name: "InvalidEventId", inputs: [] },
      { type: "error", name: "UnsupportedDecimals", inputs: [] },
      { type: "error", name: "TokenNotSupported", inputs: [] },
      { type: "error", name: "ReentrancyGuardReentrantCall", inputs: [] },
      {
        type: "error",
        name: "SafeERC20FailedOperation",
        inputs: [{ name: "token", type: "address" }],
      },
    ],
  });
}
