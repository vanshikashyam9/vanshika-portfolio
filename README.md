# vanshika-portfolio

Personal portfolio. Plain HTML, CSS and JavaScript — no build step, no dependencies.

    index.html    content: hero, about, experience, work, tech stack, education, contact
    styles.css    all styling
    script.js     cursor-tracking hero, typing name, sticky nav, scroll reveal
    assets/       portrait, pose sheet, favicon, social preview, résumé PDF

## The cursor-tracking hero

`assets/pose-sheet.webp` is a 7×5 grid of the portrait's head turned towards
every direction (columns look left → right, rows look up → down), generated
with LivePortrait's expression editor. `script.js` overlays one cell of it on
the head of `assets/portrait.jpg` and picks the cell nearest the cursor. If the
portrait ever changes, the sheet and the `PATCH` numbers in `script.js` have to
be regenerated with it.

## Run it

    python3 -m http.server 4321

Then open http://localhost:4321

## Deploy

Any static host works. Vercel:

    npx vercel --prod

Netlify, GitHub Pages and Cloudflare Pages all serve this directory as-is.
After deploying, change `og:image` in `index.html` to the full URL
(e.g. `https://yoursite.com/assets/social-preview.jpg`) — link previews
need an absolute address.

## Still to fill in

- `assets/resume.pdf` — the download button says "coming soon" until it exists
- RentScout live demo link (commented out in the Work section)
