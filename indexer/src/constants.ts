import { ethers } from "ethers"

export const GET_ALL_CAMPAIGN_IDS_URL = "https://api.tideprotocol.xyz/campaign/ids"

export const GET_ALL_CAMPAIGNS_URL =
  "https://api.tideprotocol.xyz/campaign?onlyActive=false"

export const GET_ALL_AUDIENCES_URL = "https://api.tideprotocol.xyz/audience"

export const TRANSFER_EVENT_ABI =
  "event Transfer(address indexed from, address indexed to, uint256 tokenId)"

export const ABI_CODER = new ethers.utils.AbiCoder()
