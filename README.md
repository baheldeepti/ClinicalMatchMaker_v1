# Clinical Matchmaker

AI-powered clinical trial discovery for patients with rare or complex diseases.

## Overview

Clinical Matchmaker uses a multi-agent pipeline to help patients discover clinical trials they may qualify for. The system reads eligibility criteria, matches them against patient profiles, and explains results in plain language with compassionate voice summaries.

## Features

- **Patient Intake**: Structured form for disease/condition details, biomarkers, and location
- **Multi-Agent Pipeline**: 4 specialized AI agents orchestrated via Toolhouse
  - **Scout**: Discovers actively recruiting trials from ClinicalTrials.gov
  - **Extractor**: Parses eligibility criteria into structured format
  - **Matcher**: Scores patient-trial eligibility with transparent factors
  - **Advocate**: Generates compassionate voice explanations
- **Voice Output**: ElevenLabs text-to-speech with multi-language support
- **Transparent Scoring**: Four-tier eligibility classification with factor breakdown

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite + Tailwind CSS |
| Agent Orchestration | Toolhouse |
| Web Extraction | rtrvr.ai |
| Voice Synthesis | ElevenLabs |
| Payments | Stripe |
| Data Source | ClinicalTrials.gov API |

## Prerequisites

- Node.js 18+
- npm or pnpm
- API keys for: Toolhouse, rtrvr.ai, ElevenLabs, Stripe

## Installation

```bash
# Clone the repository
git clone https://github.com/baheldeepti/ClinicalMatchMaker_v1.git
cd ClinicalMatchMaker_v1

# Install dependencies
npm install

# Copy environment template and add your API keys
cp .env.example .env
# Edit .env with your API keys
```

## Development

```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
clinical-matchmaker/
├── src/
│   ├── components/       # React UI components
│   │   ├── IntakeForm.tsx
│   │   ├── TrialCard.tsx
│   │   ├── MatchPieChart.tsx
│   │   ├── AudioPlayer.tsx
│   │   └── ...
│   ├── pages/            # Page components
│   │   ├── Landing.tsx
│   │   ├── Intake.tsx
│   │   ├── Processing.tsx
│   │   └── Results.tsx
│   ├── App.tsx           # Root component with routing
│   └── main.tsx          # Entry point
├── lib/                  # Shared utilities and clients
│   ├── schemas.ts        # Zod validation schemas
│   ├── config.ts         # Environment configuration
│   ├── toolhouse.ts      # Toolhouse SDK wrapper
│   ├── rtrvr.ts          # rtrvr.ai client
│   ├── elevenlabs.ts     # ElevenLabs client
│   ├── stripe.ts         # Stripe client
│   ├── geo-utils.ts      # Distance calculations
│   └── orchestrator.ts   # Pipeline coordinator
├── agents/               # AI agent implementations
│   ├── scout/            # Trial discovery agent
│   ├── extractor/        # Eligibility extraction agent
│   ├── matcher/          # Patient-trial matching agent
│   └── advocate/         # Voice script generation agent
├── prompts/              # PDD prompt files (source of truth)
└── tests/                # Test suites
```

## Architecture

The application follows a multi-agent pipeline:

```
Patient Intake → Scout → Extractor → Matcher → Advocate → Results
                  ↓         ↓           ↓          ↓
            ClinicalTrials  rtrvr.ai   Scoring   ElevenLabs
```

### Agent Pipeline

1. **Scout Agent**: Queries ClinicalTrials.gov API for recruiting trials matching patient condition and location
2. **Extractor Agent**: Uses rtrvr.ai to extract structured eligibility criteria from trial pages
3. **Matcher Agent**: Compares patient profile against criteria, calculates match score (0-100)
4. **Advocate Agent**: Generates plain-language voice script and synthesizes audio via ElevenLabs

### Match Categories

| Score | Category | Meaning |
|-------|----------|---------|
| 85-100 | Strong Match | Meets most/all criteria |
| 60-84 | Possible Match | Likely eligible, some uncertainty |
| 30-59 | Future Potential | May qualify later |
| 0-29 | Not Eligible | Clear exclusion criteria met |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_TOOLHOUSE_API_KEY` | Yes | Toolhouse API key for agent orchestration |
| `VITE_RTRVR_API_KEY` | Yes | rtrvr.ai API key for web extraction |
| `VITE_ELEVENLABS_API_KEY` | Yes | ElevenLabs API key for voice synthesis |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe publishable key for payments |
| `VITE_CLINICALTRIALS_API_BASE` | No | Custom ClinicalTrials.gov API base URL |

## Compliance & Privacy

- **No PHI Storage**: Session-only processing for HIPAA alignment
- **Anonymous Sessions**: No user accounts required
- **Self-Reported Data**: Only patient-provided information, no medical records
- **Clear Disclaimers**: Required medical disclaimer on all screens

## Disclaimer

This tool provides informational guidance only and does not constitute medical advice. Always consult with a qualified healthcare provider before making decisions about clinical trial participation.

## License

MIT

## Acknowledgments

Built for the PromptDriven + Toolhouse Hackathon, sponsored by ElevenLabs and rtrvr.ai.
