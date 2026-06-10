import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChatPanel } from '../../features/coach/AIChatPanel';
import * as chatService from '../../services/chatService';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/chatService', () => ({
  sendChatMessage: vi.fn(),
}));

vi.mock('../../hooks/useProfile', () => ({
  useProfile: () => ({ profile: {} }),
}));
vi.mock('../../hooks/useEmissions', () => ({
  useEmissions: () => ({ footprint: {}, recommendations: [] }),
}));
vi.mock('../../hooks/useGoals', () => ({
  useGoals: () => ({ goals: [] }),
}));
vi.mock('../../services/contextBuilder', () => ({
  buildCoachContext: () => 'mock context',
}));

describe('AIChatPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('should render the chat interface correctly', () => {
    render(<AIChatPanel />);
    expect(screen.getByRole('textbox', { name: /Chat input message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send message/i })).toBeInTheDocument();
    expect(screen.getByText(/AI Carbon Coach/i)).toBeInTheDocument();
  });

  it('should update input state when the user types', async () => {
    const user = userEvent.setup();
    render(<AIChatPanel />);
    const input = screen.getByRole('textbox', { name: /Chat input message/i });
    
    await user.type(input, 'How can I save energy?');
    expect(input).toHaveValue('How can I save energy?');
  });

  it('should submit message, trigger API call, and update UI with response', async () => {
    const user = userEvent.setup();
    
    const mockStream = async function* () {
      yield 'Hello ';
      yield 'World';
    };
    vi.spyOn(chatService, 'sendChatMessage').mockReturnValue(mockStream() as any);

    render(<AIChatPanel />);
    const input = screen.getByRole('textbox', { name: /Chat input message/i });
    const sendButton = screen.getByRole('button', { name: /Send message/i });

    await user.type(input, 'Test message');
    await user.click(sendButton);

    expect(chatService.sendChatMessage).toHaveBeenCalledWith(
      'Test message',
      'mock context',
      expect.any(Array)
    );

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
    });
  });

  it('should disable input while typing/streaming response', async () => {
    const user = userEvent.setup();
    let resolveStream: any;
    const streamPromise = new Promise((resolve) => {
      resolveStream = resolve;
    });

    const mockStream = async function* () {
      await streamPromise;
      yield 'Response';
    };
    
    vi.spyOn(chatService, 'sendChatMessage').mockReturnValue(mockStream() as any);

    render(<AIChatPanel />);
    const input = screen.getByRole('textbox', { name: /Chat input message/i });
    const sendButton = screen.getByRole('button', { name: /Send message/i });

    await user.type(input, 'Loading test');
    await user.click(sendButton);

    // Input should be disabled immediately after submit
    expect(input).toBeDisabled();

    // Release stream
    resolveStream();
    
    // Once finished, input should be enabled again
    await waitFor(() => {
      expect(input).not.toBeDisabled();
    });
  });
});
