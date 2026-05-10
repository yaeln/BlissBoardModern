# Bliss Board Modern

A modern, fast, and fully responsive web application for interacting with Blissymbolics. This project features a completely custom Canvas-based rendering engine that dynamically draws Blissymbols from their geometric primitives, meaning symbols scale infinitely without loss of quality.

## Features

* **Dynamic Canvas Rendering Engine:** Draws over 1,600 Blissymbols dynamically from primitive components (lines, curves, dots) defined in `data.json`. No static images or SVGs are used for the symbols, allowing for infinite scaling.
* **Grammar-Aware Color Coding:** Automatically parses the structural components of each symbol to determine its Part of Speech (POS) and dynamically color-codes the UI cards:
  * 🟩 **Green:** Verbs (contains Action Indicator)
  * 🟦 **Blue:** Adjectives/Adverbs (contains Quality Indicator)
  * 🟧 **Orange:** Nouns/People (contains Thing Indicator or Person)
* **Bilingual Support & RTL:** Full support for both English and Hebrew (`UTF-8`). Toggling to Hebrew automatically triggers a native Right-to-Left (RTL) layout shift across the entire interface (search box, grid, and sentence builder).
* **Keyboard Accessible & Spatial Navigation:** Fully navigable via keyboard. Use `Tab` to autocomplete searches, and use the **Arrow Keys** (Up/Down/Left/Right) to spatially jump between symbol cards in the grid.
* **Component Explorer ("Details View"):** Every symbol card has an Explore button (🔍). Clicking it (or searching for an exact match) triggers a Details View that visually breaks down what primitive components the symbol is "Composed Of", as well as a grid of all complex symbols it is "Used In".
* **Smarter Search Engine:** Type-ahead search filtering that ignores grammar prefixes (e.g., searching "eat" seamlessly finds "to eat"). Sort the board either alphabetically or by component frequency.

## Tech Stack

* **HTML5 / CSS3 / Vanilla JavaScript**
* **Vite** (Development Server)
* **Zero Backend Requirements:** The entire database is powered by a static `data.json` file, meaning it can be hosted anywhere for free.

## How to Run Locally

You only need [Node.js](https://nodejs.org/) installed on your computer.

1. Clone this repository:
   ```bash
   git clone https://github.com/yaeln/blissboard.git
   cd blissboard
   ```
2. Install the development dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open the provided `localhost` link in your browser.

## Deployment

Because this app does not rely on a backend server, it is fully optimized to be deployed via **GitHub Pages**. Simply push the code to your `main` branch, go to your repository Settings -> Pages, and enable deployment from the `main` branch.
