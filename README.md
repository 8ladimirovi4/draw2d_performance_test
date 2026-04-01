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

   By default the server listens on **http://127.0.0.1:3000** .
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

The **`buttons`** fixture (`client/fixtures/buttons.json`) was produced from mxGraph XML `test_schemes/mxGraph(xml)/buttons.xml` using the converter in `tools/mxgraph-to-draw2d/` (geometry in absolute coordinates, colors from `style` / `mxBindings`, labels for swimlanes, buttons, and table rows). Pixel-perfect parity with mxGraph (HTML table markup, gradients, etc.) is not attempted — standard draw2d shapes are used.

Example:

- http://127.0.0.1:3000/?fixture=buttons

### Converting mxGraph → draw2d JSON

```bash
cd tools/mxgraph-to-draw2d
npm install
node convert.mjs path/to/schema.xml path/to/output.json
node convert.mjs path/to/schema.xml path/to/output_dir
```

The second argument may be a **directory** (existing or new, without a `.json` suffix): the result is written to `<directory>/<input_xml_basename>.json`, and parent folders are created automatically.

With no arguments, the script reads `../../test_schemes/mxGraph(xml)/buttons.xml` and writes `../../client/fixtures/buttons.json`.

## Console performance measurement (Performance / User Timing)

After the diagram loads, the app logs to the **browser console** (DevTools → Console) lines prefixed with **`[perf]`**. Those values come from the [User Timing API](https://w3c.github.io/user-timing/) (`performance.mark` / `performance.measure`).

### Automatic console output

| `measure` name | Meaning |
| --- | --- |
| `unmarshal_to_canvas` | From `unmarshal_start` to `unmarshal_end`: in-memory schema handling and building canvas figures (**excludes** `JSON.parse` and network). |
| `display_after_http` | From when the HTTP response body is available (`http_fetch_end`) to the `schema_visible` mark after two `requestAnimationFrame` ticks (includes JSON parse, unmarshal, canvas/viewport sizing). |

On fixtures that include the toggle switch (e.g. `sample`), clicking the switch also logs **`user_toggle_switch_click_to_state`**: from click until state and repaint are ready.

### Filtering the console

In the console filter box, type **`[perf]`** to show only these messages.

### Reading metrics manually in the console

After the page loads, you can run:

```js
// all user measures recorded in this browsing session
performance.getEntriesByType('measure');

// last value for a specific measure (one entry per load or interaction)
const m = performance.getEntriesByName('display_after_http');
m[m.length - 1]?.duration; // milliseconds

// marks (interval boundaries)
performance.getEntriesByType('mark');
```

To reset stored entries before another measurement on the same tab:

```js
performance.clearMeasures();
performance.clearMarks();
```

Then reload the page or repeat the action (e.g. toggle click).

### Performance panel

In Chrome or Edge: **DevTools → Performance** → record → after stopping the recording, **Timings** / **User Timing** lists the same names (`display_after_http`, `unmarshal_to_canvas`, etc.).

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
