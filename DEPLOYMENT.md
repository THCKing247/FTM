# Deploy to GitHub Pages

This guide shows you how to deploy your Football Team Management app to GitHub Pages.

## Step 1: Push Code to GitHub

1. **Initialize Git** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository**:
   - Go to https://github.com/new
   - Name it (e.g., `football-team-management`)
   - Don't initialize with README (you already have files)
   - Click "Create repository"

3. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/football-team-management.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Enable GitHub Pages

1. **Go to your repository on GitHub**
2. **Click Settings** → **Pages** (left sidebar)
3. **Under "Source"**, select:
   - Source: **GitHub Actions**
4. **Save**

## Step 3: Add Secrets (Environment Variables)

1. **Go to your repository** → **Settings** → **Secrets and variables** → **Actions**
2. **Click "New repository secret"**
3. **Add these two secrets**:
   - Name: `REACT_APP_SUPABASE_URL`
     Value: `https://szbtvgkcmatvnioaucun.supabase.co`
   - Name: `REACT_APP_SUPABASE_ANON_KEY`
     Value: `your_anon_key_here` (get from Supabase dashboard)

## Step 4: Trigger Deployment

1. **Push any change** to trigger the workflow:
   ```bash
   git add .
   git commit -m "Trigger deployment"
   git push
   ```

2. **Check deployment status**:
   - Go to your repo → **Actions** tab
   - You should see "Deploy to GitHub Pages" workflow running
   - Wait for it to complete (green checkmark)

## Step 5: Access Your Site

Your app will be live at:
- `https://YOUR_USERNAME.github.io/football-team-management`

## Step 6: Custom Domain (Optional - for ftm.apextsgroup.com)

1. **In your repository** → **Settings** → **Pages**
2. **Under "Custom domain"**, enter: `ftm.apextsgroup.com`
3. **Add DNS record** in your domain provider:
   - Type: `CNAME`
   - Name: `ftm`
   - Value: `YOUR_USERNAME.github.io`
4. **Wait for DNS to propagate** (can take a few hours)

## Troubleshooting

**Build fails?**
- Check the **Actions** tab for error messages
- Make sure secrets are set correctly
- Verify your Supabase URL and key are correct

**404 errors on routes?**
- GitHub Pages needs a `404.html` file that redirects to `index.html`
- The workflow should handle this, but if not, create `client/public/404.html`:
  ```html
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>Redirecting...</title>
      <script>
        sessionStorage.redirect = location.href;
        location.replace(location.pathname.split('/').slice(0, -1).join('/') + '/index.html');
      </script>
    </head>
    <body></body>
  </html>
  ```

**Need to update the site?**
- Just push changes to `main` branch
- GitHub Actions will automatically rebuild and redeploy
