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


| Variable | Purpose        | Default |
| ---------------------- | ----------------------------- | ------------------------- |
| `PORT`               | Server port     | `3000`                  |
| `HOST`               | Bind address | `0.0.0.0`               |

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
