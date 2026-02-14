# Server Deployment Guide for TMC Portal

This guide provides step-by-step instructions to deploy the application on your server, integrating with your existing Docker environment.

## 1. Preparation

### A. dedicated Directory
Detailed steps to organize your projects.
```bash
# Navigate to your apps directory (example)
cd ~/apps 

# (Optional) Create a directory if you don't have one
mkdir -p tmcportal
cd tmcportal
```

### B. Git Setup
1. **Clone the repository** (if it's the first time):
   ```bash
   git clone https://github.com/icitify-portals/tmcportalreal.git .
   ```
2. **Or Pull latest changes** (if already cloned):
   ```bash
   git pull origin main
   ```

## 2. Configuration (.env)

You **must** create a `.env` file on the server. The `COPY . .` command in the Dockerfile ignores local `.env` files for security.

1. Create the file:
   ```bash
   nano .env
   ```
2. Paste the following configuration (Modify values as needed!):

```env
# --- SERVER CONFIGURATION ---
NODE_ENV=production
PORT=3000            # Port exposed to the host (Change if 3000 is taken)

# --- DATABASE ---
# IMPORTANT: If using a dockerized database, use the container name as host.
# Example: mysql://user:password@mysql_container_name:3306/tmc_portal
DATABASE_URL="mysql://root:YOUR_DB_PASSWORD@localhost:3306/tmc_portal"

# --- AUTH ---
# Generate a secret: openssl rand -base64 32
AUTH_SECRET="your-generated-secret-key"
NEXT_PUBLIC_APP_URL="https://your-domain.com" 

# --- AI KEYS (Optional) ---
GOOGLE_GENERATIVE_AI_API_KEY=""
DEEPSEEK_API_KEY=""
```

3. Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

## 3. Network Setup

Ensure all your app containers (PHP, existing Node app, Database) are on the same network if they need to talk to each other.

1. **Check unrelated networks**:
   ```bash
   docker network ls
   ```
2. **Create the network** (if it doesn't exist):
   ```bash
   docker network create app_network
   ```
   *(Note: The `docker-compose.yml` expects an external network named `app_network`. If you prefer to let it create one, edit `docker-compose.yml` and remove `external: true`)*.

3. **Connect DB (IMPORTANT)**:
   If your MySQL database is in another container, connect it to `app_network`:
   ```bash
   docker network connect app_network [your-mysql-container-name]
   ```

## 4. Build and Run

1. **Build and start the container**:
   ```bash
   docker-compose up -d --build
   ```
2. **Check logs** to ensure it started correctly:
   ```bash
   docker-compose logs -f tmcportal
   ```
   *(Press `Ctrl+C` to exit logs)*.

## 5. Database Setup

Once the container is running, you need to set up the database schema.

1. **Run Migrations**:
   This creates tables in your MySQL database.
   ```bash
   docker exec -it tmcportal npx prisma migrate deploy
   ```
   *(Note: Use `migrate deploy` for production, not `migrate dev`)*.

2. **Seed Data** (Optional/First time only):
   Populate initial roles and admin users.
   ```bash
   docker exec -it tmcportal npm run db:seed
   ```

## 6. Reverse Proxy (Nginx)

Since you have other apps, you likely use Nginx. Here is a block to add to your Nginx config (`/etc/nginx/sites-available/your-site`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000; # Match the PORT in your .env
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

After updating config:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 7. SSL (HTTPS)

Secure your site with Certbot:
```bash
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting
- **Port Conflict**: If port 3000 is used by your other Node app, allow a different port in `.env` (e.g., `PORT=3001`) and update your Nginx config to `proxy_pass http://localhost:3001`.
- **Database Connection**: If `prisma migrate` fails, check `DATABASE_URL`. If DB is in a container, ensure `app_network` is connected and use container name as host.
