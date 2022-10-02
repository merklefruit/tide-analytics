import { ethers } from "ethers";

import { SupportedNetwork, TransferEvent } from "./types";

export function fromNetworkNameToChainId(network: SupportedNetwork): number {
  switch (network) {
    case "arbitrum":
      return 42161;
    case "matic":
      return 137;
  }
}

const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;

export function getBlockExplorerApiUrl(network: SupportedNetwork): string {
  switch (network) {
    case "arbitrum":
      return `https://api.arbiscan.io/api?apikey=${ARBISCAN_API_KEY}`;
    case "matic":
      return `https://api.polygonscan.com/api?apikey=${POLYGONSCAN_API_KEY}`;
  }
}

const abiCoder = new ethers.utils.AbiCoder();

export function formatTransferEvent(event: TransferEvent): TransferEvent {
  return {
    from: abiCoder.decode(["address"], event.from)[0],
    to: abiCoder.decode(["address"], event.to)[0],
    tokenId: event.tokenId
      ? abiCoder.decode(["uint256"], event.tokenId)[0]
      : null,
    timestamp: event.timestamp
      ? abiCoder.decode(["uint256"], event.timestamp)[0]
      : null,
  };
}
