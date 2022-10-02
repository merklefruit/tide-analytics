export type SupportedNetwork = "arbitrum" | "matic";

export type Campaign = {
  title: string;
  description: string;
  id: string;
  chainId: number[];
  startTime: string;
  endTime: string;
  projectName: string;
  isPrivate: boolean;
  imageUrl: string;
  projectId: number;
  address: string;
};

export type CampaignStatus = "active" | "ended" | "idle";

export type TransferEvent = {
  from: string;
  to: string;
  tokenId?: string;
  timestamp?: string | number;
};
