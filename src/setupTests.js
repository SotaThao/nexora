import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('./contexts/NotificationContext', () => ({
  useNotification: () => ({
    showToast: vi.fn(),
    showConfirm: vi.fn(() => Promise.resolve(true))
  })
}));
