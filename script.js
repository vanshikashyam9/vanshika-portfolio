// ═══════════════════════════════════════════════════════════════
// 1. Hero: the head and eyes turn towards the cursor
// 2. Typing effect on the name
// 3. Sticky nav that highlights the section in view
// 4. Scroll fade in both directions, copy email, résumé availability
// ═══════════════════════════════════════════════════════════════

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

// ─── 1. Face tracker ───────────────────────────────────────────
// assets/pose-sheet.webp is a 7×5 grid of pre-rendered poses: columns look
// left → right, rows look up → down. Each cell covers the same patch of the
// portrait around the head, so only the head appears to move.
const POSES = { cols: 7, rows: 5 }
// Patch position and face centre, as % of the portrait image
const PATCH = { x: 25.41, y: 1.47, w: 50.83, h: 67.77 }
const FACE = { x: 47, y: 32 }
const FOCUS = { x: 50, y: 35 } // which part of the portrait stays in view when cropped
const REACH = 0.45 // fraction of the screen the cursor travels for a full head turn

const hero = document.querySelector(".hero")
const portrait = document.querySelector(".hero-portrait")
const patch = document.querySelector(".hero-patch")
const sheet = document.querySelector(".hero-sheet")
const geo = { offX: 0, offY: 0, dispW: 0, dispH: 0 }

// Cover-fit the portrait in pixels so the patch lines up with it exactly
function layoutHero() {
  const nw = portrait.naturalWidth
  const nh = portrait.naturalHeight
  if (!nw) return
  const bw = hero.clientWidth
  const bh = hero.clientHeight
  const scale = Math.max(bw / nw, bh / nh)
  geo.dispW = nw * scale
  geo.dispH = nh * scale
  geo.offX = ((bw - geo.dispW) * FOCUS.x) / 100
  geo.offY = ((bh - geo.dispH) * FOCUS.y) / 100
  Object.assign(portrait.style, {
    left: `${geo.offX}px`,
    top: `${geo.offY}px`,
    width: `${geo.dispW}px`,
    height: `${geo.dispH}px`,
    objectFit: "fill",
  })
  Object.assign(patch.style, {
    left: `${geo.offX + (geo.dispW * PATCH.x) / 100}px`,
    top: `${geo.offY + (geo.dispH * PATCH.y) / 100}px`,
    width: `${(geo.dispW * PATCH.w) / 100}px`,
    height: `${(geo.dispH * PATCH.h) / 100}px`,
  })
}

// Slide the sheet so the wanted cell sits in the patch. A transform is
// composited on the GPU, so switching poses never repaints the image.
function showPose(col, row) {
  sheet.style.transform = `translate3d(${(-col / POSES.cols) * 100}%, ${(-row / POSES.rows) * 100}%, 0)`
}

function startTracking() {
  const midCol = (POSES.cols - 1) / 2
  const midRow = (POSES.rows - 1) / 2
  showPose(midCol, midRow)
  patch.classList.add("ready")
  if (reduceMotion) return

  let target = { x: 0, y: 0 }
  const current = { x: 0, y: 0 }
  let shown = ""
  const touchOnly = window.matchMedia("(hover: none)").matches

  const aim = (clientX, clientY) => {
    const r = hero.getBoundingClientRect()
    // Direction from the face to the cursor, -1..1 on each axis
    const fx = r.left + geo.offX + (geo.dispW * FACE.x) / 100
    const fy = r.top + geo.offY + (geo.dispH * FACE.y) / 100
    // Narrow phone screens get the shorter side, so a finger can reach a full turn
    const side = touchOnly ? Math.min(window.innerWidth, window.innerHeight) : Math.max(window.innerWidth, window.innerHeight)
    const span = side * REACH
    target = {
      x: Math.max(-1, Math.min(1, (clientX - fx) / span)),
      y: Math.max(-1, Math.min(1, (clientY - fy) / span)),
    }
  }

  // Phones have no cursor: follow the finger while touching, and otherwise
  // let her slowly look around on her own
  let lastTouch = -Infinity

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch") aim(e.clientX, e.clientY)
  }, { passive: true })
  const onTouch = (e) => {
    const t = e.touches[0]
    if (!t) return
    lastTouch = performance.now()
    aim(t.clientX, t.clientY)
  }
  window.addEventListener("touchstart", onTouch, { passive: true })
  window.addEventListener("touchmove", onTouch, { passive: true })
  document.addEventListener("pointerout", (e) => {
    if (!e.relatedTarget && e.pointerType !== "touch") target = { x: 0, y: 0 }
  })

  const tick = (now) => {
    // Three seconds after the last touch, go back to looking around
    if (touchOnly && now - lastTouch > 3000) {
      const t = now / 1000
      target = { x: Math.sin(t * 0.55) * 0.85, y: Math.sin(t * 0.8 + 1) * 0.45 }
    }
    // Gentler easing for the idle look-around, snappier when following input
    const ease = touchOnly && now - lastTouch > 3000 ? 0.06 : 0.35
    current.x += (target.x - current.x) * ease
    current.y += (target.y - current.y) * ease
    const col = Math.round(midCol + current.x * midCol)
    const row = Math.round(midRow + current.y * midRow)
    const key = `${col},${row}`
    if (key !== shown) {
      shown = key
      showPose(col, row)
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function whenLoaded(img) {
  if (img.complete && img.naturalWidth) return Promise.resolve()
  return new Promise((resolve) => img.addEventListener("load", resolve, { once: true }))
}

whenLoaded(portrait).then(() => {
  layoutHero()
  window.addEventListener("resize", layoutHero)
  // Decode the 4k pose sheet up front so the first head turn doesn't stall.
  // Decode a detached copy (the one in the page sits in a hidden patch, and
  // mobile Chrome never decodes hidden images), and never wait more than 1.5s.
  const decodeSheet = () => {
    const copy = new Image()
    copy.src = sheet.currentSrc || sheet.src
    return copy.decode ? copy.decode() : Promise.resolve()
  }
  const timeout = new Promise((resolve) => setTimeout(resolve, 1500))
  whenLoaded(sheet)
    .then(() => Promise.race([decodeSheet(), timeout]))
    .catch(() => {})
    .then(startTracking)
})

// ─── 2. Typing effect on the name ─────────────────────────────
const typed = document.querySelector(".typed")
if (typed && !reduceMotion) {
  const out = typed.querySelector(".typed-text")
  const text = typed.dataset.text
  out.textContent = ""
  typed.classList.add("typing")
  let i = 0
  const typeNext = () => {
    out.textContent = text.slice(0, ++i)
    if (i < text.length) {
      // Slightly uneven rhythm reads as a person typing
      setTimeout(typeNext, 110 + Math.random() * 90)
    } else {
      typed.classList.remove("typing")
    }
  }
  setTimeout(typeNext, 500)
}

// ─── 3. Sticky nav ─────────────────────────────────────────────
const nav = document.querySelector(".nav")
const navLinks = [...nav.querySelectorAll("a")]

const setActive = (href) => navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === href))

