// functions/api/access/policies.js
//
// GET  /api/access/policies         -> danh sách Access Policies (reusable policies)
// POST /api/access/policies         -> tạo policy mới
//
// Lưu ý: Cloudflare có 2 khái niệm policy dễ nhầm:
//  - "Reusable" Access Policies:  /accounts/{id}/access/policies
//  - Policies gắn trực tiếp vào 1 Access Application: /accounts/{id}/access/apps/{app_id}/policies
// File này quản lý loại đầu tiên (reusable, dùng chung nhiều app).

import { cfFetch, getAccountId, withErrorHandling, jsonResponse, parseQuery } from '../_utils.js';

export const onRequestGet = withErrorHandling(async ({ request, env }) => {
  const accountId = getAccountId(env);
  const { page = '1', per_page = '50' } = parseQuery(request);

  const data = await cfFetch(env, `/accounts/${accountId}/access/policies`, {
    query: { page, per_page },
  });

  return jsonResponse(data);
});

export const onRequestPost = withErrorHandling(async ({ request, env }) => {
  const accountId = getAccountId(env);
  const body = await request.json();

  if (!body.name || !body.decision) {
    return jsonResponse({ success: false, error: 'Thiếu "name" hoặc "decision" (allow/deny/bypass/non_identity).' }, 400);
  }

  const data = await cfFetch(env, `/accounts/${accountId}/access/policies`, {
    method: 'POST',
    body,
  });

  return jsonResponse(data);
});
