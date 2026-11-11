# Library Web

A React and Vite frontend for the library catalogue. It reads its data from `library-api`.

## Install dependencies

```bash
cd library-web
npm install
```

Copy `.env.example` to `.env`. `VITE_API_URL` must point at the running API.

## Start the API

The API is in `library-api`. Follow its README to set up the database, then run:

```bash
cd library-api
npm run dev
```

It listens at `http://localhost:3000`.

## Start the app

In a second terminal:

```bash
cd library-web
npm run dev
```

Open `http://localhost:5173`. The API only accepts requests from this origin (`CORS_ORIGIN` in the API's `.env`), so keep the app on port 5173.

## If the catalogue does not load

Make sure the API is running, then click **Retry** or refresh the page.

If the page says **No books found**, the request worked but the search or filter matched nothing. Clear the search or pick another filter.
