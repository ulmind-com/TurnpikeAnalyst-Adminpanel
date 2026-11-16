# Turnpike Admin — Super Admin & Operations Console

> **Client-rendered, role-gated administration and super-admin console** managing the internship programme, AI submission reviews, `.zip` source inspections, certificate templates, grounded support assistant, enterprise CMS, revenue leads, and user roles.  
> Built with **React 19**, **TanStack Start (`ssr: false`)**, **Recharts**, and **Tailwind CSS v4**, deployed to **Vercel** (`Root Directory: turnpike-admin`).

> **Full System Design (All Actors, Frontend, Backend & Data Flows):** [ARCHITECTURE.md](./ARCHITECTURE.md)  
> **Deployment Runbook:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## Repository Layout

```text
├── turnpike-admin/                    # Console root (Vercel Root Directory)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── __root.tsx             # HTML shell
│   │   │   ├── index.tsx              # Redirects / -> /admin
│   │   │   ├── login.tsx              # Staff email/password login
│   │   │   ├── admin.tsx              # Strict role gate (ADMIN check) + DashboardLayout
│   │   │   └── admin/                 # 27 console pages
│   │   ├── components/layout/         # AppSidebar, AppTopbar, DashboardLayout
│   │   ├── features/                  # Domain CRUD modal dialogs (services, blogs, users, etc.)
│   │   ├── constants/navigation.ts    # Role-filtered sidebar sections & route titles
│   │   ├── server.ts · start.ts · router.tsx
│   │   ├── styles.css                 # Tailwind v4 entry (@source self + shared)
│   │   └── vercel.json                # X-Frame-Options: DENY, X-Robots-Tag: noindex, nofollow
└── packages/shared/                   # @turnpike/shared (47 Radix UI primitives, Axios, Zustand, Tokens)
```

---

## What Admins & Super Admins See (Role Gate & 27 Console Pages)

Every route under `/admin/*` is wrapped by `admin.tsx` (`ssr: false`). Non-admin accounts (`CLIENT`) are blocked before the console mounts and offered an explanation + sign-out button.

```mermaid
flowchart TB
    L["/login<br/>Email & Password Sign-In"] --> G{"Authenticated &<br/>role == ADMIN?"}
    G -->|"No (CLIENT)"| DENY["Role Gate Block<br/>'This console is for administrators' + Sign Out"]
    G -->|"Yes (ADMIN / Super Admin)"| SHELL["DashboardLayout (27 Console Pages)"]

    subgraph P1["Super Admin & Administration"]
        S1["/admin/users — Grant/Revoke ADMIN, CONSULTANT, INSTRUCTOR, CLIENT"]
        S2["/admin/security — Rotate own email, password (min 10 chars) & name"]
        S3["/admin/activity — Administrative audit logs"]
        S4["/admin/system-health · /admin/settings · /admin/profile · /admin/notifications"]
    end

    subgraph P2["Internship & Support AI (ADMIN)"]
        I1["/admin/internship-tracks — Publish/edit curated project briefs"]
        I2["/admin/internship-submissions — Queue, AI claim checks, .zip download, demo verify & approve"]
        I3["/admin/certificate-templates — Drag-and-drop field coordinates & live PDF preview"]
        I4["/admin/chatbot — Knowledge base CRUD, Unanswered backlog & Behaviour"]
    end

    subgraph P3["Revenue, Catalog & Content"]
        R1["Revenue: /admin/leads · /admin/book-calls · /admin/demo-requests"]
        R2["Catalog: /admin/services · /admin/digital-content · /admin/industries · /admin/courses · /admin/instructor-applications"]
        R3["Content: /admin/blogs · /admin/faqs · /admin/careers · /admin/clients · /admin/newsletter · /admin/cms"]
    end

    SHELL --> P1 & P2 & P3
```

---

## Super Administrator Lifecycle & Security Flow

The **first** administrator is bootstrapped once from `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` on the backend **only when zero `ADMIN` accounts exist**. Once created, environment credentials are ignored, and changes happen securely from `/admin/security`:

```mermaid
sequenceDiagram
    actor SA as Super Administrator
    participant UI as /admin/security
    participant API as POST /api/v1/account/credentials
    participant DB as MongoDB users

    SA->>UI: Submit current_password + new_email / new_password / full_name
    UI->>API: Authenticated Bearer JWT (get_current_admin)
    API->>API: Verify current_password against bcrypt hash
    alt Incorrect current password
        API-->>UI: 403 "Current password is incorrect."
    else Verified
        API->>DB: Update email / bcrypt hash / full_name (role unchanged)
        API-->>UI: 200 Updated Account
        UI->>UI: Automatic sign-out so session re-authenticates cleanly
    end
```

---

## Internship Submission Review & Certificate Issuance Flow

