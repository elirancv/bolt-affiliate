# Affiliate Store Builder

A platform for creating and managing affiliate stores with ease.

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env` and update with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

## Features

- User Authentication
- Store Management
- Product Management
- Page Builder
- Analytics Dashboard
- Subscription Plans

## Environment Setup

To run this project, you need to set up a Supabase project:

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once created, go to Project Settings > API
3. Copy the Project URL and paste it as `VITE_SUPABASE_URL`
4. Copy the `anon` public key and paste it as `VITE_SUPABASE_ANON_KEY`

## Database Schema

The project uses the following main tables:

- users (handled by Supabase Auth)
- stores
- products
- pages
- analytics

## Project Structure

```
src/
├── api/                  # API related code
│   ├── clients/         # API client implementations
│   ├── endpoints/       # API endpoint definitions
│   └── types/          # API type definitions
├── components/          # React components
│   ├── common/         # Shared components (Button, Input, etc.)
│   ├── features/       # Feature-specific components
│   ├── layout/         # Layout components
│   └── ui/            # UI components (modals, tooltips)
├── hooks/              # Custom React hooks
├── lib/               # Utility functions and external clients
├── pages/             # Page components
├── routes/            # Route definitions
├── services/          # Service layer
├── store/             # State management
│   ├── auth/         # Authentication state
│   ├── ui/           # UI state
│   └── features/     # Feature-specific state
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Development Guidelines

### Component Structure
- Use the appropriate directory for your component:
  - `common/` for reusable, generic components
  - `features/` for feature-specific components
  - `layout/` for layout-related components
  - `ui/` for complex UI components

### State Management
- Use the appropriate store:
  - `auth/` for authentication state
  - `ui/` for UI-related state
  - `features/` for feature-specific state
- Create new stores in the appropriate directory

### API Calls
- Use the `apiClient` from `api/clients/apiClient.ts`
- Handle errors appropriately using try/catch
- Use the `useApi` hook for data fetching

### Error Handling
- Wrap components with `ErrorBoundary` where appropriate
- Use the `toast` notifications for user feedback
- Log errors to the console in development

### Forms
- Use the shared Form components from `components/common/Form.tsx`
- Implement form validation using react-hook-form
- Handle form submission errors appropriately

### Styling
- Use Tailwind CSS for styling
- Follow the project's color scheme and design system
- Use the `cn` utility for conditional classes

### Testing
- Write tests for critical functionality
- Use React Testing Library for component tests
- Test error cases and edge conditions

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Development

The project is built with:

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Router
- Zustand