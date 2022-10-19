import Redis from "ioredis"
import Logger from "./logger"

import { Campaign, LogLevel, ParsedTransferEvent, Stats } from "./types"
import {
  fromChainIdToNetworkName,
  getBlockExplorerPublicUrl,
  getCampaignStatus,
} from "./utils"

export default class Aggregator extends Logger {
  private redis: Redis
  private campaigns: Campaign[] = []
  private stats: Partial<Stats> = {}

  constructor(redisUrl?: string, logLevel?: LogLevel) {
    super(logLevel ?? "info")

    if (redisUrl) this.redis = new Redis(redisUrl, { tls: { rejectUnauthorized: false } })
    else this.redis = new Redis()
  }

  public async fetchCampaignIds() {
    const keys = await this.redis.keys("campaigns:*")
    const values = await Promise.all(keys.map((key) => this.redis.lrange(key, 0, -1)))
    const campaigns: Campaign[] = values.flat().map((value) => value && JSON.parse(value))
    const campaignIds = campaigns.map((campaign) => campaign.id)
    this.campaigns = campaigns
    this.stats.campaignIds = campaignIds
    return campaignIds
  }

  public async calculatetotalParticipations() {
    const keys = await this.redis.keys("transfers:length:*")
    const values = await this.redis.mget(...keys)
    const total = values.reduce((acc, val) => acc + parseInt(val || "0"), 0)
    this.stats.totalParticipations = total
  }

  public async fetchCurrentClaimsMap() {
    if (!this.stats.campaignIds) throw new Error("Campaign ids not found")

    return Promise.all(
      this.stats.campaignIds.map(async (cid) => {
        return { cid, claims: await this.redis.get(`transfers:length:${cid}`) }
      })
    )
  }

  private async getAllClaims() {
    const campaignsFullData = await Promise.all(
      this.campaigns.map(async (campaign) => {
        const network = fromChainIdToNetworkName(campaign.chain)
        const key = `transfers:${campaign.id}`
        const values = await this.redis.lrange(key, 0, -1)
        const parsedTransfers: ParsedTransferEvent[] = values.map(
          (value) => value && JSON.parse(value)
        )

        const transfers = parsedTransfers.map((transfer) => ({
          campaign: campaign.title,
          project: campaign.projectName,
          address: transfer.to,
          date: new Date(parseInt(transfer.timestamp as string, 16) * 1000),
          link: `${getBlockExplorerPublicUrl(network)}/address/${transfer.to}`,
          tokenId: transfer.tokenId,
          network: network,
        }))

        return { ...campaign, transfers }
      })
    )

    return campaignsFullData.map(({ transfers }) => transfers).flat()
  }

  public async getLast20ClaimsSortedByDate() {
    const claims = await this.getAllClaims()
    const uniqueUsers = new Set(claims.map((claim) => claim.address)).size
    claims.sort(({ date: a }, { date: b }) => a.getTime() - b.getTime())

    this.stats.last20ClaimsSortedByDate = claims.reverse().slice(0, 20)
    this.stats.uniqueUsers = uniqueUsers
  }

  private async getTop10CampaignsSortedByParticipants() {
    const keys = await this.redis.keys("campaigns:*")
    const values = await Promise.all(keys.map((key) => this.redis.lrange(key, 0, -1)))
    const campaigns: Campaign[] = values.flat().map((value) => JSON.parse(value))

    const campaignsFull = await Promise.all(
      campaigns.map(async (campaign) => {
        const key = `transfers:length:${campaign.id}`
        const participants = parseInt((await this.redis.get(key)) || "0")
        const status = getCampaignStatus(campaign)
        const network = fromChainIdToNetworkName(campaign.chain)
        const link = `https://tideprotocol.xyz/users/campaign/${campaign.id}`

        return { ...campaign, participants, status, network, link }
      })
    )

    campaignsFull.sort(({ participants: a }, { participants: b }) => b - a)
    this.stats.top10CampaignsSortedByParticipants = campaignsFull.slice(0, 10)
  }

  private async uploadStats() {
    await this.redis.set("stats", JSON.stringify(this.stats))
  }

  private async flushStats() {
    await this.redis.del("stats")
  }

  public async calculateStats() {
    this.info("Calculating stats...")

    // Remove old stats
    await this.flushStats()

    // Fetch all relevant stats
    await this.fetchCampaignIds()
    await this.calculatetotalParticipations()
    await this.getLast20ClaimsSortedByDate()
    await this.getTop10CampaignsSortedByParticipants()

    // Finally upload them to Redis for quick consumption
    await this.uploadStats()

    this.info("Done calculating stats!")
  }
}
