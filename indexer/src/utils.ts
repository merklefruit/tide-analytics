import { ABI_CODER } from "./constants"
import {
  Campaign,
  CampaignStatus,
  ParsedTransferEvent,
  RawTransferEvent,
  SupportedNetwork,
} from "./types"

export function fromNetworkNameToChainId(network: SupportedNetwork): number {
  switch (network) {
    case "arbitrum":
      return 42161
    case "matic":
      return 137

    default:
      throw new Error(`Unsupported network: ${network}`)
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
    timestamp: event?.timeStamp,
    blockNumber: event?.blockNumber,
  }
}

function getBlockTime(network: SupportedNetwork) {
  const blockTime = network === "arbitrum" ? 2.3 : network === "matic" ? 0.571 : 0
  if (!blockTime) throw new Error(`Unsupported network: ${network}`)

  return blockTime
}

function getGenesisTimestamp(network: SupportedNetwork) {
  const genesisTImestamp =
    network === "arbitrum" ? 1622240000 : network === "matic" ? 1590824836 : 0
  if (!genesisTImestamp) throw new Error(`Unsupported network: ${network}`)

  return genesisTImestamp
}

export function getFuzzyBlockNumberFromTimestamp(
  timestamp: number,
  network: SupportedNetwork
) {
  const blockTime = getBlockTime(network)
  const genesisTimestamp = getGenesisTimestamp(network)

  return Math.floor((timestamp - genesisTimestamp) / blockTime)
}

export function getFuzzyTimestampFromBlockNumber(
  blockNumber: number,
  network: SupportedNetwork
) {
  const blockTime = getBlockTime(network)
  const genesisTimestamp = getGenesisTimestamp(network)

  return Math.floor(genesisTimestamp + blockNumber * blockTime)
}

export function getExactBlockNumberFromTimestamp(
  timestamp: number,
  network: SupportedNetwork
) {
  // TODO: implement this

  return 0
}

export function getExactTimestampFromBlockNumber(
  blockNumber: number,
  network: SupportedNetwork
) {
  // TODO: implement this

  return 0
}
