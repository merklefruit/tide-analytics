import { getBlockExplorerApiUrl } from "../utils"

describe("utils", () => {
  test("should return the correct block explorer API URL for matic", () => {
    const url = getBlockExplorerApiUrl("matic")
    expect(url).toContain("https://api.polygonscan.com/api")
  })

  test("should return the correct block explorer API URL for arbitrum", () => {
    const url = getBlockExplorerApiUrl("arbitrum")
    expect(url).toContain("https://api.arbiscan.io/api")
  })
})
