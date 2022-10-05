import { GraphQLClient, RequestDocument, Variables } from "graphql-request";

import type { GraphQLProviderOptions, IGraphQLProvider } from "./types"

export class GraphQLProvider implements IGraphQLProvider {
  readonly graphQLClient: GraphQLClient

  constructor(options: GraphQLProviderOptions) {
    this.graphQLClient = new GraphQLClient(options.url, {
      headers: options.headers,
    })
  }

  public query<T extends Record<string, unknown>>(
    query: RequestDocument,
    variables?: Variables,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.graphQLClient.request<T>(query, variables, headers)
  }
}
