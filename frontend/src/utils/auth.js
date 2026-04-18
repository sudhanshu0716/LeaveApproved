export const getUserAuthHeader = () => {
  const token = localStorage.getItem('travel_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getAdminAuthHeader = () => {
  const token = localStorage.getItem('admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
