import { chatService } from '../chatService';
import { apiClient } from '../apiClient';

jest.mock('../apiClient');

describe('chatService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('sends a message successfully', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          message: 'Hello!',
          sessionId: 'session-123',
          products: [],
        },
      },
    };

    (apiClient.post as jest.Mock).mockResolvedValue(mockResponse);

    const result = await chatService.sendMessage({ message: 'Hello' });

    expect(result).toEqual(mockResponse.data);
    expect(apiClient.post).toHaveBeenCalledWith('/chat/conversation', { message: 'Hello' });
  });

  it('handles errors when sending message', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue(new Error('Network error'));

    await expect(chatService.sendMessage({ message: 'Hello' })).rejects.toThrow('Network error');
  });
});
