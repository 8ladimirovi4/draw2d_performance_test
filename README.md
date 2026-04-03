# draw2d_performance_test

Test harness for measuring diagram rendering in the browser with the [draw2d](https://github.com/freegroup/draw2d) library (see `test_plan.md`).

## Requirements

- [Node.js](https://nodejs.org/) 18+ (with ES module support)

## Running

1. Install server dependencies:

   ```bash
   cd server
   npm install
   ```
2. Start the HTTP server (Fastify serves static files from the `client/` directory):

   ```bash
   npm start
   ```

   By default the server listens on **http://127.0.0.1:3000**.
3. Open the app root in your browser, for example:

   - http://127.0.0.1:3000/

## Environment variables


| Variable | Purpose      | Default   |
| ---------- | -------------- | ----------- |
| `PORT`   | Server port  | `3000`    |
| `HOST`   | Bind address | `0.0.0.0` |

PowerShell example:

```powershell
$env:PORT=8080; npm start
```

## Choosing a diagram fixture

JSON files live in `client/fixtures/`. The file name (without `.json`) is set via a query parameter:

- http://127.0.0.1:3000/?fixture=sample

If the parameter is omitted, `sample` is loaded.

Example:

- http://127.0.0.1:3000/?fixture=poc1-req01-big

### Filtering the console

In the console filter box, type **`[perf]`** to show only these messages.

---

## Official draw2d repository

Source code and releases: **[freegroup/draw2d](https://github.com/freegroup/draw2d)** · clone: `git clone https://github.com/freegroup/draw2d.git`

## Running from the repository root (Python)

1. Install Node dependencies for the Fastify server (there is no `package.json` in the repo root, so from the root use):

   ```bash
   npm install --prefix server
   ```
   Or `cd server` and run `npm install` there.
2. From the **repository root**, start a static HTTP server:

   ```bash
   python -m http.server 8080
   ```
3. Open the app in the browser (static assets live under `client/`):

   - **http://localhost:8080/client/**

   If you start the server **from the `client` directory**, open **http://localhost:8080/** instead:

   ```bash
   cd client
   python -m http.server 8080
   ```
