import { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import type { DecodedToken } from '../types';

export const useAuth = () => {
  const [userRole, setUserRole] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      navigate('/');
      return;
    }

    const decoded: DecodedToken = jwtDecode(storedToken);
    setUserRole(decoded.role);
    setUserId(decoded.sub);
    setUsername(decoded.username);
    setToken(storedToken);

    fetchCurrentUser(decoded.sub, storedToken);
  }, [navigate]);

  const fetchCurrentUser = async (id: string, authToken: string) => {
    try {
      const response = await axios.get(`http://localhost:3000/users/${id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUsername(response.data.username);
    } catch (error) {
      console.error('Failed to fetch current user', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return {
    userRole,
    username,
    userId,
    token,
    logout,
  };
};
