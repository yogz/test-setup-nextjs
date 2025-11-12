export const PUBLIC_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  PRICING: '/pricing',
  BLOG: '/blog',
} as const;

export const AUTH_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
} as const;

export const DASHBOARD_ROUTES = {
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  PROFILE: '/profile',
} as const;