const onScroll = () => {
  nav.classList.toggle("solid", window.scrollY > hero.offsetHeight * 0.6)
  // The last section can't scroll up to mid-screen, so light it at the bottom
  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  if (atBottom) setActive(navLinks[navLinks.length - 1].getAttribute("href"))
}
onScroll()
window.addEventListener("scroll", onScroll, { passive: true })

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(`#${entry.target.id}`)
    })
  },
  { rootMargin: "-45% 0px -50% 0px" }
)
navLinks.forEach((a) => {
  const section = document.querySelector(a.getAttribute("href"))
  if (section) sectionObserver.observe(section)
})
// Clear the highlight back on the hero
new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) navLinks.forEach((a) => a.classList.remove("active"))
}, { threshold: 0.5 }).observe(hero)

// ─── 4. Scroll fade, both ways ─────────────────────────────────
// Blocks fade and slide in as they enter the screen and fade back out as
// they leave, scrolling down or up. They slide in from the side they enter.
if (!reduceMotion) {
  const blocks = document.querySelectorAll(".reveal, .section > .label, .section > .heading, .stack-legend")
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target
        if (entry.isIntersecting) {
          el.classList.remove("hidden", "above")
        } else {
          el.classList.add("hidden")
          // Left through the top edge: hide it above, so it comes back down
          el.classList.toggle("above", entry.boundingClientRect.top < 0)
        }
      })
    },
    // Only the middle band of the screen counts as "in view", so blocks
    // fade out just before they reach the edges rather than off-screen
    { rootMargin: "-8% 0px -8% 0px" }
  )
  blocks.forEach((el) => {
    el.classList.add("reveal", "hidden")
    fadeObserver.observe(el)
  })

  // Hero intro drifts up and fades as you start scrolling
  const intro = document.querySelector(".hero-intro")
  let ticking = false
  const onFrame = () => {
    const progress = Math.min(1, window.scrollY / (hero.offsetHeight * 0.55))
    intro.style.opacity = String(1 - progress)
    intro.style.transform = `translateY(${-40 * progress}px)`
    // A fast flick can skip a block straight past the screen without the
    // observer seeing it leave, so keep hidden blocks on the right side
    blocks.forEach((el) => {
      if (el.classList.contains("hidden")) el.classList.toggle("above", el.getBoundingClientRect().top < 0)
    })
    ticking = false
  }
  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true
      requestAnimationFrame(onFrame)
    }
  }, { passive: true })
  onFrame()
}

// ─── Copy email ────────────────────────────────────────────────
const copyBtn = document.getElementById("copy-email")
copyBtn.addEventListener("click", async () => {
  const email = copyBtn.dataset.email
  try {
    await navigator.clipboard.writeText(email)
    copyBtn.textContent = "Copied ✓"
    setTimeout(() => (copyBtn.textContent = "Copy email"), 2000)
  } catch {
    window.location.href = `mailto:${email}`
  }
})

// ─── Résumé: switch the button off until assets/resume.pdf exists ──
const resumeLink = document.getElementById("resume-link")
fetch(resumeLink.getAttribute("href"), { method: "HEAD" })
  .then((res) => {
    if (res.ok) return
    resumeLink.textContent = "Résumé coming soon"
    resumeLink.setAttribute("aria-disabled", "true")
    resumeLink.removeAttribute("href")
  })
  .catch(() => {}) // opened straight from disk: leave the link as is
