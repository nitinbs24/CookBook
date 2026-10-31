import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext.jsx';

const setup = () => renderHook(() => useTheme(), { wrapper: ThemeProvider });
const isDark = () => document.documentElement.classList.contains('dark');

describe('ThemeContext', () => {
  it('defaults to system and follows the OS preference', () => {
    window.__prefersDark = true;

    const { result } = setup();

    expect(result.current.theme).toBe('system');
    expect(isDark()).toBe(true);
  });

  it('dark adds the .dark class and is remembered; light removes it', () => {
    const { result } = setup();

    act(() => result.current.setTheme('dark'));
    expect(isDark()).toBe(true);
    expect(localStorage.getItem('rb_theme')).toBe('dark');

    act(() => result.current.setTheme('light'));
    expect(isDark()).toBe(false);
  });

  it('system clears the saved choice', () => {
    const { result } = setup();
    act(() => result.current.setTheme('dark'));

    act(() => result.current.setTheme('system'));

    expect(localStorage.getItem('rb_theme')).toBeNull();
  });
});
