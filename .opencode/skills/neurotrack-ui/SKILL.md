---
name: neurotrack-ui
description: Use for ANY NeuroTrack frontend work — UI/UX changes, React Bits components, animations, styling, responsive fixes, auth screens, dashboard, sidebar, cards, sliders, buttons or accessibility. Encodes NeuroTrack's design philosophy and the rules for safely modernizing the existing app.
---

# NeuroTrack UI Skill

Use this skill whenever you modify `client/` in the NeuroTrack repository. Read it fully before writing UI code.

## 1. Design philosophy

NeuroTrack is a **cognitive-wellness self-tracking tool**, not a game and not a productivity-hacker dashboard. The interface must feel calm, warm, trustworthy and precise.

- **Keep the warm cream identity.** Base canvas `#F6F0E7`, surfaces `#EFE4D5` / `#FBF7F1`, primary deep plum/burgundy `#64172F`, text `#2d3035`, muted brown `#805348`.
- **Supporting colours:** deep plum `#64172F` / `#501225`, sage green `#47745E`, muted gold `#B77B55`. Use them sparingly and purposefully.
- **Typography stays intact:** `DM Sans` for UI/body, `DM Serif Display` for display headings. Never swap fonts for a "tech" look.
- **Restraint beats spectacle.** A single purposeful micro-interaction is better than five decorative ones. No neon, no cyberpunk glow, no heavy gradients, no animated backgrounds behind text.
- **Content first.** Animation must never delay, obscure or replace real data, real form actions or real API feedback.

## 2. Mandatory pre-flight

Before implementing any React Bits component:

1. **Inspect the React Bits documentation and registry metadata** for that exact component:
   - Docs: `https://reactbits.dev/components/<kebab-name>`
   - Registry index: `https://raw.githubusercontent.com/DavidHDev/react-bits/main/public/r/registry.json`
   - Item JSON: `https://reactbits.dev/r/<Title>-TS-CSS.json` (or `-TS-TW` only if the project uses Tailwind for that component).
2. Read the component's `props`, `dependencies`, `registryDependencies` and source before installing. Never install Pro or paid components.
3. Prefer the **TypeScript + plain CSS (`TS-CSS`)** variant — NeuroTrack's active stylesheet is hand-written CSS (`client/src/index.css`), even though Tailwind is installed.
4. Check `client/package.json` first. Do not duplicate an existing dependency; adapt the component to existing libraries (e.g. use `lucide-react` icons) when that avoids a new package.
5. Inspect the live DOM/CSS before changing layout. `client/src/style.css` is **dead** (never imported) — do not edit it expecting runtime changes.

## 3. Component selection guidelines

| Need | Preferred React Bits | Rules |
|---|---|---|
| Main navigation (desktop) | Keep existing grouped sidebar + `Magnet` on key items + CSS indicator | Never lose groups, icons, routes or profile section |
| Mobile navigation | `StaggeredMenu` | Must preserve every existing route and close on navigation |
| Dropdowns / selects | `GlideSelect` | Keep the same value/onChange contract as the native `<select>` it replaces |
| Cards (score, latency, streak, assessments, hydration, insights) | `SpotlightCard` and/or `BorderGlow` | Restrained glow only; text contrast must remain readable |
| Range controls (hydration goal, assessment config, volume, preferences) | `ElasticSlider` or `WakeSlider` | Controlled by existing state; min/max/step unchanged |
| Primary CTAs (Start Test, Save, Submit, auth) | `SpecularButton` + optional `Magnet` | Action fires immediately; loading/disabled states preserved |
| Cursor | `GlowCursor` (desktop, fine pointer only), `ClickSpark` selectively | Disabled on touch and with reduced motion; never replace native cursor globally |
| Section entrances | `AnimatedContent` | Short durations, no scroll-jacking, no layout shift |
| Compact text-only lists | `LineSidebar` | Use only where a text list with an animated marker is genuinely useful |

## 4. Implementation instructions

- Install components into `client/src/components/react-bits/` with their CSS beside them. Import CSS from the component itself.
- Wrap React Bits primitives in **thin NeuroTrack adapter components** (e.g. `components/ui/GlideField.tsx`) so the rest of the app never depends on library prop names and so existing `value`/`onChange` contracts are preserved.
- Reuse existing CSS tokens (`var(--burgundy)`, `var(--cream)`, `var(--green)`, `var(--sand)`, `var(--line)`) when theming a component. Never hardcode a new palette.
- Keep all existing class names on elements you enhance so existing CSS and tests continue to apply.
- New files go under `client/src/**`. TS is `strict`; type all props. The `@/*` alias exists in both `tsconfig.json` and `vite.config.ts`, but existing code uses relative imports — stay consistent with the local file.

