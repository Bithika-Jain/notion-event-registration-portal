# Vercel Deployment Guide

This guide will help you deploy the Event Registration Portal to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Your code pushed to GitHub (already done ✓)
- Vercel CLI (optional, for command-line deployment)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Log in to Vercel**
   - Go to [vercel.com](https://vercel.com) and sign in

2. **Import your repository**
   - Click "Add New..." → "Project"
   - Select your GitHub repository: `event-registration-portal`
   - Vercel will automatically detect it as a Node.js project

3. **Configure the project**
   - **Framework Preset**: Select "Other" or "Node.js"
   - **Root Directory**: Leave as `./`
   - **Build Command**: Leave empty (not needed for this project)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

4. **Environment Variables** (if needed)
   - No environment variables are required for this project
   - The app uses in-memory SQLite with auto-seeded data

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete (usually 1-2 minutes)
   - Your app will be live at `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from your project directory**
   ```bash
   cd "c:\MY PROJECTS\Event Registration Portal"
   vercel
   ```

4. **Follow the prompts**
   - Link to your existing project or create a new one
   - Confirm the settings
   - Your app will be deployed

## Important Notes

### Database Behavior
- The app now uses an **in-memory SQLite database** instead of a file-based database
- This is required because Vercel's serverless environment has an ephemeral filesystem
- The database is **auto-seeded with sample events** on every deployment
- **Registrations are not persisted** between deployments (data resets on each deploy)

### If You Need Persistent Data
For production use with persistent registrations, consider:
1. **Vercel Postgres** - Managed PostgreSQL database
2. **Supabase** - Open-source Firebase alternative with PostgreSQL
3. **PlanetScale** - MySQL-compatible serverless database
4. **Neon** - Serverless PostgreSQL

To implement any of these, you would need to:
- Replace the SQLite implementation with the chosen database
- Update the `server/database.js` file
- Add database connection strings as environment variables in Vercel

### Local Development
Your local development environment still works as before:
```bash
npm install
npm start
```
The app will run at `http://localhost:3000`

### Custom Domain (Optional)
After deployment, you can add a custom domain:
1. Go to your project in Vercel Dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain and follow the DNS instructions

## Troubleshooting

### Build Fails
- Ensure all dependencies are in `package.json`
- Check the Vercel build logs for specific errors

### API Routes Not Working
- Verify `vercel.json` is in the root directory
- Check that `server/index.js` exports the Express app

### Database Issues
- The in-memory database resets on each deployment (expected behavior)
- For persistent data, implement a cloud database solution

## Verification

After deployment, test these endpoints:
- `https://your-project.vercel.app/` - Home page
- `https://your-project.vercel.app/api/events` - Events API
- `https://your-project.vercel.app/api/events/build-with-ai-2025` - Single event API

## Support

For issues specific to Vercel:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://vercel.com/community)
