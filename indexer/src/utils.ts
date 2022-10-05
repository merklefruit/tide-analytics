import { ethers } from "ethers";

import { ABI_CODER } from "./constants";
import { ParsedTransferEvent, RawTransferEvent, SupportedNetwork } from "./types";

export function fromNetworkNameToChainId(network: SupportedNetwork): number {
  switch (network) {
    case "arbitrum":
      return 42161
    case "matic":
      return 137
  }
}

const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY

export function getBlockExplorerApiUrl(network: SupportedNetwork): string {
  switch (network) {
    case "arbitrum":
      return `https://api.arbiscan.io/api?apikey=${ARBISCAN_API_KEY}`
    case "matic":
      return `https://api.polygonscan.com/api?apikey=${POLYGONSCAN_API_KEY}`
  }
}

export function parseTransferEvent(event: RawTransferEvent): ParsedTransferEvent {
  return {
    from: ABI_CODER.decode(["address"], event.topics[1])[0],
    to: ABI_CODER.decode(["address"], event.topics[2])[0],
    tokenId:
      event.topics[3] && ABI_CODER.decode(["uint256"], event.topics[3])[0].toString(),
    timestamp: event.timeStamp,
  }
}
