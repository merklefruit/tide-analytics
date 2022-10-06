// Copy-pasted from indexer/types.ts

export type SupportedNetwork = "arbitrum" | "matic"

export type Campaign = {
  title: string
  description: string
  id: string
  chainId: number
  startTime: string
  endTime: string
  projectName: string
  isPrivate: boolean
  imageUrl: string
  projectId: number
  address: string
  participants?: number
  status?: CampaignStatus
  network?: SupportedNetwork
  link?: string
}

export type CampaignStatus = "active" | "ended" | "idle"

export type RawTransferEvent = {
  address: string
  topics: string[]
  data: string
  blockNumber: string
  blockHash: string
  timeStamp: string
  gasPrice: string
  gasUsed: string
  logIndex: string
  transactionHash: string
  transactionIndex: string
}

export type GetTransferLogsResponse = {
  message: string
  result: RawTransferEvent[]
}

export type ParsedTransferEvent = {
  from?: string
  to?: string
  tokenId?: string
  campaign?: string
  project?: string
  address?: string
  timestamp?: string | number
  network?: SupportedNetwork
  link?: string
  date?: Date
}

export type Stats = {
  campaignIds: string[]
  totalParticipations: number
  last20ClaimsSortedByDate: ParsedTransferEvent[]
  top10CampaignsSortedByParticipants: Campaign[]
  uniqueUsers: number
}
