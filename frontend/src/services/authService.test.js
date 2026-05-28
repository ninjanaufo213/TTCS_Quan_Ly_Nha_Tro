import authService from './authService';

test('isAuthenticated reflects access_token presence', () => {
  localStorage.removeItem('access_token');
  expect(authService.isAuthenticated()).toBe(false);

  localStorage.setItem('access_token', 'test-token');
  expect(authService.isAuthenticated()).toBe(true);
});

