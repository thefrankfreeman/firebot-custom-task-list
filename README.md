# Firebot Custom Script in Typescript for enabling a Task list to Firebot

### Setup

1. `npm install`

### Building

Dev:

1. `npm run build:dev`

- Automatically copies the compiled .js to Firebot's scripts folder.

Release:

1. `npm run build`

- Copy .js from `/dist`

### Note

- Keep the script definition object (that contains the `run`, `getScriptManifest`, and `getDefaultParameters` funcs) in the `index.ts` file as it's important those function names don't get minimized.
- Edit the `"scriptOutputName"` property in `package.json` to change the filename of the outputted script.

## Firebot setup

1. Enable custom scripts
2. Put the script file into your Firebot script folder
3. Import `TaskSetup.firebotsetup` into Firebot to set up the commands that use this.

## OBS Setup

1. Add `index.html` from extras, to your OBS Browser source.
2. Make sure `tasklist.txt` is in the same folder as `index.html`.
