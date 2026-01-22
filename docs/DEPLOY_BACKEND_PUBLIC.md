# Deploy Backend for Remote Access

This guide will help you deploy your Go backend to a public server so your friends can use the app from anywhere.

## Current Limitation
- **Local Network Only**: Currently works only on your local network (10.0.0.22:8080)
- **Friends Can't Access**: They can't connect because it's not publicly accessible

## Solution: Deploy to Cloud

### Option 1: Railway (Recommended - Easiest) 🚂
**Free tier available, very easy setup**

1. **Sign up**: Go to [railway.app](https://railway.app) and sign up with GitHub
2. **Create Project**: Click "New Project" → "Deploy from GitHub repo"
3. **Select Your Repo**: Choose your SRG-ReactNative-Expo repository
4. **Configure**:
   - **Root Directory**: Set to `backend`
   - **Build Command**: `go mod tidy`
   - **Start Command**: `go run ./cmd/server`
5. **Set Environment Variables**:
   ```
   PORT=8080
   RAWG_API_KEY=your_key_here
   SUPABASE_URL=your_url_here
   SUPABASE_ANON_KEY=your_key_here
   OPENAI_API_KEY=your_key_here (optional)
   STEAM_API_KEY=your_key_here (optional)
   ```
6. **Deploy**: Railway will automatically deploy and give you a public URL like:
   ```
   https://your-app-name.up.railway.app
   ```

### Option 2: Render (Free Tier) 🎨
**Free tier available, good for small apps**

1. **Sign up**: Go to [render.com](https://render.com)
2. **New Web Service**: Connect your GitHub repo
3. **Configure**:
   - **Build Command**: `cd backend && go mod tidy`
   - **Start Command**: `cd backend && go run ./cmd/server`
   - **Environment**: Go
4. **Set Environment Variables** (same as Railway)
5. **Deploy**: Get public URL like `https://your-app.onrender.com`

### Option 3: Fly.io (Free Tier) ✈️
**Good performance, free tier available**

1. **Install Fly CLI**: `brew install flyctl` (Mac) or see [fly.io/docs](https://fly.io/docs)
2. **Sign up**: `flyctl auth signup`
3. **Create App**: `cd backend && flyctl launch`
4. **Set Secrets**: 
   ```bash
   flyctl secrets set RAWG_API_KEY=your_key
   flyctl secrets set SUPABASE_URL=your_url
   # ... etc
   ```
5. **Deploy**: `flyctl deploy`
6. **Get URL**: `flyctl status` shows your public URL

### Option 4: DigitalOcean App Platform (Paid) 💧
**More control, paid but affordable**

1. **Sign up**: [digitalocean.com](https://digitalocean.com)
2. **Create App**: Connect GitHub repo
3. **Configure**: Similar to Railway/Render
4. **Deploy**: Get public URL

### Option 5: Self-Hosted VPS (Advanced) 🖥️
**Full control, requires server management**

1. **Get VPS**: DigitalOcean Droplet, AWS EC2, Linode, etc.
2. **Install Go**: `sudo apt install golang-go` (Ubuntu)
3. **Clone Repo**: `git clone your-repo`
4. **Set Environment Variables**: Create `.env` file
5. **Run with PM2 or systemd**: Keep it running
6. **Set up Nginx**: Reverse proxy for HTTPS
7. **Get Domain**: Point domain to your VPS IP

## After Deployment

### 1. Get Your Public URL
After deploying, you'll get a URL like:
- Railway: `https://srg-backend.up.railway.app`
- Render: `https://srg-backend.onrender.com`
- Fly.io: `https://srg-backend.fly.dev`

### 2. Update Frontend Configuration

**For Production Build:**
Update `frontend/SRG/.env`:
```bash
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

**For Development:**
You can keep local URL for development, but friends should use the public URL.

### 3. Share with Friends

Your friends need to:
1. Install the app (via Expo Go or build)
2. Set `EXPO_PUBLIC_BACKEND_URL` to your public backend URL
3. Or you can hardcode it in the app for production

## Security Considerations

### Current Setup (Development)
- CORS allows all origins (`*`) - OK for development
- No authentication required

### For Production (Recommended)
1. **Restrict CORS**: Only allow your app's domain
2. **Add API Key**: Require API key for requests
3. **Rate Limiting**: Already implemented ✅
4. **HTTPS**: Use HTTPS (Railway/Render/Fly.io provide this automatically)

### Update CORS in Backend
Edit `backend/cmd/server/main.go`:
```go
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// For production, replace "*" with your app's domain
		allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
		if allowedOrigin == "" {
			allowedOrigin = "*" // Development default
		}
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, apikey")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
```

## Testing Public Deployment

1. **Test Health Endpoint**:
   ```bash
   curl https://your-backend-url.com/health
   ```
   Should return: `{"status":"ok"}`

2. **Test from App**:
   - Update `EXPO_PUBLIC_BACKEND_URL` in your app
   - Restart Expo
   - Try generating recommendations

## Cost Comparison

| Service | Free Tier | Paid Tier | Best For |
|---------|-----------|-----------|----------|
| Railway | 500 hours/month | $5/month | Easiest setup |
| Render | 750 hours/month | $7/month | Simple deployments |
| Fly.io | 3 shared VMs | Pay as you go | Performance |
| DigitalOcean | None | $5/month | Full control |

## Recommended: Railway

**Why Railway?**
- ✅ Easiest setup (5 minutes)
- ✅ Free tier (500 hours/month)
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ Environment variables UI
- ✅ Automatic deployments

## Quick Start with Railway

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repo
5. Set root directory: `backend`
6. Add environment variables
7. Deploy!
8. Copy the public URL
9. Update your app's `EXPO_PUBLIC_BACKEND_URL`

That's it! Your friends can now use the app from anywhere! 🎉
