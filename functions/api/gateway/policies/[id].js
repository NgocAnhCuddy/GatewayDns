// functions/api/gateway/policies/[id].js
//
// PUT    /api/gateway/policies/:id -> cập nhật Gateway rule
// DELETE /api/gateway/policies/:id -> xóa Gateway rule

import { cfFetch, getAccountId, withErrorHandling, jsonResponse } from '../../_utils.js';

export const onRequestPut = withErrorHandling(async ({ params, request, env }) => {
  const accountId = getAccountId(env);
  const body = await request.json();

  const data = await cfFetch(env, `/accounts/${accountId}/gateway/rules/${params.id}`, {
    method: 'PUT',
    body,
  });

  return jsonResponse(data);
});

export const onRequestDelete = withErrorHandling(async ({ params, env }) => {
  const accountId = getAccountId(env);
  const data = await cfFetch(env, `/accounts/${accountId}/gateway/rules/${params.id}`, {
    method: 'DELETE',
  });
  return jsonResponse(data);
});
