# HireLoop server

## Install
`npm install` — `node_modules` and `.env` are gitignored, so a fresh checkout has neither.

## Run
`node index.js` — Express app on `http://localhost:5000` (or `$PORT`), single route `GET /` returning "Hello World!".
`nodemon index.js` also works (`nodemon` is installed).
On startup it loads `.env` via `dotenv.config()`, then pings MongoDB and logs either `MongoDB is working` or `MongoDB is not working: <error>`. The server starts even if MongoDB is down.

## Middleware
- `cors()` with `origin: "*"`, common methods, and `Content-Type` / `Authorization` headers
- `express.json()` for JSON body parsing

## ESM (verified)
`package.json` has `"type": "module"`, so `index.js` uses ESM `import`/`export` (not `require()`).
`node index.js` works as-is. Do not rewrite it with `require()`.

## Test
`npm test` → exits 1 ("no test specified"). No test suite exists; there is no lint,
typecheck, build step, or CI configuration.

## Env
`.env` is gitignored. `index.js` calls `dotenv.config()` and reads:
- `PORT` (default 5000)
- `MONGODB_URI` (default `mongodb://localhost:27017`)

## Dependencies
Used in `index.js`: `express`, `cors`, `mongodb`, `dotenv`.
Installed but not imported: `jose` (available if you add JWT verification), `nodemon`.
