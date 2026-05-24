export const canAccessRoute = (user, allowedRoles = []) => {
  if (!user) {
    return false;
  }

  // No specific role required → allow any authenticated user
  if (allowedRoles.length === 0) {
    return true;
  }

  // Normalise UI roles to lower‑case for case‑insensitive comparison
  const normalizedRoles = (user.uiRoles || []).map((r) => r.toLowerCase());

  // Admin (any case) always has access
  if (normalizedRoles.includes('admin')) {
    return true;
  }

  // Check if any of the allowedRoles (already lower‑case) exist in the normalized list
  return allowedRoles.some((role) => normalizedRoles.includes(role));
};

export const getDefaultRouteForUser = (user) => {
  if (!user) {
    return '/login';
  }

  if (user.uiRoles?.includes('admin')) {
    return '/admin';
  }

  if (user.uiRoles?.includes('mentee')) {
    return '/dashboard';
  }

  if (user.uiRoles?.includes('hr')) {
    return '/wishlist';
  }

  if (user.uiRoles?.includes('mentor')) {
    return '/resources';
  }

  return '/resources';
};

export const getDefaultRouteFromRoles = (roles = []) => {
  const map = {
    Mentee: 'mentee',
    Mentor: 'mentor',
    HR: 'hr',
    SystemAdmin: 'admin',
  };

  return getDefaultRouteForUser({
    uiRoles: roles.map((role) => map[role]).filter(Boolean),
  });
};
