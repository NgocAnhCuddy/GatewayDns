// functions/api/gateway/logs.js
//
// GET /api/gateway/logs?type=dns|http|network&hours=1
//
// Gateway logs KHÔNG nằm ở REST API — Cloudflare expose chúng qua
// GraphQL Analytics API (graphql.cloudflare.com). Query khác nhau tùy loại:
//  - gatewayResolverQueriesAdaptiveGroups  (DNS)
//  - gatewayHttpAdaptiveGroups             (HTTP filtering)
//  - gatewayNetworkAdaptiveGroups          (Network/L4 filtering)

import { getAccountId, withErrorHandling, jsonResponse, parseQuery, CfError } from '../_utils.js';

const GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql';

const DATASET_BY_TYPE = {
  dns: 'gatewayResolverQueriesAdaptiveGroups',
  http: 'gatewayHttpAdaptiveGroups',
  network: 'gatewayNetworkAdaptiveGroups',
};

function buildQuery(dataset) {
  // Field set rút gọn, đủ cho một bảng log hữu ích; có thể mở rộng thêm sau.
  return `
    query GatewayLogs($accountTag: string!, $since: Time!, $until: Time!, $limit: Int!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          ${dataset}(
            limit: $limit
            filter: { datetime_geq: $since, datetime_leq: $until }
            orderBy: [datetime_DESC]
          ) {
            dimensions {
              datetime
            }
            count
          }
        }
      }
    }
  `;
}

export const onRequestGet = withErrorHandling(async ({ request, env }) => {
  const accountId = getAccountId(env);
  const { type = 'dns', hours = '1', limit = '200' } = parseQuery(request);

  const dataset = DATASET_BY_TYPE[type];
  if (!dataset) {
    return jsonResponse(
      { success: false, error: `type phải là một trong: ${Object.keys(DATASET_BY_TYPE).join(', ')}` },
      400
    );
  }

  const until = new Date();
  const since = new Date(until.getTime() - Number(hours) * 3600 * 1000);

  if (!env.CF_API_TOKEN) {
    throw new CfError(500, 'Thiếu biến môi trường CF_API_TOKEN.');
  }

  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: buildQuery(dataset),
      variables: {
        accountTag: accountId,
        since: since.toISOString(),
        until: until.toISOString(),
        limit: Number(limit),
      },
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || json?.errors?.length) {
    const msg = json?.errors?.map((e) => e.message).join('; ') || res.statusText;
    throw new CfError(res.status, `Gateway Analytics API lỗi: ${msg}`);
  }

  const rows = json?.data?.viewer?.accounts?.[0]?.[dataset] || [];
  return jsonResponse({ success: true, type, dataset, since, until, rows });
});
