export type FetchMethod = "rpc" | "explorer"

export type LogLevel = "info" | "debug" | "error" | "warn" | "success" | "none"

export type SupportedNetwork = "arbitrum" | "matic"

export type Campaign = {
  title: string
  description: string
  id: string
  chainId: number[]
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
}

export type CampaignStatus = "active" | "ended" | "idle"

export type RawTransferEvent = {
  address: string
  topics: string[]
  data: string
  blockNumber: number
  blockHash: string
  timeStamp?: string
  gasPrice?: string
  gasUsed?: string
  logIndex: number
  transactionHash: string
  transactionIndex: number
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
  blockNumber?: string | number
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
