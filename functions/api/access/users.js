// functions/api/access/users.js
//
// GET /api/access/users -> danh sách users đã từng xác thực qua Cloudflare Access

import { cfFetch, getAccountId, withErrorHandling, jsonResponse, parseQuery } from '../_utils.js';

export const onRequestGet = withErrorHandling(async ({ request, env }) => {
  const accountId = getAccountId(env);
  const { page = '1', per_page = '50' } = parseQuery(request);

  const data = await cfFetch(env, `/accounts/${accountId}/access/users`, {
    query: { page, per_page },
  });

  return jsonResponse(data);
});
