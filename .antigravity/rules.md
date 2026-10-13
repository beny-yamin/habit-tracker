
# SECTION 3: SYSTEM CONSTRAINTS, CODING STANDARDS & AGENT DIRECTIVES

## 1. Environment & Technology Stack
- Node.js Runtime: Node 20+ with ES Module resolution ("type": "module" in package.json)
- Client Stack: React 18, Vite, TypeScript, Tailwind CSS, Lucide React
- Offline Persistence Layer: `idb-keyval` (IndexedDB abstraction)
- Visualizations & Export: Recharts, canvas-confetti, html2pdf.js
- Server Stack: Express 4, TypeScript, tsx watch (dev), Helmet, CORS, dotenv
- Authentication: Firebase Authentication (Client SDK) + Firebase Admin SDK (Server token verification)
- Database & ORM: MongoDB Atlas with Mongoose 8+
- Deployment Target: Render (Static Site for Client, Web Service for API)

## 2. Structural & Architectural Boundaries
- Absolute Isolation: Never import server-side packages (`mongoose`, `firebase-admin`, `express`) into `/client`.
- Zero Direct Database Access: Client code must NEVER connect directly to MongoDB Atlas. All persistence calls route through Express REST endpoints or IndexedDB.
- Secret Hygiene: Never commit `.env` or write credentials into client bundles. Client accesses exclusively `import.meta.env.VITE_*` keys; server accesses `process.env.*`.

## 3. Frontend Implementation Standards
- Component Line-Count Budget: Target under 120 lines per `.tsx` component. Split complex logic into sub-components.
- Styling Rule: Use Tailwind CSS utility classes. Do not create new custom `.css` files.
- Mobile Tap Ergonomics: All interactive checkboxes, day cells, tabs, and buttons must have a minimum tap area of 44x44 pixels.
- Zero-Latency UI Contract: Checkbox toggles and quality ratings MUST update local React state and write to `idb-keyval` in under 16ms before queueing backend sync.

## 4. Backend Implementation Standards
- Security Enforcement: Every route under `/api/habits`, `/api/logs`, and `/api/reports` must pass through `requireAuth` middleware verifying the Bearer token.
- Upsert Idempotency: All log mutations must execute via MongoDB `updateOne` with `{ upsert: true }` keyed on `{ userId, habitId, date }` to eliminate duplicate writes.
- Defensive Payload Validation: Use `express-validator` to strictly enforce date formats (`YYYY-MM-DD`, `YYYY-MM`) and integer rating bounds (1 to 4).

## 5. Antigravity Agent Behavioral Directives (Autonomous Guardrails)
1. PLAN-FIRST PROTOCOL: For every feature prompt, output an Implementation Plan artifact first detailing file paths, exported types, and endpoints. Do NOT write code until authorized.
2. STEPWISE WRITING: Create or edit a maximum of 2 files per execution turn (up to 3 only for small schema definitions).
3. NO PLACEHOLDERS: Output complete, production-ready code. Never write `// ... existing code`, `// TODO`, or `/* insert handlers here */`.
4. GIT CHECKPOINTING: Verify that existing tests, builds (`npm run build`), or type checks pass before marking any milestone complete.
5. ERROR RECOVERY: If a compilation error occurs, output the exact error message and provide a single-file diff repair. Do not attempt multi-file rewrites.
'@