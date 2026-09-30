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

Hosted on GitHub Pages at https://vanshikashyam.com (the `CNAME` file holds
the domain; `.nojekyll` makes Pages serve the files as-is). Pushing to `main`
redeploys.

DNS at the registrar:

    A     @     185.199.108.153
    A     @     185.199.109.153
    A     @     185.199.110.153
    A     @     185.199.111.153
    CNAME www   vanshikashyam9.github.io

## Still to fill in

- `assets/resume.pdf` — the download button says "coming soon" until it exists
- RentScout live demo link (commented out in the Work section)
