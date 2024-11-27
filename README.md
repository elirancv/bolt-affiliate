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

## Development

The project is built with:

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase
- React Router
- Zustand