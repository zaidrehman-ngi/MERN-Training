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

## Auth flow demo (Postman)

The folder **Exercise 8 Task 6 - Full Auth Flow** runs register, login,
protected route, forbidden route, token expiry, refresh and logout, with
assertions on each. Start the API with a 10 second access token so the
expiry step only waits about 10 seconds:

```powershell
$env:JWT_EXPIRES_IN="10s"; npm run dev
```

```bash
JWT_EXPIRES_IN=10s npm run dev
```

Then run the folder in Postman (or `npx newman run postman/library-api.postman_collection.json -e postman/library-api.postman_environment.json --folder "Exercise 8 Task 6 - Full Auth Flow"`).
