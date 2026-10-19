# library-api

## After pulling a branch

Copy `.env.example` to `.env` and set `DATABASE_URL`, then run:

```bash
npm install && npx prisma generate
npx prisma migrate deploy
```

To load the test data (also resets it after a Postman run):

```bash
npm run db:seed
```
