import axios from "axios";
import { Contract, ethers } from "ethers";
import Redis from "ioredis";

import { GET_ALL_CAMPAIGNS_URL, TRANSFER_EVENT_ABI } from "./constants";
import { formatTransferEvent, fromNetworkNameToChainId, getBlockExplorerApiUrl } from "./utils";

import type {
  SupportedNetwork,
  Campaign,
  CampaignStatus,
  TransferEvent,
} from "./types";

export default class Indexer {
  private provider: ethers.providers.AlchemyProvider;
  private network: SupportedNetwork;
  private redis: Redis;
  private blockExplorerApiUrl: string;

  private campaigns: Campaign[] = [];

  constructor(
    network: SupportedNetwork,
    alchemyKey: string,
    redisUrl?: string
  ) {
    console.log("Creating indexer for", network, "with Alchemy");

    this.network = network;
    this.blockExplorerApiUrl = getBlockExplorerApiUrl(network);
    this.provider = new ethers.providers.AlchemyProvider(network, alchemyKey);

    if (redisUrl)
      this.redis = new Redis(redisUrl, { tls: { rejectUnauthorized: false } });
    else this.redis = new Redis();
  }

  public async flushRedis() {
    console.log("Flushing Redis cache");
    return await this.redis.flushall();
  }

  private async collectCampaigns() {
    try {
      const campaignsResponse = await axios.get(GET_ALL_CAMPAIGNS_URL);
      const campaigns = campaignsResponse.data.campaigns;
      const campaignsOnCurrentNetwork: Campaign[] = campaigns
        .filter((campaign: Campaign) =>
          campaign.chainId.includes(fromNetworkNameToChainId(this.network))
        )
        // mapping the object from the API response to custom Campaign type
        .map((cmp: any) => {
          return {
            title: cmp.title,
            description: cmp.description,
            id: cmp.id,
            chainId: cmp.chainId[0],
            startTime: cmp.startTime,
            endTime: cmp.endTime,
            status: this.getCampaignStatus(cmp),
            network: this.network,
            projectName: cmp.projectName,
            isPrivate: cmp.isPrivate,
            imageUrl: cmp.imageUrl,
            projectId: cmp.projectId,
            address: cmp.address,
          };
        });

      this.campaigns = campaignsOnCurrentNetwork;
      console.log("Found", this.campaigns.length, "campaigns on", this.network);

      const campaignsKey = `campaigns:${this.network}`;
      const campaignsValues = this.campaigns.map((cmp) => JSON.stringify(cmp));
      await this.redis.rpush(campaignsKey, ...campaignsValues);
    } catch (err) {
      console.error("Error while fetching campaigns on ", this.network);
      console.error(err);
      this.campaigns = [];
    }
  }

  private getCampaignStatus(campaign: Campaign): CampaignStatus | null {
    if (!campaign) return null;

    const now = new Date();
    const startTime = new Date(campaign.startTime);
    const endTime = new Date(campaign.endTime);

    if (now < startTime) return "idle";
    else if (now > endTime) return "ended";
    else return "active";
  }

  private async getBlockNumberByTimestamp(timestamp: number) {
    try {
      const response = await axios.get(
        `${this.blockExplorerApiUrl}&module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before`
      );
      return response.data.result;
    } catch (err) {
      console.error("Error while fetching block number by timestamp");
      console.error(err);
    }
  }

  // Note: The explorer API only returns the last 1000 events,
  // so the ideal solution is to query the RPC instead.
  private async queryTransferEventsFromExplorer(
    contract: Contract,
    fromBlock: number,
    toBlock?: number
  ): Promise<TransferEvent[]> {
    try {
      const response = await axios.get(
        `${
          this.blockExplorerApiUrl
        }&module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${
          toBlock || "latest"
        }&address=${
          contract.address
        }&topic1=0x0000000000000000000000000000000000000000000000000000000000000000`
      );

      if (response.data.message !== "OK") throw new Error("API error");

      return response.data.result.map((log: any) => {
        return formatTransferEvent({
          from: log.topics[1],
          to: log.topics[2],
          tokenId: log.topics[3]?.toString(),
          timestamp: log?.timeStamp,
        });
      });
    } catch (err) {
      console.error("Error while fetching transfer events from explorer");
      console.error(err);
      return [];
    }
  }

