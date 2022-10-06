import { ethers } from "ethers";

import { ABI_CODER } from "./constants";
import {
    Campaign, CampaignStatus, ParsedTransferEvent, RawTransferEvent, SupportedNetwork
} from "./types";

export function fromNetworkNameToChainId(network: SupportedNetwork): number {
  switch (network) {
    case "arbitrum":
      return 42161
    case "matic":
      return 137
  }
}

export function fromChainIdToNetworkName(chainId: number): SupportedNetwork {
  switch (Number(chainId)) {
    case 42161:
      return "arbitrum"
    case 137:
      return "matic"

    default:
      throw new Error(`Unsupported chainId: ${chainId}`)
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

export function getBlockExplorerPublicUrl(network: SupportedNetwork): string {
  switch (network) {
    case "arbitrum":
      return "https://arbiscan.io"
    case "matic":
      return "https://polygonscan.com"
  }
}

export function getCampaignStatus(campaign: Campaign): CampaignStatus | undefined {
  if (!campaign) return undefined

  const now = new Date()
  const startTime = new Date(campaign.startTime)
  const endTime = new Date(campaign.endTime)

  if (now < startTime) return "idle"
  else if (now > endTime) return "ended"
  else return "active"
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
