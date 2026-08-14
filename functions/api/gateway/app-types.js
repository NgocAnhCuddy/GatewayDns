// functions/api/gateway/app-types.js
//
// GET /api/gateway/app-types -> danh sách Application / App Type mappings
// (dùng cho selector "Application" trong Visual Builder).

import { cfFetch, getAccountId, withErrorHandling, jsonResponse } from '../_utils.js';

export const onRequestGet = withErrorHandling(async ({ env }) => {
  const accountId = getAccountId(env);
  const data = await cfFetch(env, `/accounts/${accountId}/gateway/app_types`);
  return jsonResponse(data);
});
