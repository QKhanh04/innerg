import api from './axios';

export const uploadApi = {
  // Upload Ảnh (dành cho Cover Image)
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Upload Tài Liệu (dành cho PDF, DOCX, XLSX, PPTX, v.v...)
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default uploadApi;
