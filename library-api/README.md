# library-api

## After pulling a branch

Copy `.env.example` to `.env` and set `DATABASE_URL`, then run:

```bash
npm install && npx prisma generate
npx prisma migrate deploy
```
