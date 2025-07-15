# MongoDB Collection Editor

A React-based MongoDB collection visualizer and editor built with TypeScript, Express, and MUI DataGrid. This project provides an embeddable component for viewing and editing MongoDB collections with a clean, intuitive interface.

## 🚀 Features

### Current Features (Phase 3)
- **Connection Management**: Connect to any MongoDB instance
- **Collection Browser**: View all collections in a database
- **Data Grid Display**: Show documents in a paginated table format
- **Read-Only Mode**: View MongoDB documents safely
- **Error Handling**: Comprehensive error reporting and loading states
- **Responsive Design**: Works on desktop and mobile devices

### Planned Features
- **Document Editing**: Form-based and inline editing
- **CRUD Operations**: Create, update, and delete documents
- **Advanced Search**: Filter and search across document fields
- **Bulk Operations**: Handle multiple documents at once
- **Export Functionality**: Download data in JSON/CSV formats

## 📦 Project Structure

```
mongo-editor/
├── packages/
│   ├── client/          # React frontend with embeddable component
│   ├── server/          # Express backend API
│   └── shared/          # Common TypeScript types
├── package.json         # Root workspace configuration
└── pnpm-workspace.yaml  # pnpm workspace setup
```

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, MUI Material-UI, MUI DataGrid
- **Backend**: Node.js, Express, TypeScript, MongoDB Driver
- **Package Manager**: pnpm with workspaces
- **State Management**: React hooks (Jotai for future phases)

## 📋 Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- MongoDB instance (local or remote)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Start Development Servers

```bash
# Start both client and server in development mode
pnpm dev

# Or start them separately:
pnpm --filter @mongo-editor/server dev
pnpm --filter @mongo-editor/client dev
```

The client will be available at `http://localhost:3000` and the server at `http://localhost:4000`.

### 3. Connect to MongoDB

1. Open the application in your browser
2. Enter your MongoDB connection string (e.g., `mongodb://localhost:27017`)
3. Optionally specify a database name
4. Click "Connect" to test the connection
5. Select a collection from the dropdown
6. View your data in the grid!

## 💻 Usage

### As an Embeddable Component

```typescript
import { MongoCollectionEditor } from '@mongo-editor/client';

function MyApp() {
  return (
    <MongoCollectionEditor
      mongoUrl="mongodb://localhost:27017"
      databaseName="mydb"
      collectionName="users"
      readonly={false}
      onDocumentChange={(doc) => console.log('Document changed:', doc)}
      onConnectionError={(error) => console.error('Connection error:', error)}
    />
  );
}
```

### API Endpoints

The server provides RESTful endpoints for MongoDB operations:

- `GET /api/collections?mongoUrl=...&databaseName=...` - List collections
- `GET /api/collections/:name?mongoUrl=...` - Get documents with pagination
- `PUT /api/collections/:name/:id?mongoUrl=...` - Update a document
- `POST /api/collections/test-connection` - Test MongoDB connection

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the server package:

```env
PORT=4000
```

### Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mongoUrl` | `string` | `""` | MongoDB connection string |
| `databaseName` | `string` | `""` | Database name (optional) |
| `collectionName` | `string` | `""` | Initial collection to display |
| `readonly` | `boolean` | `false` | Enable read-only mode |
| `onDocumentChange` | `function` | - | Callback when document changes |
| `onConnectionError` | `function` | - | Callback for connection errors |

## 🏗️ Development

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @mongo-editor/client build
pnpm --filter @mongo-editor/server build
pnpm --filter @mongo-editor/shared build
```

### Project Architecture

- **Monorepo Structure**: Uses pnpm workspaces for package management
- **Type Safety**: Shared TypeScript types across frontend and backend
- **Component-Based**: Modular React components for easy maintenance
- **API-First**: RESTful backend design for easy integration

### Key Components

- **MongoCollectionEditor**: Main embeddable component
- **ConnectionConfig**: MongoDB connection setup UI
- **CollectionSelector**: Collection chooser dropdown
- **CollectionDataGrid**: Document display with MUI DataGrid

## 🗺️ Roadmap

### Phase 4: Simple Editing (Next)
- Form-based document editing in modals
- Save/Cancel buttons for explicit actions
- Basic field validation and type checking

### Phase 5: Basic CRUD
- Create new documents
- Delete documents with confirmation
- Refresh and reload functionality

### Phase 6: Multi-Connection Support
- Support multiple editor instances
- Connection pooling and management
- Per-instance configuration

### Future Phases
- Inline editing capabilities
- Advanced search and filtering
- Bulk operations
- Export functionality
- Integration with Forest project

## 🤝 Contributing

This project follows a phase-based development approach:

1. **Simple First**: Basic functionality before advanced features
2. **Form-Based**: Modal forms before inline editing
3. **Manual Actions**: Explicit save/cancel before automatic updates
4. **Progressive Enhancement**: Each phase builds on the previous

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Integration with Forest

This project is designed to integrate with the Forest project located in `../Forest`. The MongoDB editor can be:

1. **Embedded as a component** in Forest's node system
2. **Added as a new node type** for MongoDB data visualization
3. **Extended with Forest's collaboration features** using Yjs

The architecture follows Forest's patterns for consistency and easy integration.