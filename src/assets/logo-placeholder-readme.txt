Place your real logo file here as: logo.png

Recommended specs:
- Transparent background PNG (or SVG renamed if you prefer to swap the <img> for inline SVG)
- Roughly 160px x 48px (or similar wide aspect ratio) for the navbar
- The Navbar component imports it as: import logo from "../../assets/logo.png"
- Until you add the real file, Navbar.jsx falls back to a text wordmark automatically (see the `logoError` state), so the app will not crash if logo.png is missing.
