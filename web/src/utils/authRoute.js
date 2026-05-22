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
