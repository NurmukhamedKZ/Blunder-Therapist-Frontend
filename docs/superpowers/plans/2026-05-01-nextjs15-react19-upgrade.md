# Next.js 15 + React 19 Upgrade Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade from Next.js 14 + React 18 to Next.js 15 + React 19 to resolve all known security vulnerabilities.

**Architecture:** This is a pure dependency upgrade. The codebase uses no Next.js 15 breaking-change surfaces (no async `params`/`searchParams`/`cookies()`/`headers()` in Server Components, no Route Handlers, no middleware). The only structural note is that `react-chessboard` must be re-pinned to v5 (currently downgraded to v4 to avoid the peer-dep conflict — upgrading React to 19 removes that conflict).

**Tech Stack:** Next.js 15, React 19, react-chessboard v5, TypeScript 5, Tailwind CSS 3

---

## Files Modified

- `package.json` — version pins for `next`, `react`, `react-dom`, `@types/react`, `@types/react-dom`, `react-chessboard`

---

### Task 1: Update dependency versions in package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Edit package.json**

Replace the relevant lines so `package.json` dependencies read:

```json
"dependencies": {
  "next": "^15.3.1",
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "react-chessboard": "^5.10.0",
  "chess.js": "^1.0.0-beta.8",
  "stockfish.js": "^10.0.2",
  "lucide-react": "^0.460.0",
  "clsx": "^2.1.1",
  "tailwind-merge": "^2.5.4"
},
"devDependencies": {
  "@types/node": "^22.9.0",
  "@types/react": "^19.0.0",
  "@types/react-dom": "^19.0.0",
  "autoprefixer": "^10.4.20",
  "postcss": "^8.5.10",
  "tailwindcss": "^3.4.15",
  "typescript": "^5.6.3"
}
```

Note: `postcss` is bumped to `^8.5.10` to also clear the moderate PostCSS XSS advisory.

- [ ] **Step 2: Install**

```bash
npm install
```

Expected: no peer-dep errors. React 19 satisfies react-chessboard v5's `peer react@"^19.0.0"` requirement.

- [ ] **Step 3: Verify audit is clean**

```bash
npm audit
```

Expected: `found 0 vulnerabilities`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: upgrade to Next.js 15 + React 19, clear security advisories"
```

---

### Task 2: Fix any TypeScript or build errors

**Files:**
- Modify: any file reported by `tsc` or `next build`

- [ ] **Step 1: Run type-check**

```bash
npx tsc --noEmit
```

Expected: no errors. If errors appear, they are most likely React 19 type changes (e.g. `children` prop now explicit on component props). Fix them inline.

Common React 19 type fix — if any component has implicit children:
```tsx
// Before (React 18 — children was in React.FC)
function Foo({ children }: { children: React.ReactNode }) { ... }

// After (React 19 — same, already explicit, no change needed)
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: `✓ Compiled successfully`. Address any build errors before continuing.

- [ ] **Step 3: Commit if any code fixes were needed**

Only commit if files were changed in this task:
```bash
git add -p
git commit -m "fix: address React 19 / Next.js 15 type compatibility"
```

---

### Task 3: Smoke-test the running app

**Files:** none — verification only

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000` with no errors in terminal.

- [ ] **Step 2: Verify chessboard renders**

Open `http://localhost:3000` in a browser. Confirm:
- The chessboard renders with pieces
- Dragging a piece and dropping it on a valid square moves the piece
- The engine responds with a move
- The opponent strength slider works

- [ ] **Step 3: Verify no console errors**

Open DevTools → Console. Expected: no React errors or warnings about unknown props / deprecated APIs.

- [ ] **Step 4: Commit verification note**

```bash
git commit --allow-empty -m "chore: verified Next.js 15 + React 19 upgrade working in dev"
```
