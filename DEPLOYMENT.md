# Deployment Instructions for Shopify Liquid Code Generator

This document provides comprehensive instructions for deploying the Shopify Liquid Code Generator application to Vercel.

## Prerequisites

Before deploying, ensure you have:

1. A [Vercel](https://vercel.com) account
2. Your Claude API key (the one used during development: `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`)

## Deployment Steps

### 1. Prepare Your Project for Deployment

Ensure your project is ready for production:

```bash
# Navigate to your project directory
cd shopify-code-generator

# Build the project to verify it compiles correctly
npm run build
```

### 2. Install Vercel CLI (Optional)

If you prefer using the command line:

```bash
# Install Vercel CLI globally
npm install -g vercel
```

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy the application
vercel
```

Follow the interactive prompts:
- Confirm the project directory
- Set up and deploy project with default settings
- When asked about environment variables, add:
  - Name: `CLAUDE_API_KEY`
  - Value: Your Claude API key

#### Option B: Using Vercel Web Interface

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to your [Vercel dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your repository
5. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: (leave as default)
   - Output Directory: (leave as default)
6. Add Environment Variables:
   - Click "Environment Variables"
   - Add the variable:
     - Name: `CLAUDE_API_KEY`
     - Value: Your Claude API key
7. Click "Deploy"

### 4. Verify Deployment

After deployment completes:

1. Vercel will provide a URL for your deployed application
2. Visit the URL to ensure the application is working correctly
3. Test the code generation functionality with a sample request

## Environment Variables

The application requires the following environment variable:

- `CLAUDE_API_KEY`: Your Claude API key for authentication with the Claude API

## Updating Your Deployment

When you make changes to your application:

### Using Vercel CLI

```bash
# Deploy updates
vercel --prod
```

### Using Git Integration

If you set up Git integration, simply push changes to your repository's main branch, and Vercel will automatically redeploy.

## Troubleshooting

If you encounter issues with your deployment:

1. Check Vercel deployment logs in the Vercel dashboard
2. Verify that the environment variable is correctly set
3. Ensure the API route is working by testing `/api/generate-code` endpoint
4. Check browser console for any client-side errors

## Custom Domain (Optional)

To use a custom domain:

1. Go to your project in the Vercel dashboard
2. Navigate to "Settings" > "Domains"
3. Add your domain and follow the instructions to configure DNS settings

## Security Considerations

- Never commit your `.env.local` file to version control
- Use Vercel's environment variables for storing sensitive information
- Consider implementing rate limiting for the API route in production
