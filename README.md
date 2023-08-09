# Firebot Custom Task List Script

This repo contains a custom Firebot script, designed to add to a task list to Firebot, and some supplementary files display the task list in an OBS browser source. The repository is originally based on the [firebot custom script starter template](https://github.com/crowbartools/firebot-custom-script-starter)

## Setup

### I. Firebot

Steps:

1. Enable custom scripts

   ```
   Settings > Scripts > Custom Scripts: Enabled
   ```

2. Copy the `taskListScript.js` file into your Firebot script folder. See your OS's AppData folder (f.e. `~/.config/Firebot/v5/profiles/Main Profile/scripts/`):

   ```
   Win: %appdata%
   MacOS: /Library/Application Support
   Linux: ~/.config
   ```

3. Set up a `!task` command inside Firebot. Choose a or b:

   - a. _batteries included_: Import `TaskSetup.firebotsetup` into Firebot
   - b. Do it manually. (See `Docs.md` for more info on the sub commands)

### II. OBS Studio

OBS Studio requires the files `index.html`, `style.css`, and `tasklist.txt`. All 3 files need to be in the same folder.

Steps:

1. Add `index.html` from the extras folder as a OBS Browser source.
2. Optional: Edit styles.css

## Usage

Quickstart:

```
user: !task add My new task
user: !task done
user: !task remove
```

See [Docs.md] for more.

## Development

### Setup

1. `npm install`

### Building

Dev:

1. `npm run build:dev`

- Automatically copies the compiled .js to Firebot's scripts folder.

Release:

1. `npm run build`

- Copy .js from `/dist`
