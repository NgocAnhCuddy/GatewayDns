// functions/api/gateway/policies.js
//
// GET  /api/gateway/policies -> danh sách Gateway rules (DNS/HTTP/Network filtering)
// POST /api/gateway/policies -> tạo rule mới

import { cfFetch, getAccountId, withErrorHandling, jsonResponse } from '../_utils.js';

export const onRequestGet = withErrorHandling(async ({ env }) => {
  const accountId = getAccountId(env);
  const data = await cfFetch(env, `/accounts/${accountId}/gateway/rules`);
  return jsonResponse(data);
});

export const onRequestPost = withErrorHandling(async ({ request, env }) => {
  const accountId = getAccountId(env);
  const body = await request.json();

  if (!body.name || !body.action) {
    return jsonResponse({ success: false, error: 'Thiếu "name" hoặc "action" (block/allow/isolate/...).' }, 400);
  }

  const data = await cfFetch(env, `/accounts/${accountId}/gateway/rules`, {
    method: 'POST',
    body,
  });

  return jsonResponse(data);
});
