const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
  return atob(padded);
};

export const parseJwtPayload = (token) => {
  if (!token) {
    return null;
  }

  try {
    const [, payload] = token.split('.');
    if (!payload) {
      return null;
    }

    return JSON.parse(decodeBase64Url(payload));
  } catch {
    return null;
  }
};

const ROLE_MAP = {
  User: 'mentee',
  Trainer: 'mentor',
  Mentor: 'mentor',
  HR: 'hr',
  HRManager: 'hr',
  Admin: 'admin',
  SuperAdmin: 'admin',
};

export const normalizeRolesForUi = (roles = []) => {
  return [...new Set(roles.map((role) => ROLE_MAP[role]).filter(Boolean))];
};

export const buildAuthUser = (data) => {
  const payload = parseJwtPayload(data?.token);
  const rawRoles = payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  const appRoles = Array.isArray(rawRoles) ? rawRoles : rawRoles ? [rawRoles] : [];

  return {
    userId: payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || null,
    userName: data?.userName || payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
    email: data?.email || payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
    appRoles,
    uiRoles: normalizeRolesForUi(appRoles),
  };
};
