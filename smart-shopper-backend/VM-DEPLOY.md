# VM Deployment Instructions

## Quick Start on VM

1. **Upload the `.env` file to your VM** and update it with your actual API keys:
   ```bash
   # Edit the .env file
   nano .env
   ```
   
   **Important:** Update at minimum:
   - `OPENAI_API_KEY` - Your OpenAI API key (required for chat features)
   - Leave Pinecone variables empty if not using Pinecone

2. **Stop any running containers and clean up**:
   ```bash
   docker compose down -v
   ```

3. **Start the services**:
   ```bash
   docker compose up --build
   ```

   Or run in background:
   ```bash
   docker compose up --build -d
   ```

4. **Check the logs**:
   ```bash
   docker compose logs -f backend
   ```

## What Changed?

### Fixed Issues:
1. ✅ Removed `version` field from `docker-compose.yml` (obsolete in Docker Compose V2)
2. ✅ Fixed environment variable warnings by setting default empty values
3. ✅ Fixed PostgreSQL initialization error - `init-db.sql` now only creates extensions
4. ✅ Added `docker-entrypoint.sh` to run Prisma migrations after database is ready
5. ✅ Added PostgreSQL client to Dockerfile for database readiness checks

### Database Setup:
- PostgreSQL extensions are created on first startup
- Database schema is created automatically by Prisma migrations
- No manual database setup required

## Service URLs

After successful startup:
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **pgAdmin**: http://localhost:5050
  - Email: `admin@emraay.com`
  - Password: `admin123`
- **ChromaDB**: http://localhost:8000

## Database Connection (for pgAdmin)

- **Host**: `emraay-postgres`
- **Port**: `5432`
- **Database**: `staples_smart_shopper`
- **Username**: `postgres`
- **Password**: `postgres123`

## Useful Commands

```bash
# View all logs
docker compose logs -f

# View specific service logs
docker compose logs -f backend
docker compose logs -f postgres

# Restart a service
docker compose restart backend

# Stop all services
docker compose down

# Stop and remove volumes (complete reset)
docker compose down -v

# Rebuild and restart
docker compose up --build -d

# Execute commands in container
docker compose exec backend npm run db:migrate
docker compose exec backend npm run ingest:products
```

## Troubleshooting

### If PostgreSQL fails to start:
```bash
docker compose down -v
docker compose up postgres -d
# Wait for postgres to be healthy, then:
docker compose up -d
```

### If backend fails to connect to database:
```bash
# Check if postgres is healthy
docker compose ps

# Check postgres logs
docker compose logs postgres

# Restart backend
docker compose restart backend
```

### To run Prisma migrations manually:
```bash
docker compose exec backend npx prisma migrate deploy
```

### To reset the database:
```bash
docker compose down -v
docker compose up -d
```

## Next Steps

1. **Ingest Product Data**:
   ```bash
   docker compose exec backend npm run ingest:products
   ```

2. **Generate Embeddings** (requires OpenAI API key):
   ```bash
   docker compose exec backend npm run generate:embeddings
   ```

3. **Test the API**:
   ```bash
   curl http://localhost:3000/api/health
   ```
