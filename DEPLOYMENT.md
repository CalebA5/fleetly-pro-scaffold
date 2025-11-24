# Fleetly Production Deployment Guide

## Prerequisites

### Required Environment Variables
The following environment variables must be configured in Replit Secrets before deployment:

**Database (Auto-configured by Replit PostgreSQL)** - 6 variables
- `DATABASE_URL` - PostgreSQL connection string (format: postgresql://user:pass@host:port/db)
- `PGHOST` - Database host
- `PGPORT` - Database port (default: 5432)
- `PGUSER` - Database username
- `PGPASSWORD` - Database password
- `PGDATABASE` - Database name

**Application Secrets (Required)** - 1 variable
- `SESSION_SECRET` - Random string for session encryption (min 32 characters)
  ```bash
  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

**Third-Party Integrations (Required)** - 3 variables
- `VITE_MAPBOX_ACCESS_TOKEN` - Mapbox API key for maps (get from https://mapbox.com)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key for AI Assist feature
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI API base URL (typically: https://api.openai.com/v1)

**Replit Platform Variables (Auto-configured)** - 3 variables
- `REPLIT_DOMAINS` - Replit deployment domains (auto-configured by Replit)
- `REPLIT_DEV_DOMAIN` - Replit development domain (auto-configured by Replit)
- `REPL_ID` - Unique Replit project ID (auto-configured by Replit)

**Total Environment Variables: 10 (manually configured) + 3 (auto-configured) = 13 total**

**Optional (Post-MVP)**
- `RESEND_API_KEY` - Email service API key (for email notifications - deferred per user request)

## Deployment Steps

### 1. Pre-Deployment Checklist
- [ ] All environment variables configured in Replit Secrets
- [ ] Database created via Replit PostgreSQL integration
- [ ] Mapbox account created and access token obtained
- [ ] OpenAI API key configured (if using AI Assist)

### 2. Build Verification
Test the production build locally:
```bash
npm run build
```

Expected output:
- Build completes without errors
- Bundle size ~3.5MB
- Assets output to `dist/public/`

### 3. Database Schema Deployment
Push database schema to production:
```bash
npm run db:push
```

This will:
- Create all required tables
- Set up indexes
- Configure constraints

### 4. Deploy to Production
Click the "Publish" button in Replit, then configure:

**Deployment Type:** Autoscale
**Build Command:** `npm run build`
**Run Command:** `npm start`
**Machine Power:** Starter (1 vCPU, 1GB RAM recommended)

### 5. Post-Deployment Verification

#### 5.1 Health Check
Visit your deployed URL and verify:
- [ ] Homepage loads successfully
- [ ] Sign In / Sign Up buttons visible
- [ ] Dark mode toggle works
- [ ] Weather alerts display (may take 1 hour for first sync)

#### 5.2 Authentication Test
1. Click "Sign Up"
2. Create a customer account
3. Verify redirect to dashboard
4. Sign out and sign in again
5. Verify session persists

#### 5.3 Database Connection Test
Check that session store is working:
```sql
-- In Replit Database console:
SELECT COUNT(*) FROM sessions;
```
Should show at least 1 session after signing in.

#### 5.4 Weather Sync Test
Wait 5 minutes after deployment, then check:
```sql
SELECT COUNT(*) FROM weather_alerts;
```
Should show weather alerts (may be 0 if no active alerts in US).

#### 5.5 Location Services Test
1. Navigate to "Find Operators" page
2. Grant location permission
3. Verify map loads with your current location
4. Verify operator markers display

### 6. Monitoring

#### Application Logs
Monitor in Replit deployment dashboard:
- Look for "Server running on port 5000"
- Check for "[Weather Sync] Job started"
- Monitor API response times

#### Database Performance
```sql
-- Check active sessions
SELECT COUNT(*) FROM sessions;

-- Check user registration
SELECT COUNT(*) FROM users;

-- Check service requests
SELECT COUNT(*) FROM service_requests;
```

#### Error Tracking
Watch for these in logs:
- Database connection errors
- Session store errors
- API authentication failures
- Location geocoding failures

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development npm run dev
```
- Uses development database
- Hot module reloading
- Verbose logging
- CORS enabled for localhost

### Production
```bash
NODE_ENV=production npm start
```
- Uses production database
- Optimized builds
- Error logging only
- CORS restricted to deployed domain

## Security Configuration

### Session Management
- Sessions stored in PostgreSQL (not in-memory)
- 30-day session expiration
- HttpOnly cookies (no JavaScript access)
- Secure flag enabled in production

### CORS Policy
Production CORS allows:
- `*.replit.dev`
- `*.replit.app`
- Custom domains (if configured)

### Rate Limiting
Consider adding (post-MVP):
- API rate limiting per IP
- Login attempt throttling
- Quote submission rate limits

## Troubleshooting

### Issue: "No session" errors
**Solution:** Verify `SESSION_SECRET` is set and PostgreSQL connection is active.

### Issue: Map not loading
**Solution:** Verify `VITE_MAPBOX_ACCESS_TOKEN` is set correctly and visible to client.

### Issue: Weather alerts not syncing
**Solution:** Check server logs for "[Weather Sync]" messages. Sync runs hourly.

### Issue: Build fails
**Solution:** 
1. Clear node_modules: `rm -rf node_modules && npm install`
2. Clear build cache: `rm -rf dist`
3. Retry build: `npm run build`

### Issue: Database migration errors
**Solution:** Use `npm run db:push --force` to sync schema (be careful in production).

## Rollback Procedure

If deployment fails:
1. Click "Rollback" in Replit deployment dashboard
2. Select previous working deployment
3. Confirm rollback
4. Verify application loads
5. Check database integrity

## Performance Optimization (Post-Launch)

### Code Splitting
Reduce bundle size by implementing route-based code splitting:
```typescript
// Example: Lazy load operator dashboard
const OperatorDashboard = lazy(() => import('./pages/operator/OperatorDashboard'));
```

### Database Indexing
Add indexes for frequently queried fields:
```sql
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_operators_active_tier ON operators(active_tier);
```

### Caching
Implement Redis/Memcached for:
- Session storage (alternative to PostgreSQL)
- Operator location caching
- Weather alert caching

## Support & Maintenance

### Regular Maintenance Tasks
- **Weekly:** Review error logs
- **Monthly:** Check database performance
- **Quarterly:** Update dependencies (`npm outdated`)

### Backup Strategy
Replit PostgreSQL automatically backs up databases. Additional backups recommended:
```bash
# Export database dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### Scaling Considerations
When to scale:
- Response time > 1 second consistently
- Database connection pool exhausted
- Memory usage > 80%

Scaling options:
- Increase machine power (2 vCPU, 2GB RAM)
- Enable autoscaling (automatic)
- Add read replicas for database

---
**Last Updated:** November 24, 2025
**Version:** 1.0.0
