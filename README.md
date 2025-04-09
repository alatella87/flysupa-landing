# Flysupa Landing

This is a simplified landing page and admin setup for Flysupa. It handles:

1. Supabase project creation
2. SQL schema execution
3. Storage bucket setup
4. Vercel project deployment

## Setup

```bash
# Install dependencies
npm install

# Run the server
npm start

# Run in development mode
npm run dev
```

## Project Structure

- `server.js` - Express server with API endpoints
- `routes/` - API route handlers
- `src/pages/Landing.tsx` - React landing page
- `dry_schema.sql` - SQL schema for Supabase

## API Endpoints

- `/create-supabase-project` - Create a new Supabase project
- `/executeSql` - Execute SQL schema on Supabase project
- `/setup-storage` - Set up storage buckets and policies
- `/create-vercel-project` - Create a new Vercel project
- `/deploy-vercel-repo` - Deploy Vercel project