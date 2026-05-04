Railway deployment notes

Recommended (SQLite + Railway Volume)

1. Create a Railway Volume and mount it at `/data`.
2. In Railway Environment Variables, add:

   - `DATABASE_URL` = `file:/data/app.db`

3. Deploy the project. The app will bootstrap the database on first run and seed roles/permissions.

Notes:
- The app uses SQLite by default for simplicity. To keep data across deploys, you must use a Railway Volume mounted at `/data`.
- If you prefer managed Postgres for production, create a PostgreSQL plugin in Railway and set `DATABASE_URL` to the provided connection string. You'll need to run `prisma migrate deploy` during your deploy to apply migrations.

Quick checks

- If you see `Only file-based SQLite URLs are supported in this app.`, verify that `DATABASE_URL` begins with `file:` and points to the mounted volume.
- If you see `The table 'main.User' does not exist`, check deployment logs for `Migration failed:` or `Seed failed:` messages.

Switching to Postgres (optional)

1. Add a PostgreSQL service in Railway and copy the connection string.
2. Set `DATABASE_URL` to the Railway Postgres URL.
3. Ensure migrations run during deploy:

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
```

If you want, I can add a deploy script or CI steps to run migrations automatically.
