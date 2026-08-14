// functions/api/access/logs.js
//
// GET /api/access/logs -> nhật ký xác thực Access (ai đăng nhập app nào, khi nào, allow/deny)
// Query params hỗ trợ: since, until, limit (đều optional, theo Cloudflare API)

import { cfFetch, getAccountId, withErrorHandling, jsonResponse, parseQuery } from '../_utils.js';

export const onRequestGet = withErrorHandling(async ({ request, env }) => {
  const accountId = getAccountId(env);
  const { since, until, limit = '100' } = parseQuery(request);

  const data = await cfFetch(env, `/accounts/${accountId}/access/logs/access-requests`, {
    query: { since, until, limit },
  });

  return jsonResponse(data);
});