```mermaid
flowchart LR
    Q["Submissions Queue<br/>1. Needs a decision (UNDER_REVIEW)<br/>2. Review failed (REVIEW_FAILED)<br/>3. Answering questions (QUESTIONS_PENDING)<br/>4. Building (ENROLLED)<br/>5. Approved · 6. All"]

    Q --> INSPECT["Inspect Side-by-Side<br/>• Dossier Write-up & Diagrams (Mermaid/Image)<br/>• Live GitHub Repo Link & Metadata<br/>• Download Uploaded .zip Source Archive<br/>• Admin-Only AI Report (Score, Findings, Claim Checks)<br/>• Intern Answers to Project-Specific Questions"]

    INSPECT --> DEMO["Watch Local Demo Recording"]
    DEMO --> TICK["Tick Mandatory Checkbox:<br/>'I watched the demo recording' (demo_verified=true)"]
    TICK -->|"Approve"| ISSUE["Backend Renders PDF from Active Template<br/>Uploads to Cloudinary -> Issues TA-YYYY-XXXXXXXXXX"]
    TICK -->|"Decline"| REJ["Saves Feedback Notes -> Visible on Intern Dashboard"]
```

> **Why `demo_verified` is enforced on the server:** No LLM can watch a video recording. The backend rejects any approval request unless an administrator explicitly confirms the local demo video runs.

---

## Certificate Designer & Support Assistant Training Flows

```mermaid
flowchart TB
    subgraph Cert["Certificate Visual Editor (/admin/certificate-templates)"]
        C1["Upload PNG/JPEG/WebP Background Artwork"] --> C2["Drag 5 Dynamic Fields onto Canvas<br/>recipient_name · project_title · duration · issued_on · certificate_number"]
        C2 --> C3["Configure font size, weight, color, align & max_width"]
        C3 --> C4["Preview Sample PDF & Set as Active Template"]
    end

    subgraph Bot["Support Assistant Trainer (/admin/chatbot)"]
        B1["Review 'Unanswered' Tab<br/>(Questions where knowledge score < threshold)"] --> B2["Add Entry in 'Knowledge' Tab<br/>(Question, Answer, Topic, Keywords)"]
        B2 --> B3["Live Immediately — No Deploy Required"]
        B4["Configure Greeting, Persona & Enabled Toggle in 'Behaviour' Tab"]
    end
```

---

## Complete Console Route Map (27 Pages)

| Section | Routes | Allowed Roles |
|---|---|---|
| **Overview** | `/admin`, `/admin/system-health` | `ADMIN` (Dashboard visible to signed-in staff) |
| **Revenue** | `/admin/leads`, `/admin/book-calls`, `/admin/demo-requests` | `ADMIN`, `CONSULTANT` |
| **Catalog** | `/admin/services`, `/admin/digital-content`, `/admin/industries`, `/admin/courses`, `/admin/instructor-applications` | `ADMIN`, `CONSULTANT`, `INSTRUCTOR` (applications) |
| **Internship & AI** | `/admin/internship-tracks`, `/admin/internship-submissions`, `/admin/certificate-templates`, `/admin/chatbot` | `ADMIN` |
| **Content** | `/admin/blogs`, `/admin/faqs`, `/admin/careers`, `/admin/clients`, `/admin/clients/$industryName`, `/admin/newsletter`, `/admin/cms` | Staff (`ADMIN` / authorized) |
| **Administration** | `/admin/users`, `/admin/activity`, `/admin/security`, `/admin/profile`, `/admin/settings`, `/admin/notifications` | `ADMIN` (Users, Activity, Security) |

---

## Technologies Used in Turnpike Admin

| Category | Technologies & Libraries |
|---|---|
| **Framework & Routing** | React 19 (`react` 19.2), TanStack Start (`ssr: false`), TanStack Router, Nitro (`vercel` preset) |
| **Build & Tooling** | Vite 8, TypeScript 5.8, Bun Workspaces (`@turnpike/shared`), ESLint 9, Prettier 3 |
| **Styling & Design System** | Tailwind CSS v4 (`@tailwindcss/vite`), `tw-animate-css`, shared `oklch` CSS tokens (light & dark) |
| **UI, Charts & Diagrams** | 47 Radix UI primitives (`shadcn`), Recharts (`recharts` 2.15), Mermaid (`mermaid` 12.3), Lucide React, Motion, Sonner |
| **State, Forms & API** | TanStack React Query v5, Zustand v5 (persisted session), React Hook Form, Zod, Axios (silent 401 token refresh) |

---

## Local Development

```bash
bun install
cp turnpike-admin/.env.example turnpike-admin/.env   # set VITE_API_BASE_URL=http://127.0.0.1:8000
bun run dev                                          # http://localhost:3001
```

## Production Deployment (Vercel)

- **Root Directory:** `turnpike-admin`
- **Build Command:** Managed by `turnpike-admin/vercel.json` (`cd .. && bun install && cd turnpike-admin && NITRO_PRESET=vercel bun run build`)
- **Security Headers:** `X-Robots-Tag: noindex, nofollow`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

*Published from the Turnpike Analyst monorepo. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the complete platform blueprint.*
