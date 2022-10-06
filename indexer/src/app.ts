import "dotenv/config";

import Aggregator from "./aggregator";
import Indexer from "./indexer";

async function main() {
  const ALCHEMY_ARBITRUM_KEY = process.env.ALCHEMY_ARBITRUM_KEY
  const ALCHEMY_MATIC_KEY = process.env.ALCHEMY_MATIC_KEY
  const ARBISCAN_API_KEY = process.env.ARBISCAN_API_KEY
  const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY
  const REDIS_URL = process.env.REDIS_URL

  if (
    !ALCHEMY_ARBITRUM_KEY ||
    !ALCHEMY_MATIC_KEY ||
    !ARBISCAN_API_KEY ||
    !POLYGONSCAN_API_KEY ||
    !REDIS_URL
  )
    throw new Error("Missing Environment variables, check your .env file!")

  const arbitrum = new Indexer("arbitrum", ALCHEMY_ARBITRUM_KEY, REDIS_URL)
  const matic = new Indexer("matic", ALCHEMY_MATIC_KEY, REDIS_URL)

  await arbitrum.flushRedis()

  await arbitrum.indexAllCampaigns()
  await matic.indexAllCampaigns()

  const agg = new Aggregator(REDIS_URL)
  await agg.calculateStats()
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
