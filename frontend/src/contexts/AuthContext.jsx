import { createContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial load: check if session cookie is valid
        const checkAuth = async () => {
            try {
                // We'll call /api/auth/me later on backend
                // const res = await axiosClient.get('/auth/me');
                // setUser(res.data);
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
         // const res = await axiosClient.post('/auth/login', { email, password });
         // setUser(res.data.user);
    };

    const logout = async () => {
         // await axiosClient.post('/auth/logout');
         // setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        role: user?.role
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
