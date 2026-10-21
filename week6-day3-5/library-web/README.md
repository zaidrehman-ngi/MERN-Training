# Library Web

A React and Vite frontend for the library catalogue. The app reads book data from the JSON Server API backed by `../db.json`.

## Prerequisites

- Install Node.js (the current LTS release is recommended). npm is included with Node.js.
- Clone this repository. The `db.json` API database is in the repository root, alongside the `library-web` folder.

## Install dependencies

Open a terminal in the repository and run:

```bash
cd library-web
npm install
```

The project lockfile resolves JSON Server to version 0.17.4.

## Start the API server

In a terminal whose current directory is `library-web`, run:

```bash
npx json-server@0.17.4 --watch ../db.json --port 4000 --delay 300
```

The API listens at `http://localhost:4000`. Keep this terminal open while using the app. The API server must be running for the catalogue to load.

## Start the app

Open a second terminal, also in `library-web`, and run:

```bash
npm run dev
```

Open the local URL printed by Vite. Its default frontend port is `5173` (`http://localhost:5173`). If that port is occupied, Vite may print a URL using another port. Keep this terminal open too.

## If the catalogue does not load

If you forgot to start the API server, start it using the command above. When the page shows a connection error, click **Retry**; if needed, refresh the page. The catalogue cannot load until the API server is running.

If the page says **No books found**, the request succeeded but the current search or filter returned no matches. Clear the search or choose a different filter. The API server must still be running for catalogue data to be available.
