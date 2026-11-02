import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NewsInput } from '../components/NewsInput';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('NewsInput Component', () => {
  it('disables the submit button when the input is empty', () => {
    const handleSubmit = vi.fn();
    render(<NewsInput onSubmit={handleSubmit} isLoading={false} />);

    const submitBtn = screen.getByRole('button', { name: /Run Forensic Check/i });
    expect(submitBtn).toBeDisabled();
  });

  it('enables the submit button when text is entered', () => {
    const handleSubmit = vi.fn();
    render(<NewsInput onSubmit={handleSubmit} isLoading={false} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Breaking news claim with sufficient characters' } });

    const submitBtn = screen.getByRole('button', { name: /Run Forensic Check/i });
    expect(submitBtn).not.toBeDisabled();
  });
});
