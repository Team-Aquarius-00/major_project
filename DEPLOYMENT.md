# Production Deployment Guide

This guide covers deploying the interview monitoring system to production.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates obtained
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] Authentication/Authorization enabled
- [ ] Logging configured
- [ ] Monitoring setup

## Backend Deployment (FastAPI)

### Option 1: AWS EC2

```bash
# 1. SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# 2. Install Python and dependencies
sudo apt-get update
sudo apt-get install python3.11 python3-pip python3-venv
sudo apt-get install postgresql-client

# 3. Clone repository
git clone https://your-repo.git
cd major_project/backend

# 4. Setup environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Create .env (update with real values)
cp .env.example .env
# Edit .env with production DATABASE_URL, etc.

# 6. Install Gunicorn (production ASGI server)
pip install gunicorn uvicorn

# 7. Run with Gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 app.main:app
```

### Option 2: Heroku

```bash
# 1. Create Procfile
echo "web: gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 app.main:app" > Procfile

# 2. Create runtime.txt
echo "python-3.11.0" > runtime.txt

# 3. Deploy
git push heroku main

# 4. Set environment variables
heroku config:set DATABASE_URL=postgresql://...
heroku config:set FRONTEND_URL=https://yourdomain.com
```

### Option 3: Docker

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app/ ./app/

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

CMD ["python", "-m", "app.main"]
```

```bash
# Build and run
docker build -t interview-monitor-backend .
docker run -p 8000:8000 --env-file .env interview-monitor-backend
```

### Option 4: DigitalOcean App Platform

1. Push code to GitHub
2. Connect GitHub to DigitalOcean
3. Choose Python runtime
4. Set build command: `pip install -r requirements.txt`
5. Set run command: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000 app.main:app`
6. Add environment variables
7. Deploy

## Frontend Deployment (Next.js)

### Option 1: Vercel (Recommended)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Set environment variables
vercel env add NEXT_PUBLIC_BACKEND_URL
# Enter: https://your-backend-api.com
```

### Option 2: Netlify

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod

# 4. Set environment variables via Netlify dashboard
# NEXT_PUBLIC_BACKEND_URL=https://your-backend-api.com
```

### Option 3: AWS Amplify

1. Push code to GitHub
2. Connect GitHub to Amplify
3. Configure build settings:
   ```
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
   artifacts:
     baseDirectory: out
   ```
4. Add environment variables
5. Deploy

### Option 4: Self-Hosted (AWS EC2)

```bash
# 1. SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# 2. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone repository
git clone https://your-repo.git
cd major_project

# 4. Install and build
npm ci
npm run build

# 5. Install PM2 for process management
npm install -g pm2

# 6. Start application
pm2 start "npm start" --name "interview-monitor"
pm2 startup
pm2 save
```

## Database Setup

### PostgreSQL on AWS RDS

1. Create RDS instance:

   ```bash
   - Engine: PostgreSQL 14
   - Database name: interview_db
   - Master username: postgres
   - Password: (generate strong password)
   - Multi-AZ: Yes (for production)
   ```

2. Get connection string:

   ```
   postgresql://postgres:password@endpoint:5432/interview_db
   ```

3. Run migrations:
   ```bash
   POSTGRES_URL=postgresql://... npx prisma migrate deploy
   npx prisma db seed
   ```

### PostgreSQL on Own Server

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb interview_db

# Create user
sudo -u postgres createuser -P postgres_user

# Set password
sudo -u postgres psql -c "ALTER USER postgres_user WITH PASSWORD 'password';"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE interview_db TO postgres_user;"
```

## SSL/HTTPS Configuration

### Using Let's Encrypt with Nginx

```bash
# Install Nginx
sudo apt-get install nginx

# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --nginx -d yourdomain.com

# Configure Nginx
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Environment Variables

### Backend (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@prod-db.rds.amazonaws.com:5432/interview_db

# Frontend (for CORS)
FRONTEND_URL=https://yourdomain.com

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=8000
DEBUG=False

# Models
YOLOV8_MODEL=yolov8n.pt

# Security
SECRET_KEY=generate-random-secure-key-here
API_KEY=your-api-key-for-authentication
```

### Frontend (.env.local or system)

```env
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
BACKEND_URL=https://api.yourdomain.com
```

## Monitoring & Logging

### Backend Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/backend.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)
```

### Application Monitoring

1. **CloudWatch** (AWS):

   ```bash
   pip install watchtower
   # Setup in main.py
   ```

2. **Datadog**:
   - Add Datadog agent
   - Monitor application metrics
   - Set up alerts

3. **Sentry** (Error tracking):
   ```bash
   pip install sentry-sdk
   # Initialize in main.py
   ```

## Security Hardening

### 1. Enable CORS Only for Frontend

```python
# Update backend CORS configuration
allowed_origins = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```

### 2. Add JWT Authentication

```python
from fastapi_jwt_auth import AuthJWT

@app.post("/api/protected")
async def protected_route(Authorize: AuthJWT = Depends()):
    Authorize.jwt_required()
    # Route logic
```

### 3. Rate Limiting

```bash
pip install slowapi
```

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/api/tab-switch")
@limiter.limit("10/minute")
async def rate_limited_endpoint():
    pass
```

### 4. Input Validation

- Always validate API inputs
- Use Pydantic models
- Sanitize database queries
- Implement CSRF protection

## Backup Strategy

### Database Backups

```bash
# Automated daily backup (add to crontab)
0 2 * * * pg_dump postgresql://user:pass@localhost/interview_db > /backups/interview_db_$(date +\%Y\%m\%d).sql

# Upload to S3
aws s3 cp /backups/ s3://your-backup-bucket/ --recursive
```

## Performance Optimization

1. **Database**:
   - Add indexes: `CREATE INDEX ON interview(interview_id);`
   - Enable connection pooling
   - Regular VACUUM and ANALYZE

2. **Caching**:
   - Add Redis for session caching
   - Cache API responses

3. **CDN**:
   - Use CloudFront for static assets
   - Cache frontend build

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancing**:
   - Use AWS ELB or Nginx
   - Route traffic to multiple backend instances
   - Use sticky sessions for WebSocket

2. **Database Scaling**:
   - Read replicas for reporting
   - Sharding for very large deployments

3. **WebSocket Scaling**:
   - Use Redis pub/sub for inter-process communication
   - Redis cluster for session storage

## Troubleshooting

### WebSocket Issues in Production

- Verify HTTPS/WSS (not WS)
- Check firewall rules for port 443
- Ensure sticky sessions in load balancer
- Check WebSocket upgrade headers

### Database Connection Issues

- Verify security group allows connection
- Check database user permissions
- Monitor connection pool usage
- Set timeouts appropriately

### Performance Issues

- Monitor CPU and memory usage
- Check database query performance
- Use application profiling tools
- Optimize image/model loading

## Monitoring Checklist

- [ ] Error rate < 1%
- [ ] Response time < 200ms
- [ ] Database connections healthy
- [ ] Log aggregation enabled
- [ ] Alerts configured for failures
- [ ] Backup verification passing
- [ ] SSL certificate expiry monitored
- [ ] Traffic patterns analyzed

## Support & Maintenance

1. Set up monitoring and alerting
2. Schedule regular backups
3. Plan for certificate renewal
4. Monitor dependency updates
5. Plan quarterly security audits
6. Document runbooks for common issues

---

For detailed backend API documentation, see [backend/README.md](./backend/README.md)
For quick start guide, see [QUICKSTART.md](./QUICKSTART.md)
