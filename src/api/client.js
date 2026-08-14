// src/api/client.js
// Wrapper gọi các Pages Functions ở /api/*. Không bao giờ chứa API token —
// token chỉ tồn tại phía server (functions/api/_utils.js).

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || (json && json.success === false)) {
    throw new Error(json?.error || `Yêu cầu thất bại (${res.status})`);
  }

  return json;
}

export const api = {
  access: {
    policies: {
      list: (params = {}) => request(`/access/policies?${new URLSearchParams(params)}`),
      get: (id) => request(`/access/policies/${id}`),
      create: (body) => request('/access/policies', { method: 'POST', body }),
      update: (id, body) => request(`/access/policies/${id}`, { method: 'PUT', body }),
      remove: (id) => request(`/access/policies/${id}`, { method: 'DELETE' }),
    },
    users: {
      list: (params = {}) => request(`/access/users?${new URLSearchParams(params)}`),
    },
    devices: {
      list: () => request('/access/devices'),
    },
    logs: {
      list: (params = {}) => request(`/access/logs?${new URLSearchParams(params)}`),
    },
  },
  gateway: {
    policies: {
      list: () => request('/gateway/policies'),
      create: (body) => request('/gateway/policies', { method: 'POST', body }),
      update: (id, body) => request(`/gateway/policies/${id}`, { method: 'PUT', body }),
      remove: (id) => request(`/gateway/policies/${id}`, { method: 'DELETE' }),
    },
    logs: {
      list: (params = {}) => request(`/gateway/logs?${new URLSearchParams(params)}`),
    },
    categories: {
      list: () => request('/gateway/categories'),
    },
    appTypes: {
      list: () => request('/gateway/app-types'),
    },
  },
};
