# Production Security Checklist

## Environment variables

Do not commit real secrets to git. Keep local files such as `server/.env` private.

Required backend variables:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_ORIGIN=https://your-domain.com
REQUIRE_HTTPS=true
GOOGLE_API_KEY=store-in-hosting-secret-manager
```

Required frontend variable:

```env
VITE_API_BASE_URL=https://api.your-domain.com
```

## Domain and HTTPS

1. Point your domain DNS to the hosting provider.
2. Host the frontend on HTTPS, for example `https://your-domain.com`.
3. Host the backend on HTTPS, for example `https://api.your-domain.com`.
4. Set `CLIENT_ORIGIN` to the frontend URL exactly.
5. Set `VITE_API_BASE_URL` to the backend URL exactly.
6. Use the hosting provider TLS certificate or put Nginx/Caddy in front of Node.

## Demo accounts

Hard-coded demo login shortcuts are disabled automatically when `NODE_ENV=production`.

## API keys

Put `GOOGLE_API_KEY` in the hosting provider secret manager. Never paste real keys into README, screenshots, commits, or public chat logs.
