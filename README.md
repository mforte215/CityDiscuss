# CityDiscuss

> Your city. Your conversation.

A community discussion platform organized around cities — combining a curated article feed with a local forum. No algorithms, just real local discussions.

## Features

- **Articles** — admin-published long-form content with rich text editing, cover images, and tags
- **Forum** — user-created posts organized by city, with voting, sorting (Hot / New / Top), and threaded comments
- **City pages** — each city has its own feed and identity
- **Tag system** — browse and filter content by topic
- **Auth** — sign up, sign in, manage your profile and avatar
- **Admin panel** — `/admin` routes for managing articles and tags
- **Dark mode** — persisted theme preference
- **SEO** — OpenGraph images, sitemap, and robots.txt

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js + React 19 |
| Styling | Tailwind CSS v4 |
| Database / Auth | Supabase (PostgreSQL) |
| Editor | TipTap |
| Analytics | Vercel Analytics |
| Language | TypeScript |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/mforte215/citydiscuss.git
   cd citydiscuss
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Lint with ESLint
```

## License

MIT