## 5. Animation & interaction standards

- Animation duration: 150–300 ms for UI states; max 500 ms for entrances.
- Easing: gentle ease-out; no bounce on data surfaces.
- Use CSS transitions/keyframes when sufficient. Reserve GSAP/Motion only for React Bits components that require them.
- Stagger at most 3–5 items, 40–70 ms apart.
- Hover lift: `translateY(-1px to -2px)` with a soft shadow. No scale above 1.03 on cards.
- Every interactive element needs visible `:hover`, `:focus-visible`, `:active`, `:disabled` states.
- No animation may block a click, submission or navigation.

## 6. Responsive design requirements

Existing breakpoints (active `index.css`): 1050, 1000, 960, 950, 900, 850, 650, 560 px.
- Sidebar becomes a slide-out at ≤850 px; mobile trigger lives in `App.tsx` topbar.
- Grids collapse to one column on tablet/mobile; cards must not overflow.
- Dropdown panels must stay inside the viewport (clamp position / use portal-safe placement).
- Touch targets ≥ 44×44 px on mobile.
- Disable cursor glow, magnet and click-spark on coarse pointers; never cause horizontal overflow.
- Test desktop, laptop, tablet and mobile widths after each visual change.

## 7. Accessibility requirements

- Semantic HTML: `nav`, `button`, `label`, `main`, `section`, `ul/li` for lists.
- Keyboard: tab order, Enter/Space activation, arrow keys in custom selects, Escape to close, focus return to trigger.
- Preserve existing visible focus indicators (`outline: 2px solid #a96369` in `index.css`); do not remove them.
- `aria-label` / `aria-current` / `aria-selected` / `role` must reflect real state.
- Respect `prefers-reduced-motion` (a `reduced-motion` class is already applied by `App.tsx` when the OS setting is on).
- Colour contrast: body text ≥ 4.5:1; do not put low-contrast text on glow surfaces.

## 8. Performance rules

- Never animate `width`, `height`, `top`, `left` when `transform`/`opacity` will do.
- Clean up every listener, RAF loop and timer in `useEffect` returns.
- Memoize expensive handlers with `useCallback`; avoid re-rendering whole pages on slider drag.
- Lazy-load heavy visual effects where practical; keep GSAP/Motion usage limited to the components that require them.
- No effect may run per-frame unless visually necessary; throttle pointer effects.

## 9. Preserve existing functionality (non-negotiable)

- **No router exists.** Navigation is `page` state in `App.tsx` + `pageLabels`. Do not introduce a router or change page keys/routes.
- Preserve all API calls in `client/src/services/api.ts` and every endpoint used by components (`/api/sessions`, `/api/habits`, `/api/context`, `/api/hydration`, `/api/deepwork`, `/api/tasks`, `/api/insights`, `/api/learning`, `/api/research`, `/api/export`, `/api/data`, `/api/demo/reset`, `/api/config`, `/api/checkins/latest`, `/api/recipes`).
- Auth is local-demo only: `AuthScreen` → `onSignIn(name)` → `localStorage('neurotrack_user')`; onboarding → `localStorage('neurotrack_prefs')`. Do not invent backend auth, tokens or social login. Keep validation rules and redirects.
- Preserve the N-back runner, all 10 cognitive tasks, habit/session persistence, timers, audio generation and voice input.
- **Respect uncommitted user work.** At the time of writing, `client/src/components/FocusHabitTracker.tsx` has uncommitted voice-input/transcript changes. Never overwrite them; check `git status` before editing any file.
- Never remove a feature just to make a UI look complete. If a control is decorative in the reference design but real here, keep it real.

## 10. Dependency discipline

- Add a dependency only when a chosen React Bits component declares it and no existing library can serve.
- Never install two libraries that do the same job; prefer `lucide-react` icons over adding an icon pack.
- Keep `package.json` scripts (`dev`, `build`, `test`) working. Do not add a framework-level dependency (router, state manager, CSS-in-JS) without explicit need.

## 11. Definition of done

- `npm --workspace client run build` passes and `npm test` (server) still passes.
- Every existing route, form, slider, dropdown and API request still works.
- Responsive checks at 1440/1024/768/390 px show no overflow or clipped controls.
- Reduced-motion and touch behaviour verified.
- Report exactly what was implemented, what was skipped and why — never claim untested behaviour works.
