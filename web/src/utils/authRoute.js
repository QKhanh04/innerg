export const canAccessRoute = (user, allowedRoles = []) => {
  if (!user) {
    return false;
  }

  if (allowedRoles.length === 0) {
    return true;
  }

  if (user.uiRoles?.includes('admin')) {
    return true;
  }

  return allowedRoles.some((role) => user.uiRoles?.includes(role));
};

export const getDefaultRouteForUser = (user) => {
  if (!user) {
    return '/login';
  }

  if (user.uiRoles?.includes('mentee')) {
    return '/dashboard';
  }

  if (user.uiRoles?.includes('hr')) {
    return '/wishlist';
  }

  if (user.uiRoles?.includes('mentor') || user.uiRoles?.includes('admin')) {
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
