import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import * as AuthContextModule from '../context/AuthContext';

describe('ProtectedRoute Component', () => {
  it('redirects unauthenticated users to the /login route', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      token: null,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Form</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Secret Dashboard Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page Form')).toBeInTheDocument();
  });

  it('renders children when the user is authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: 'u-1',
        full_name: 'Test Analyst',
        username: 'analyst1',
        email: 'analyst@example.com',
        preferred_language: 'en',
        selected_interests: [],
        onboarding_completed: true,
      },
      token: 'jwt-token-123',
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Secret Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page Form</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Secret Dashboard Content')).toBeInTheDocument();
  });
});
