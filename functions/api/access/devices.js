// functions/api/access/devices.js
//
// GET /api/access/devices -> danh sách thiết bị đã đăng ký (WARP client devices)

import { cfFetch, getAccountId, withErrorHandling, jsonResponse } from '../_utils.js';

export const onRequestGet = withErrorHandling(async ({ env }) => {
  const accountId = getAccountId(env);
  const data = await cfFetch(env, `/accounts/${accountId}/devices`);
  return jsonResponse(data);
});
