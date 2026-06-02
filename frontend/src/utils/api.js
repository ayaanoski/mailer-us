// API fetch wrapper with token integration and automatic logout handler

let globalLogoutCallback = null;

export const setLogoutCallback = (callback) => {
  globalLogoutCallback = callback;
};

export const apiFetch = async (path, options = {}) => {
  const token = localStorage.getItem('mailerToken') || '';
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      // Clear session locally and trigger callback to redirect to login
      localStorage.removeItem('mailerToken');
      localStorage.removeItem('mailerUser');
      if (globalLogoutCallback) {
        globalLogoutCallback();
      }
    }
    throw new Error(body.error || body.message || 'Request failed');
  }

  return body;
};

export const getLocalSession = () => {
  try {
    const token = localStorage.getItem('mailerToken') || '';
    const user = JSON.parse(localStorage.getItem('mailerUser') || 'null');
    return { token, user };
  } catch {
    return { token: '', user: null };
  }
};

export const saveSession = (token, user) => {
  localStorage.setItem('mailerToken', token);
  localStorage.setItem('mailerUser', JSON.stringify(user));
};

export const deleteLocalSession = () => {
  localStorage.removeItem('mailerToken');
  localStorage.removeItem('mailerUser');
};
