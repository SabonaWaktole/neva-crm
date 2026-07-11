import { authService } from '../services/authService';
import { useAuthStore } from '../store/useAuthStore';

export const useLogout = () => {
  const { logout: clearState } = useAuthStore();

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      clearState();
    }
  };

  return { logout };
};
