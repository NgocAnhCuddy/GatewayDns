// functions/api/access/policies/[id].js
//
// GET    /api/access/policies/:id  -> chi tiết 1 policy
// PUT    /api/access/policies/:id  -> cập nhật policy (edit chính sách)
// DELETE /api/access/policies/:id  -> xóa policy

import { cfFetch, getAccountId, withErrorHandling, jsonResponse } from '../../_utils.js';

export const onRequestGet = withErrorHandling(async ({ params, env }) => {
  const accountId = getAccountId(env);
  const data = await cfFetch(env, `/accounts/${accountId}/access/policies/${params.id}`);
  return jsonResponse(data);
});

export const onRequestPut = withErrorHandling(async ({ params, request, env }) => {
  const accountId = getAccountId(env);
  const body = await request.json();

  const data = await cfFetch(env, `/accounts/${accountId}/access/policies/${params.id}`, {
    method: 'PUT',
    body,
  });

  return jsonResponse(data);
});

export const onRequestDelete = withErrorHandling(async ({ params, env }) => {
  const accountId = getAccountId(env);
  const data = await cfFetch(env, `/accounts/${accountId}/access/policies/${params.id}`, {
    method: 'DELETE',
  });
  return jsonResponse(data);
});
