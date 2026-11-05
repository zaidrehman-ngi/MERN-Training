# library-api

## After pulling a branch

Copy `.env.example` to `.env` and set `DATABASE_URL` and a long random `JWT_SECRET`, then run:

```bash
npm install && npx prisma generate
npx prisma migrate deploy
```

To load the test data (also resets it after a Postman run):

```bash
npm run db:seed
```

## Running the Postman collection

Reset the test data, then start the API with a short access token (the
"Let it expire" step waits for the token to really expire):

```powershell
npm run db:seed
$env:JWT_EXPIRES_IN="20s"; npm run dev
```

Command Prompt (cmd):

```cmd
npm run db:seed
set JWT_EXPIRES_IN=20s
npm run dev
```

```bash
npm run db:seed
JWT_EXPIRES_IN=20s npm run dev
```

Then run the whole collection in Postman, or:

```bash
npx newman run postman/library-api.postman_collection.json -e postman/library-api.postman_environment.json --env-var baseUrl=http://localhost:3000
```

The collection logs in by itself first (its "Setup" folder uses the seeded
test admin), so no token needs to be set beforehand. Run `npm run db:seed`
before each run, because the collection deletes and changes some of the
test rows.

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
