import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Tự động gỡ bỏ
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((toastId) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
    }, []);

    // Cơ chế render tối giản cho thông báo Toast
    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div 
                        key={toast.id} 
                        className={`px-4 py-3 rounded shadow-md text-white min-w-[250px] flex justify-between items-center transition-all ${
                            toast.type === 'error' ? 'bg-red-600' : 
                            toast.type === 'success' ? 'bg-green-600' : 
                            toast.type === 'warn' ? 'bg-yellow-500' : 
                            'bg-blue-600'
                        }`}
                    >
                        <span>{toast.message}</span>
                        <button onClick={() => removeToast(toast.id)} className="ml-4 font-bold opacity-75 hover:opacity-100">
                            &times;
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
