import "dotenv/config"

import { Contract } from "ethers"

import { TRANSFER_EVENT_ABI } from "../constants"
import Indexer from "../indexer"

const ALCHEMY_ARBITRUM_KEY = process.env.ALCHEMY_ARBITRUM_KEY
const ALCHEMY_MATIC_KEY = process.env.ALCHEMY_MATIC_KEY
const REDIS_URL = process.env.REDIS_URL

describe("Indexer", () => {
  test("should create an indexer for matic", () => {
    const indexer = new Indexer("matic", "test", REDIS_URL)

    expect(indexer).toBeInstanceOf(Indexer)
    expect(indexer.network).toBe("matic")

    indexer.kill()
  })

  test("should create an indexer for arbitrum", () => {
    const indexer = new Indexer("arbitrum", "test", REDIS_URL)

    expect(indexer).toBeInstanceOf(Indexer)
    expect(indexer.network).toBe("arbitrum")

    indexer.kill()
  })

  test("should create an indexer with local Redis instance", () => {
    const indexer = new Indexer("arbitrum", "test")

    expect(indexer).toBeInstanceOf(Indexer)
    expect(indexer.network).toBe("arbitrum")

    indexer.kill()
  })

  describe("should index all campaigns", () => {
    let indexer: Indexer | null = null
    jest.setTimeout(30000)

    beforeAll(() => {
      if (!ALCHEMY_MATIC_KEY) throw new Error("Missing env vars")
      indexer = new Indexer("matic", ALCHEMY_MATIC_KEY, REDIS_URL)
      expect(indexer).toBeInstanceOf(Indexer)
    })

    afterAll(() => indexer?.kill())

    test("should collect all campaigns on matic", async () => {
      await indexer?.indexAllCampaigns()

      expect(indexer?.campaigns).toBeTruthy()
      expect(indexer?.campaigns?.length).toBeGreaterThan(0)
    })

    test("should fetch all transfers for a specific campaign using the RPC", async () => {
      jest.setTimeout(30000)

      const campaign = indexer?.campaigns?.[0]
      if (!campaign) throw new Error("No campaigns found!")

      const contract = new Contract(
        campaign.address,
        [TRANSFER_EVENT_ABI],
        indexer?.provider
      )

      const claims = await indexer?.queryTransferEventsFromRpc(contract, 0)

      expect(claims).toBeTruthy()
      expect(claims?.length).toBeGreaterThan(0)
    })
  })
})
