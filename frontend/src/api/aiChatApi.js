import axiosClient from './axiosClient';

export const aiChatApi = {
  /**
   * @param {{ role: 'user' | 'assistant', content: string }[]} messages
   */
  send(messages) {
    return axiosClient.post('/v1/ai/chat', { messages });
  },
};

export default aiChatApi;
