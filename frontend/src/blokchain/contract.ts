// src/blockchain/contract.ts

import { getContract } from "thirdweb";
import { client } from "../ThirdwebClient";

export const EVENT_CONTRACT_ADDRESS = {
  11155111: "0x219dbA77360054Ea2c002E4ccc88ABd935Fa6CbE",
};

export function getEventContract(chain: any) {
  const address =
    EVENT_CONTRACT_ADDRESS[chain.id as keyof typeof EVENT_CONTRACT_ADDRESS];

  if (!address) {
    throw new Error(`No contract address for chain ${chain.id}`);
  }

  return getContract({
    client,
    chain,
    address: address as `0x${string}`,
    abi: [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "priceFeed",
            "type": "address"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [],
        "name": "Completed",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "ErrorTransferingEther",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "EventClosed",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "HasAlreadyPaid",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "InvalidEventId",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NoEvents",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NotAParticipant",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NotAllowed",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NotEnoughEther",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NotEnoughParticipants",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "NotOwner",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "TooMuchEther",
        "type": "error"
      },
      {
        "inputs": [],
        "name": "UnCompleted",
        "type": "error"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_eventId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_priceUsd",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_shareAmount",
            "type": "uint256"
          }
        ],
        "name": "EventCreated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "_address",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_eventId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "_amount",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "_owner",
            "type": "address"
          }
        ],
        "name": "Payment",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          }
        ],
        "name": "closeEvent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          }
        ],
        "name": "completed",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "contractOwner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "_priceUsd",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "_participants",
            "type": "address[]"
          }
        ],
        "name": "createEvent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "name": "events",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "eventId",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "offChainId",
            "type": "bytes32"
          },
          {
            "internalType": "address payable",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "totalAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "shareAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "participantsCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "havePaidParticipants",
            "type": "uint256"
          },
          {
            "internalType": "enum SmartContract.EventStatus",
            "name": "status",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          }
        ],
        "name": "getEvent",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "eventId",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "offChainId",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "eventOwner",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "totalAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "shareAmount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "participantsCount",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "havePaidParticipants",
            "type": "uint256"
          },
          {
            "internalType": "enum SmartContract.EventStatus",
            "name": "status",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          }
        ],
        "name": "getPrice",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          }
        ],
        "name": "getSharedPriceInEth",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          }
        ],
        "name": "logEvents",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "name": "offChainIdExists",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "",
            "type": "bytes32"
          }
        ],
        "name": "offChainIdToEventId",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "_offChainId",
            "type": "bytes32"
          }
        ],
        "name": "payment",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      }
    ],
  });
}


