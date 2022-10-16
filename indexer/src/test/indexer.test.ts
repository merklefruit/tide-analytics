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
      // tested campaign: 'Tide Superusers Wanted'

      const contract = new Contract(
        "0xBE861b7576e8Ea260ACc76b33CCac7358D5236a0",
        [TRANSFER_EVENT_ABI],
        indexer?.provider
      )

      const startBlock = 33376589
      const endBlock = 34308302

      const claims = await indexer?.queryTransferEventsFromRpc(
        contract,
        startBlock,
        endBlock
      )

      expect(claims).toBeTruthy()
      expect(claims?.length).toBe(844)
    })
  })
})
