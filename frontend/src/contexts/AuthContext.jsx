import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Tải lần đầu: Kiểm tra xem Session Cookie còn hiệu lực không
        const checkAuth = async () => {
            try {
                // Chúng ta sẽ gọi API /api/auth/me tại Backend sau
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

    const login = async () => {
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
