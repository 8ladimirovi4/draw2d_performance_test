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


| `measure` name        | Meaning                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unmarshal_to_canvas` | From`unmarshal_start` to `unmarshal_end`: in-memory schema handling and building canvas figures (**excludes** `JSON.parse` and network).                                                        |
| `display_after_http`  | From when the HTTP response body is available (`http_fetch_end`) to the `schema_visible` mark after two `requestAnimationFrame` ticks (includes JSON parse, unmarshal, canvas/viewport sizing). |

When draw2d commits a figure **move** (`CommandStack` **POST_EXECUTE**, `CommandMove` / collection), the console logs **`[perf] canvas path ≈ X px`** — Euclidean Δ in **canvas coordinates** from that command (`client/js/perf-drag-gesture.js`). Not a User Timing `measure`; **FPS** remains Appendix A.

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

In Chrome or Edge: **DevTools → Performance** → record → after stopping the recording, **Timings** / **User Timing** lists the same names (`display_after_http`, `unmarshal_to_canvas`, etc.). That view is for **User Timing** (load and render intervals), **not** for judging **FPS** while dragging.

For **FPS** per **AC_04** in `requirements/ICT_NEXT.P.IO.PERF Тестирование производительности библиотеки-v1-31.03.2026, 17_46_14.pdf` (**Case 5** — small project, **≥ 60 FPS**; **Case 6** — large project, **≥ 30 FPS**; method **DevTools**; scenario: **select all** → **drag 100 px** → assess frame rate), follow **Appendix A** (the **Frames** track and the ms→FPS table).

---

## Appendix A. Measuring frame timing and smoothness (FPS) with Chrome DevTools — Performance

**Goal:** record **frame durations (ms)** while you run a scenario (e.g. dragging figures on the draw2d canvas) and relate them to **equivalent FPS** (see the table at the end of this section).

Open the project → **select all** elements → **move 100 px** → verify **FPS** in **DevTools**. Use the steps below; compare typical frame duration on the **Frames** track during the drag to **~16.67 ms (~60 FPS)** and **~33.33 ms (~30 FPS)** On fixtures **`poc1-req02-small`** and **`poc1-req01-big`**, a **100 px** drag scale is drawn on the canvas by `client/js/perf-drag-distance-guide.js`.

### A.1. Difference from “FPS in the corner”

- **More tools → Rendering → Frame Rendering Stats** (Ctrl+Shift+P / Command Menu → type *Rendering* → choose *Show Rendering*) shows **live** FPS over the page — useful **during** interaction, but it does **not** preserve a full timeline for a report.
- The **Performance** tab records a **timeline**: on the **Frames** track each frame shows **duration in ms**. Use those values after the run to judge smoothness and jank.

**Recommendation:** optionally enable the Frame Rendering Stats overlay before recording; for a report you should **always** capture a **Performance** recording.

### A.2. Setup

1. Use **Google Chrome** (note the exact version in the test report).
2. Open the test page with the fixture you need, for example:
   `http://127.0.0.1:3000/?fixture=poc1-req02-small`
   (or another URL/fixture for your scenario).
3. Wait until the diagram is fully loaded (UI message / ready status).
4. For reproducibility: close extra tabs, disable heavy extensions where possible; note window resolution and OS scaling.

### A.3. Recording a profile

1. Open **DevTools** (`F12` or `Ctrl+Shift+I`).
2. Go to the **Performance** tab.
3. Click **Record** (circle) **or** press **`Ctrl+E`** (if you use a non‑English keyboard layout, check the tooltip on the button).
4. **Without closing DevTools**, run the scenario on the page:
   - Optional: navigate, zoom, **drag a single figure** (diagnostics only).
   - Select all** figures, then **drag the selection 100 px** (align with the on-canvas guide where the harness shows it).
5. Click **Stop** (square) and wait for the recording to finish processing.

If needed, enable **Screenshots** in the recording settings (gear icon) so the timeline includes screen thumbnails.

### A.4. What to look at in the result

1. **Frames** track (lower / middle area of the timeline, under the main CPU strip):
   - each frame shows **duration in milliseconds**;
   - **red** frames (long frame) **exceed** the smoothness budget at 60 Hz (~16.7 ms) and hurt responsiveness the most.
2. **Left summary** (e.g. **INP**, **CLS**): a high **INP** during interaction often aligns with rare but very long frames on the Frames track.
3. **Main** track: long **Task** blocks (yellow — script; purple — style / layout / paint) during drag are the usual suspects behind long frames.

**Example fields for a test report:**

- recording window (seconds);
- several **typical** frame durations from the Frames track during drag (e.g. “mostly 16.6–16.7 ms”);
- **max** and/or **p95** frame duration in the drag phase (by hand or from a screenshot);
- **red** frames: yes/no, approximate count;
- if needed — **INP** from the panel.

### A.5. Relating frame duration (ms) to FPS

For a **single** frame, equivalent frame rate is:

\[
\text{FPS} \approx \frac{1000}{\text{frame duration (ms)}}
\]

If every frame is **16.67 ms**, that is **~60 FPS**. A mix of short (16.7 ms) and occasional long frames (e.g. 80–200 ms) can still yield a **decent average FPS** but **poor perceived smoothness** — so rely on **long frames** and **INP**, not averages alone.

### A.6. Reference: frame duration (ms) → equivalent FPS


| Frame duration (ms) | Equivalent FPS (≈ 1000 / ms) |
| --------------------: | ------------------------------: |
|                8.33 |                           120 |
|               10.00 |                           100 |
|               11.11 |                            90 |
|               12.50 |                            80 |
|               16.67 |                            60 |
|               20.00 |                            50 |
|               25.00 |                            40 |
|               33.33 |                            30 |
|               50.00 |                            20 |
|              100.00 |                            10 |
|              200.00 |                             5 |

**Note:** values are **rounded** to whole FPS where applicable; for a 60 Hz display one frame budget is **1000 / 60 ≈ 16.67 ms**.

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
