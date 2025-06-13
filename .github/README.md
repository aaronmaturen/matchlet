# GitHub Pages Deployment

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

## How It Works

The workflow in `.github/workflows/deploy.yml` handles the build and deployment process:

1. When code is pushed to the `main` branch, the workflow is triggered
2. The workflow builds the project using `npm run build`
3. The built files from the `dist` directory are deployed to GitHub Pages

## Setup Instructions

To enable GitHub Pages deployment for this repository:

1. Go to your GitHub repository
2. Navigate to Settings > Pages
3. Under "Build and deployment" section:
   - Select "GitHub Actions" as the source
4. Make sure the repository has GitHub Pages enabled in the repository settings

## Troubleshooting

If the deployment fails:
- Check the Actions tab in your GitHub repository to see the workflow logs
- Ensure your build process is working correctly locally (`npm run build`)
- Verify that the `dist` directory contains all necessary files for the website

## Manual Deployment

You can also manually trigger a deployment:
1. Go to the Actions tab in your GitHub repository
2. Select the "Deploy to GitHub Pages" workflow
3. Click "Run workflow"
