# Pharma Ledger

Desktop app for managing pharmacy finances, customer debts, and daily transactions.

![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)

---

## What it does

Track income and expenses, manage customer debts, and generate monthly financial reports. Everything is stored locally in a SQLite database, with automatic daily backups sent to your email.

### Key Features

**Financial Tracking**
- Record income and expenses
- Monthly financial reports (customizable date ranges)
- Export data to Excel
- Real-time statistics dashboard

**Customer Management**
- Track customer debts
- Full payment history
- Customer profiles with transaction details

**Payment Accounts**
- Manage multiple payment sources
- Categorize transactions
- Monitor balances

**Automated Backups**
- Daily database backups
- Email delivery
- Configurable schedule

**UI**
- Dark mode
- Arabic (RTL) support
- Clean, modern interface

---

## Installation

1. Clone the repo:
   ```bash
   git clone https://github.com/t0khyo/pharma-ledger.git
   cd pharma-ledger
   ```

2. Install dependencies:
   ```bash
   npm install
   npm run rebuild
   ```

3. Set up email backups (optional):
   
   Create a `.env` file:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   BACKUP_RECIPIENT=recipient@example.com
   BACKUP_ENABLED=true
   ```

4. Run it:
   ```bash
   npm run dev
   ```

---

## Building

**Windows:**
```bash
npm run dist:win
```

**macOS:**
```bash
npm run dist:mac
```

**Linux:**
```bash
npm run dist:linux
```

Output goes to the `dist/` folder.

---

## Development

### Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev mode with hot reload |
| `npm run build` | Build React app |
| `npm run lint` | Check code quality |
| `npm run rebuild` | Rebuild native dependencies |

### Project Structure

```
pharma-ledger/
├── src/
│   ├── electron/      # Backend (database, IPC handlers, services)
│   ├── shared/        # Shared types and utilities
│   └── ui/            # React frontend
├── assets/            # Icons and images
└── dist-*/           # Build output
```

### Tech Stack

**Frontend:** React 19, TypeScript, Tailwind CSS, Radix UI  
**Desktop:** Electron 38  
**Database:** SQLite (better-sqlite3)  
**Build:** Vite, Electron Builder

**Key libraries:** TanStack Table, React Router, date-fns, nodemailer, node-cron

### Database Location

- Windows: `%APPDATA%/pharma-ledger/database.db`
- macOS: `~/Library/Application Support/pharma-ledger/database.db`
- Linux: `~/.config/pharma-ledger/database.db`

---

## License

Private project. All rights reserved.
