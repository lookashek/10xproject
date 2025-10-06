# 10x Cards

> AI-powered flashcard generation & spaced-repetition learning

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

## Project Description

10x Cards enables learners to quickly create and manage study flashcards. By leveraging large language models (via **OpenRouter.ai**) the application can instantly propose question–answer pairs from any text you provide, drastically reducing the time required to create high-quality study materials.

Key features:

- Paste up to **10 000 characters** of text and generate flashcard suggestions in one click.
- Accept, edit or reject AI-generated cards before saving them.
- Manually create, edit and delete your own flashcards.
- Basic user authentication backed by **Supabase** (sign-up, log-in, account deletion).
- Study sessions powered by a spaced-repetition algorithm.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Astro 5](https://astro.build/) – islands architecture & static generation |
| UI Library | React 19 + [shadcn/ui](https://ui.shadcn.com/) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + `tw-animate-css` |
| Backend-as-a-Service | Supabase (Postgres, Auth, RLS) |
| AI Gateway | OpenRouter.ai |
| Tooling | ESLint, Prettier, Husky, GitHub Actions |
| Runtime | Node.js 22.14 ([`.nvmrc`](./.nvmrc)) |

> For more details see [`./.ai/tech-stack.md`](./.ai/tech-stack.md).

## Getting Started Locally

### Prerequisites

- **Node.js 22.14** (install via [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- npm v10+ (or pnpm / yarn)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/10x-cards.git
cd 10x-cards

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open your browser
open http://localhost:4321
```

### Environment variables

Create a `.env` file in the project root and provide the following keys:

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-public-anon-key
OPENROUTER_API_KEY=your-openrouter-key
```

## Available Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Astro dev server with hot reload |
| `npm run build` | Build the production-ready static site |
| `npm run preview` | Preview the built site locally |
| `npm run astro` | Expose the full Astro CLI |
| `npm run lint` | Run ESLint over the codebase |
| `npm run lint:fix` | Run ESLint and automatically fix problems |
| `npm run format` | Format files using Prettier |

## Project Scope

### In scope (MVP)

- AI-assisted flashcard generation & manual editing
- CRUD operations for user-owned flashcards
- Basic authentication & account deletion
- Study sessions based on an open-source spaced-repetition algorithm
- Collection of usage statistics (generated vs accepted cards)

### Out of scope (post-MVP)

- Mobile apps (web only)
- Gamification mechanisms
- Public API & card sharing between users
- Advanced notifications & reminders
- Importing multiple document formats (PDF, DOCX, …)
- Advanced keyword search

## Project Status

🚧 **Active development – MVP**

Core user stories **US-001** through **US-009** are currently in progress. Check GitHub Issues & Project boards for the latest roadmap and task breakdown.

## License

This project is licensed under the **MIT License**. See the [`LICENSE`](./LICENSE) file for full license text.