  private async queryTransferEventsFromRpc(
    contract: Contract,
    fromBlock: number,
    toBlock?: number
  ): Promise<TransferEvent[]> {
    console.log("Querying transfers from block", fromBlock);

    try {
      const logs = await this.provider.getLogs({
        ...contract.filters.Transfer(),
        fromBlock,
        toBlock: toBlock || "latest",
      });

      const transfers = logs.map((log) => {
        const parsedLog = contract.interface.parseLog(log);
        const rawTransfer = {
          from: parsedLog.args[0],
          to: parsedLog.args[1],
          tokenId: parsedLog.args[2].toString(),
        };
        return formatTransferEvent(rawTransfer);
      });

      return transfers;
    } catch (err) {
      console.error("Error while fetching transfer events from RPC");
      console.error(err);
      return [];
    }
  }

  private async getAllTransfers(campaign: Campaign): Promise<TransferEvent[]> {
    const campaignStatus = this.getCampaignStatus(campaign);
    if (campaignStatus === "idle") return [];

    const campaignContract = new ethers.Contract(
      campaign.address,
      [TRANSFER_EVENT_ABI],
      this.provider
    );

    try {
      const startBlock = await this.getBlockNumberByTimestamp(
        new Date(campaign.startTime).getTime() / 1000
      );

      if (!startBlock)
        throw new Error(
          `Could not find start block for campaign ${campaign.id}`
        );

      if (campaignStatus === "ended") {
        const endBlock = await this.getBlockNumberByTimestamp(
          new Date(campaign.endTime).getTime() / 1000
        );

        if (!endBlock)
          throw new Error(
            `Could not find end block for campaign ${campaign.id}`
          );

        return await this.queryTransferEventsFromExplorer(
          campaignContract,
          startBlock,
          endBlock
        );
      } else {
        return await this.queryTransferEventsFromExplorer(
          campaignContract,
          startBlock
        );
      }
    } catch (err) {
      console.error("Error while fetching transfers on ", this.network);
      console.error("Campaign title: ", campaign.title);
      console.error(err);
      return [];
    }
  }

  private async saveParticipationsToRedis(
    transfers: TransferEvent[],
    campaign: Campaign
  ) {
    const title = campaign.title;
    const link = `https://tideprotocol.xyz/users/campaign/${campaign.id}`;
    const network = this.network;

    const key = `transfers:${campaign.id}`;
    const values = transfers.map((transfer) =>
      JSON.stringify({ ...transfer, title, link, network })
    );
    await this.redis.rpush(key, ...values);

    const key2 = `transfers:length:${campaign.id}`;
    await this.redis.set(key2, transfers.length);
  }

  private async getTransfersAmountFromRedis(campaignId: string) {
    const key = `transfers:length:${campaignId}`;
    const value = await this.redis.get(key);
    return value ? parseInt(value) : 0;
  }

  private async shouldUpdateTransfers(
    campaignId: string,
    eventsFound: number
  ): Promise<boolean> {
    const currentEvents = await this.getTransfersAmountFromRedis(campaignId);
    if (!currentEvents || currentEvents < eventsFound) return true;
    else return false;
  }

  private async indexCampaign(campaign: Campaign) {
    if (this.getCampaignStatus(campaign) === "idle")
      return console.log(`CID: ${campaign.id} is idle, skipping indexing`);

    const transfers = await this.getAllTransfers(campaign);
    if (!transfers) return console.log(`CID: ${campaign.id} has no transfers`);

    console.log(`CID: ${campaign.id}: ${transfers.length} transfers found.`);

    await this.saveParticipationsToRedis(transfers, campaign);
  }

  public async indexAllCampaigns() {
    await this.collectCampaigns();
    await Promise.all(
      this.campaigns.map((campaign) => this.indexCampaign(campaign))
    );
  }
}
