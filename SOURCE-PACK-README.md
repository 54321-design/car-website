# Source pack — luxury-watch-website

Complete source for this build, exactly as it was developed.

## Requirements

- **Node.js 20+** — download the LTS build from https://nodejs.org/
  (Windows/Mac: the installer handles everything. Mac + Homebrew:
  `brew install node`)

Check it worked: `node --version` should print a version number.

Built with **Vite 7**.

## Run it

Open a terminal **inside this folder**, then:

```bash
npm install
npm run dev
```

Then open **http://localhost:5173** in your browser.

The install step is one-time and takes ~30-60 seconds.

Leave the terminal open while you use the site. Press Ctrl+C to stop it.

To build for production: `npm run build`

Full step-by-step instructions, including how to open a terminal and what to do
if something goes wrong:
https://brand-motion-studios.vercel.app/store/luxury-watch-website

## About the media assets

The generated video files (.mp4 / .webm) are **not** bundled in this zip.
They are Google Flow / Veo renders and run 50-200MB per project, which would
make this download impractical.

You already have everything needed to recreate them: the prompt pack you
bought alongside this source contains the exact, verbatim asset-generation
prompts used to produce every clip (look for the
"=== Asset Generation Prompt ===" section).

Any `<video src="...">` paths in the code tell you which filenames to drop
back in. Generate them, drop them into the same paths, and the build is
pixel-identical to the reference.

If you'd rather have the original renders, email
studiosbrandmotion@gmail.com with your order receipt and we'll send a
transfer link.

## Licence

Commercial use permitted for your own and client projects. Reselling or
redistributing the source or prompt itself is not permitted.

— Brand Motion Studios · brandmotion.in
