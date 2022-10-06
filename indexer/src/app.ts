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

  // Create indexers for desired networks
  const arbitrum = new Indexer("arbitrum", ALCHEMY_ARBITRUM_KEY, REDIS_URL)
  const matic = new Indexer("matic", ALCHEMY_MATIC_KEY, REDIS_URL)

  const indexers = [arbitrum, matic]

  // On the first run, flush the Redis cache
  await arbitrum.flushRedis()

  // Then start indexing campaigns for all supported networks
  await Promise.all(indexers.map((idx) => idx.indexAllCampaigns()))

  // Start aggregating statistics for indexed campaigns cached on Redis
  const aggregator = new Aggregator(REDIS_URL)
  await aggregator.calculateStats()

  // Start the task to check for new claims periodically every 5 minutes
  while (true) {
    await Promise.all(indexers.map((idx) => idx.indexAllCampaigns({ onlyUpdate: true })))
    await aggregator.calculateStats()

    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000))
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
