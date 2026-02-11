import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock child components to simplify testing
jest.mock('@/components/HealthCheck/HealthCheck', () => ({
  HealthCheck: () => <div>Health Check Component</div>,
}));

jest.mock('@/components/ChatTester/ChatTester', () => ({
  ChatTester: () => <div>Chat Tester Component</div>,
}));

jest.mock('@/components/ChatWidget/ChatWidget', () => ({
  ChatWidget: () => <div>Chat Widget Component</div>,
}));

describe('App', () => {
  it('renders welcome message', () => {
    render(<App />);
    expect(screen.getByText('Welcome to Emraay-Solutions Smart Shopper')).toBeInTheDocument();
  });

  it('renders header title', () => {
    render(<App />);
    expect(screen.getByText('Emraay-Solutions Smart Shopper')).toBeInTheDocument();
  });

  it('renders all main components', () => {
    render(<App />);
    expect(screen.getByText('Health Check Component')).toBeInTheDocument();
    expect(screen.getByText('Chat Tester Component')).toBeInTheDocument();
    expect(screen.getByText('Chat Widget Component')).toBeInTheDocument();
  });
});
