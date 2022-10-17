import "dotenv/config"

import Aggregator from "./aggregator"
import Indexer from "./indexer"

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
  const arbitrum = new Indexer("arbitrum", ALCHEMY_ARBITRUM_KEY, REDIS_URL, "info")
  const matic = new Indexer("matic", ALCHEMY_MATIC_KEY, REDIS_URL, "info")

  const indexers = [arbitrum, matic]

  // Create an aggregator to collect data from indexers
  const aggregator = new Aggregator(REDIS_URL)

  // Flush Redis cache before starting
  await arbitrum.flushRedis()

  // Start the task to check for new claims periodically every 5 minutes

  let onlyUpdate = false
  while (true) {
    await indexers[0].indexAllCampaigns({ onlyUpdate })
    await new Promise((resolve) => setTimeout(resolve, 1200))
    await indexers[1].indexAllCampaigns({ onlyUpdate })
    await new Promise((resolve) => setTimeout(resolve, 1200))

    await aggregator.calculateStats()
    onlyUpdate = true

    await new Promise((resolve) => setTimeout(resolve, 5 * 60 * 1000))
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
