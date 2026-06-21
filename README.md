# Kitchen

I didn't want to have to keep touching a device in the kitchen so here's an app to read out the ingredients and steps as many times as I need them.

- Fonts are adjustable on settings for various screen sizes
- Set a timer with verbal commands or via the UI
- Voice works on recipe and timer pages; short commands only
- Drop markdown files into the recipes folder at any point to get them to work
- Add notes (dated) to recipes for future reference

PWA Built with SvelteKit + on-device speech (no cloud, no API keys).

## Voice commands

Mic button defaults to off.

**Recipe page**

| Command | Action |
| --- | --- |
| "read list" / "ingredients" | Read all ingredient names |
| "measurements" | Read each ingredient with its amount |
| "step five" (any number) | Read that step |
| "next" | Read the next step (advances each time) |
| "how much {ingredient}" | Read that ingredient's amount, e.g. "how much flour" |
| "repeat" | Repeat the last thing spoken |
| "stop" | Stop the current speech |
| "add note" | Start dictating a note |
| "save note" | Save the dictated note |
| "cancel note" / "discard note" | Discard the dictation |

**Timer (works on the recipe and timer pages)**

| Command | Action |
| --- | --- |
| "set timer ten minutes" / "set timer thirty seconds" | Start a countdown |
| "start timer" / "resume timer" | Start or resume |
| "pause timer" | Pause |
| "cancel timer" / "stop timer" | Cancel |
| "use timer" | Open the Timer page |

## Getting started

```sh
pnpm install
pnpm dev          # start the dev server
pnpm dev --open   # ...and open it in a browser
```

## Voice recognition model

Offline speech recognition (`vosk-browser`) loads a model from
`static/models/vosk-model-small-en-us-0.15.tar.gz`, served as a static asset. The
archive (~40 MB) is gitignored; fetch it once per env.

`vosk-browser` expects a gzipped tar of the model folder, but Alphacephei ships a `.zip`, so it
must be repackaged once:

```sh
mkdir -p static/models && cd static/models
curl -LO https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
tar czf vosk-model-small-en-us-0.15.tar.gz vosk-model-small-en-us-0.15
rm -rf vosk-model-small-en-us-0.15 vosk-model-small-en-us-0.15.zip
```

The same file must be on deploy (served to the device and cached by the
service worker for offline use) — run these steps as part of the build, or commit
it via Git LFS.

## Building

```sh
pnpm build        # production build
pnpm preview      # preview the production build
```

## Other commands

```sh
pnpm check        # type-check the project
```