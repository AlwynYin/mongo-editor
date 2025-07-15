# MongoDB Collection Editor

A React-based MongoDB collection visualizer and editor built with TypeScript, Express, and MUI DataGrid. This project provides an embeddable component for viewing and editing MongoDB collections with a clean, intuitive interface.

## Features

### Current Features (Phase 3)
- **Database and Collection Browser**: View databases and collections availiable
- **Data Grid Display**: Show documents in a paginated table format
- **Read-Only Mode**: View MongoDB documents safely

### Planned Features
- **Advanced Search**: Filter and search across document fields
- **Multi Editor Support**: Allow multiple editors to edit the same collection concurrently
- **Bulk Operations**: Handle multiple documents at once
- **Export Functionality**: Download data in JSON/CSV formats

## Project Structure

```
mongo-editor/
├── packages/
│   ├── client/          # React frontend with embeddable component
│   ├── server/          # Express backend API
│   └── shared/          # Common TypeScript types
├── package.json         # Root workspace configuration
└── pnpm-workspace.yaml  # pnpm workspace setup
```

## Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- MongoDB instance (local or remote)

## Quick Start

set variables in `packages/server/.env`

```bash
MONGO_URL=mongodb://localhost:27017
NODE_ENV=development
PORT=4001
```

install dependency and start server

```bash
pnpm install

pnpm dev
```
