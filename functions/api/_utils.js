// functions/api/_utils.js
//
// Các hàm dùng chung cho mọi Pages Function trong /functions/api/**.
// Không export default — đây là module tiện ích, không phải 1 route.

const CF_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Gọi Cloudflare API v4 bằng API Token lấy từ biến môi trường (env).
 * Token KHÔNG BAO GIỜ được gửi ra client — nó chỉ tồn tại ở server (Pages Function).
 *
 * @param {object} env - env bindings của Pages Function (chứa CF_API_TOKEN, CF_ACCOUNT_ID)
 * @param {string} path - path sau /client/v4, vd: `/accounts/${accountId}/access/policies`
 * @param {object} options - { method, body, query }
 */
export async function cfFetch(env, path, options = {}) {
  const { method = 'GET', body, query } = options;

  if (!env.CF_API_TOKEN) {
    throw new CfError(500, 'Thiếu biến môi trường CF_API_TOKEN. Vào Cloudflare Pages > Settings > Environment variables để thêm.');
  }

  let url = `${CF_BASE}${path}`;
  if (query && Object.keys(query).length) {
    const qs = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    url += `?${qs.toString()}`;
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${env.CF_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || (json && json.success === false)) {
    const errors = json?.errors?.map((e) => `[${e.code}] ${e.message}`).join('; ') || res.statusText;
    throw new CfError(res.status, `Cloudflare API lỗi: ${errors}`);
  }

  return json;
}

/** Lấy CF_ACCOUNT_ID từ env, báo lỗi rõ ràng nếu thiếu. */
export function getAccountId(env) {
  if (!env.CF_ACCOUNT_ID) {
    throw new CfError(500, 'Thiếu biến môi trường CF_ACCOUNT_ID.');
  }
  return env.CF_ACCOUNT_ID;
}

export class CfError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** Bọc handler để tự động trả JSON lỗi có định dạng thống nhất. */
export function withErrorHandling(handler) {
  return async (context) => {
    try {
      return await handler(context);
    } catch (err) {
      const status = err instanceof CfError ? err.status : 500;
      return jsonResponse({ success: false, error: err.message || 'Lỗi không xác định' }, status);
    }
  };
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Xác thực yêu cầu bằng header Cloudflare Access đặt vào (Cf-Access-Authenticated-User-Email).
 * Đây là lớp kiểm tra bổ sung ở server-side — lớp chính vẫn là Access Application
 * chặn ở Cloudflare edge trước khi request tới được Pages Function.
 * Nếu header không có (vd: đang test local), cho qua nhưng gắn cờ `unverified`.
 */
export function getAccessIdentity(request) {
  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  return {
    email: email || null,
    verified: Boolean(email),
  };
}

/** Parse query params từ request URL thành object. */
export function parseQuery(request) {
  const url = new URL(request.url);
  return Object.fromEntries(url.searchParams.entries());
}
