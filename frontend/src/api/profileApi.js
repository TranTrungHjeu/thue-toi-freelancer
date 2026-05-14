import axiosClient from './axiosClient';

export const profileApi = {
    extractCv: (file) => {
        const formData = new FormData();
        formData.append('file', file);

        return axiosClient.post('/v1/profile/cv-extract', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    updateFromCv: (payload) => axiosClient.patch('/v1/profile/update-from-cv', payload),
};

export default profileApi;