# US24 Official

Official repository for **US24 Solutions** website and digital experience platform.

---

## Staging & Branching Strategy

This repository implements a three-tier environment branching model:

| Branch | Environment | Purpose |
|---|---|---|
| `dev` | **Development** | Active development, feature work, and internal testing. |
| `uat` | **User Acceptance Testing (UAT)** | Client review, stakeholder testing, and QA validation. |
| `production` | **Production (Live)** | Live website code deployed to production servers. |

### Promotion Workflow
1. Feature work and enhancements are developed and tested on `dev`.
2. Once verified by developers, changes are merged via PR into `uat` for client and QA review.
3. Upon client approval, code is promoted via PR from `uat` into `production` for live deployment.

---

## Project Structure

```
├── .gitignore
├── Docs/
│   ├── README.md              # Project overview & branching strategy documentation
│   ├── WORDPRESS.md           # Detailed WordPress theme & plugin technical guide
│   └── SITE-AUDIT.md          # Comprehensive audit of live site content and asset inventory
└── wordpress/
    ├── us24/                  # Full-site editing block theme (templates, design tokens, 3D hero block)
    ├── us24-site/             # Core site plugin (page content import, contact forms, office info, SEO)
    ├── tools/                 # Build, crawl, packaging, and verification automation scripts
    └── dev/                   # WordPress Playground blueprint & local testing fixtures
```

---

## Getting Started

### Local Development Server
Run the local WordPress Playground environment directly from the project root:
```bash
npm run dev
```

### Build & Packaging Commands
- `npm run package` — Package theme (`us24-theme.zip`) and plugin (`us24-site.zip`) for distribution/upload.
- `npm run verify` — Run automated validation suite across all pages and blocks.

For complete technical documentation, see [`Docs/WORDPRESS.md`](WORDPRESS.md).
