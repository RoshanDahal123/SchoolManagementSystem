import { useSelector } from 'react-redux';

export const useAuth = () => {
  const auth = useSelector((state: any) => state.auth);
  return auth;
};
