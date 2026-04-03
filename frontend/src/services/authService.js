import api from './api';

export const authService = {
    login: async(email, password) => {
        const response = await api.post('/auth/login', {
            email: email,
            password: password
        });

        const data = response.data;

        // Nếu Backend trả về success (Theo Lean Web)
        if (data.success) {
            // Lưu token giả để pass qua điều kiện Bảo vệ Route (ProtectedRoute)
            localStorage.setItem('access_token', 'dummy-token-' + data.userId);

            // Lưu email để gửi trong header X-User-Email
            localStorage.setItem('user_email', email);

            // Lưu trực tiếp thông tin Backend gửi sang mà không cần gọi API /users/me
            const userInfo = {
                userId: data.userId,
                email: data.email,
                role: { authority: data.role.toLowerCase() } // VD: "landlord" thay vì "LANDLORD"
            };
            localStorage.setItem('user_info', JSON.stringify(userInfo));
        }

        return data;
    },

    register: async(userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    updateProfile: async(updateData) => {
        const response = await api.patch('/users/me', updateData);
        // Refresh cache
        const updatedUser = response.data;
        localStorage.setItem('user_info', JSON.stringify(updatedUser));
        return updatedUser;
    },

    // Đổi mật khẩu người dùng hiện tại
    changePassword: async(oldPassword, newPassword) => {
        const response = await api.patch('/users/me/password', {
            old_password: oldPassword,
            new_password: newPassword,
        });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('user_email');
    },

    getCurrentUser: async() => {
        const response = await api.get('/users/me');
        localStorage.setItem('user_info', JSON.stringify(response.data));
        return response.data;
    },

    getUserInfo: () => {
        const userInfo = localStorage.getItem('user_info');
        return userInfo ? JSON.parse(userInfo) : null;
    },

    getUserRole: () => {
        const userInfo = authService.getUserInfo();
        return userInfo?.role?.authority || null;
    },

    isOwner: () => {
        return authService.getUserRole() === 'owner';
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('access_token');
    }
};

// Provide default export for modules that import default
export default authService;
