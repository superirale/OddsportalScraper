# Oddsportal JSON Scraper

A Node.js/TypeScript scraper for extracting betting odds data from OddsPortal.com with support for match results, Asian handicap, 1x2, and totals markets.

## Features

- Scrapes multiple betting markets:
  - Match results
  - Asian handicap
  - 1x2 (Win/Draw/Loss)
  - Totals (Over/Under)
- Redis-based job queue system for distributed scraping
- CouchDB storage backend
- Puppeteer-based browser automation
- TypeScript for type safety
- Data transformation pipeline
- Support for multiple sports/leagues

## Prerequisites

- Node.js 14+
- Redis server
- CouchDB server
- TypeScript 4+

## Installation

```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install
```

## Configuration

1. Set up your CouchDB connection in src/index.ts:
```typescript
const COUCHDB_URL = "http://admin:[password]@127.0.0.1:5984"
```

2. Configure Redis in src/index.ts:
```typescript
const REDIS_CONFIG = {
  connection: {
    host: "localhost",
    port: 6379,
  }
}
```

## Usage

The scraper supports several commands through a CLI interface:

```bash
# Run the crawler
npm run start -- crawler <country> <sport> <league> <season>

# Process scraping jobs
npm run start -- scraper

# Retry failed jobs
npm run start -- retry-failed

# Crawl Sofascore data
npm run start -- crawl-sofascore

# Scrape Sofascore data
npm run start -- scrape-sofascore

# Delete records
npm run start -- delete <league> <season> <sport>
```

## Project Structure

```
src/
├── datasource/       # Data storage implementations
├── scrapers/        # Web scraping logic
├── transformers/    # Data transformation logic
├── utils/          # Helper utilities
├── index.ts        # Main application entry
└── runner.ts       # Scraping job runner
```

## Data Transformers

- `MatchTransformer`: Transforms basic match data
- `AsianHandicapTransformer`: Processes Asian handicap odds
- `OneTimesTwoTransformer`: Handles 1x2 market odds
- `TotalsTransformer`: Processes over/under market odds
- `PlayerStatisticsTransformer`: Transforms player statistics data

## Testing

```bash
# Run test suite
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[Add your license information here]

## Acknowledgments

- OddsPortal.com for the source data
- BullMQ for queue management
- Puppeteer for browser automation
