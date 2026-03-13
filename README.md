# Agency AAA Platform

An AI-powered social media management platform for agencies.

## Features

- 🤖 **AI Insights** – Generate content ideas and captions with AI
- 📅 **Content Calendar** – Plan and schedule posts visually
- 🚀 **Action Center** – Manage all pending tasks in one place
- 📊 **Analytics** – Track performance across social channels
- ⚙️ **Settings** – Manage accounts and integrations

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (Auth + Database)
- **AI**: OpenAI API
- **Social Media**: Twitter, Instagram, LinkedIn APIs

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://openai.com) API key

### Installation

```bash
# Clone the repository
git clone https://github.com/holapaola/agentaaa.git
cd agentaaa

# Install dependencies
npm install

# Create your environment file
cp .env.example .env.local

# Add your API keys to .env.local

# Run database migrations in your Supabase project
# (copy the SQL from supabase/migrations/001_init.sql)

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── dashboard/      # Dashboard tab components
│   └── ui/             # Reusable UI components
├── hooks/              # Custom React hooks
├── pages/              # Route-level pages
├── services/           # API service layers
└── types/              # TypeScript type definitions
supabase/
└── migrations/         # SQL migrations
```

## Environment Variables

See `.env.example` for all required environment variables.

## License

MIT
