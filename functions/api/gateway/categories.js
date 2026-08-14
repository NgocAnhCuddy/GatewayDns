// functions/api/gateway/categories.js
//
// GET /api/gateway/categories -> danh sách Content/Security Categories
// (dùng để đổ vào dropdown Value trong Visual Builder, thay vì hardcode ID).

import { cfFetch, getAccountId, withErrorHandling, jsonResponse } from '../_utils.js';

export const onRequestGet = withErrorHandling(async ({ env }) => {
  const accountId = getAccountId(env);
  const data = await cfFetch(env, `/accounts/${accountId}/gateway/categories`);
  return jsonResponse(data);
});
