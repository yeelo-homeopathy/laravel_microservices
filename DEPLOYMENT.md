# Deployment Guide

This guide covers deploying the E-Commerce Platform to various environments.

## 🚀 Quick Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account
- Supabase project

### Steps
1. **Push to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   \`\`\`

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project settings

3. **Environment Variables**
   Add these in Vercel dashboard under Settings > Environment Variables:
   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   POSTGRES_URL=your_postgres_url
   POSTGRES_PRISMA_URL=your_prisma_url
   POSTGRES_URL_NON_POOLING=your_non_pooling_url
   \`\`\`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Visit your deployed application

## 🐳 Docker Deployment

### Dockerfile
\`\`\`dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
\`\`\`

### Docker Compose
\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - POSTGRES_URL=${POSTGRES_URL}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ecommerce
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
\`\`\`

## ☁️ AWS Deployment

### Using AWS Amplify
1. **Connect Repository**
   - Go to AWS Amplify Console
   - Connect your GitHub repository
   - Choose main branch

2. **Build Settings**
   \`\`\`yaml
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
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   \`\`\`

3. **Environment Variables**
   Add all required environment variables in Amplify console

### Using EC2 with PM2
\`\`\`bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# Clone and setup
git clone your-repo
cd ecommerce-platform
npm install
npm run build

# Start with PM2
pm2 start npm --name "ecommerce" -- start
pm2 startup
pm2 save
\`\`\`

## 🌐 Custom Domain Setup

### Vercel Custom Domain
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your custom domain
5. Configure DNS records as instructed

### SSL Certificate
Vercel automatically provides SSL certificates. For other platforms:
\`\`\`bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
\`\`\`

## 📊 Production Monitoring

### Health Checks
\`\`\`typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version
  })
}
\`\`\`

### Logging Setup
\`\`\`typescript
// lib/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
\`\`\`

## 🔒 Security Checklist

### Pre-deployment Security
- [ ] Environment variables secured
- [ ] Database RLS policies enabled
- [ ] API rate limiting configured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation implemented
- [ ] Authentication flows tested

### Security Headers
\`\`\`typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
\`\`\`

## 🚨 Rollback Strategy

### Vercel Rollback
\`\`\`bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
\`\`\`

### Database Rollback
\`\`\`sql
-- Create backup before deployment
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- Restore if needed
psql $DATABASE_URL < backup_file.sql
\`\`\`

## 📈 Performance Optimization

### Build Optimization
\`\`\`javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
}
\`\`\`

### CDN Configuration
- Enable Vercel Edge Network
- Configure image optimization
- Set up proper caching headers
- Use static asset optimization

## 🔍 Monitoring and Alerts

### Vercel Analytics
\`\`\`typescript
// Enable in vercel.json
{
  "analytics": {
    "id": "your-analytics-id"
  }
}
\`\`\`

### Custom Monitoring
\`\`\`typescript
// lib/monitoring.ts
export const trackEvent = (event: string, properties?: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Send to your analytics service
    analytics.track(event, properties)
  }
}
\`\`\`

## 🆘 Troubleshooting Deployment

### Common Issues
1. **Build Failures**
   - Check TypeScript errors
   - Verify environment variables
   - Review dependency versions

2. **Database Connection**
   - Verify connection strings
   - Check network policies
   - Test database accessibility

3. **Authentication Issues**
   - Confirm redirect URLs
   - Check Supabase configuration
   - Verify JWT settings

### Debug Commands
\`\`\`bash
# Check build locally
npm run build
npm start

# Verify environment
env | grep NEXT_PUBLIC

# Test database connection
npm run db:test
\`\`\`

---

For additional help, check the main README.md or contact support.
