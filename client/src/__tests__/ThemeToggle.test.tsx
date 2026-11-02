import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

describe('Theme Engine & Toggle Component', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('renders theme toggle and initializes with dark theme by default', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /switch to/i });
    expect(toggleButton).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('toggles smoothly between dark and light mode on click', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggleButton = screen.getByRole('button', { name: /switch to/i });
    
    // Initially dark
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Click to switch to light mode
    fireEvent.click(toggleButton);
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('satyacheck_theme')).toBe('light');

    // Click to switch back to dark mode
    fireEvent.click(toggleButton);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
    expect(localStorage.getItem('satyacheck_theme')).toBe('dark');
  });
});
