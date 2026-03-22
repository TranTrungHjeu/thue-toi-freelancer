import { useState, useEffect } from 'react';
import { clearAccessToken } from '../api/axiosClient';
import authApi from '../api/authApi';
import { AuthContext } from './auth-context';

const CURRENT_USER_STORAGE_KEY = 'currentUser';

const readStoredUser = () => {
    if (typeof window === 'undefined') {
        return null;
    }
    try {
        const rawValue = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
        return rawValue ? JSON.parse(rawValue) : null;
    } catch {
        return null;
    }
};

const persistUser = (user) => {
    if (typeof window === 'undefined') {
        return;
    }
    if (user) {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
        return;
    }
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => readStoredUser());
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        const res = await authApi.getProfile();
        setUser(res.data);
        persistUser(res.data);
        return res.data;
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                await refreshProfile();
            } catch {
                clearAccessToken();
                persistUser(null);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await authApi.login({ email, password });
        setUser(res.data.user);
        persistUser(res.data.user);
        return res.data.user;
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } finally {
            clearAccessToken();
            persistUser(null);
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        refreshProfile,
        isAuthenticated: !!user,
        role: user?.role
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
