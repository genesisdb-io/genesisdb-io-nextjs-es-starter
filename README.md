# GenesisDB Event Sourcing Demos

A Next.js application demonstrating event sourcing patterns with [GenesisDB](https://www.genesisdb.io).

## Demos

### Shopping Cart (`/cart`)
A complete e-commerce cart with add/remove items, quantity changes, and checkout. See how cart state is projected from immutable events.

### Todo List (`/todo`)
A task manager with create, complete, and delete operations. Watch the full event history as you manage your tasks.

### Library System (`/library`)
A book borrowing system with members, loans, returns, and overdue tracking. Track the complete history of every book in the catalog.

### Inventory Tracker (`/inventory`)
A warehouse stock management system with receiving, selling, and adjustments. Track every stock movement with full audit trail and low stock alerts.

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for running GenesisDB)

### Start GenesisDB

Run GenesisDB with Docker:

```bash
docker run -d --name genesisdb \
  -p 8080:8080 \
  -e GENESISDB_AUTH_TOKEN=secret \
  -e GENESISDB_TZ=Europe/Vienna \
  -e GENESISDB_PROMETHEUS_METRICS=true \
  genesisdb/genesisdb:latest
```

### Environment Variables

Create a `.env` file:

```env
GENESISDB_AUTH_TOKEN=your-secret-token
GENESISDB_API_URL=http://localhost:8080
GENESISDB_API_VERSION=v1
```

### Install & Run

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── page.tsx                    # Demo selector
│   ├── api/commands/route.ts       # HTTP API for commands
│   ├── cart/
│   │   ├── layout.tsx
│   │   ├── actions.ts
│   │   └── page.tsx                # /cart
│   ├── todo/
│   │   ├── layout.tsx
│   │   ├── actions.ts
│   │   └── page.tsx                # /todo
│   ├── library/
│   │   ├── layout.tsx
│   │   ├── actions.ts
│   │   └── page.tsx                # /library
│   └── inventory/
│       ├── layout.tsx
│       ├── actions.ts
│       └── page.tsx                # /inventory
├── commands/
│   ├── cart/
│   │   ├── create-cart.ts
│   │   ├── add-item.ts
│   │   ├── remove-item.ts
│   │   ├── change-quantity.ts
│   │   └── checkout-cart.ts
│   ├── todo/
│   │   ├── create-list.ts
│   │   ├── add-task.ts
│   │   ├── complete-task.ts
│   │   ├── uncomplete-task.ts
│   │   ├── delete-task.ts
│   │   └── rename-task.ts
│   ├── library/
│   │   ├── create-library.ts
│   │   ├── add-book.ts
│   │   ├── register-member.ts
│   │   ├── borrow-book.ts
│   │   ├── return-book.ts
│   │   ├── reserve-book.ts
│   │   └── cancel-reservation.ts
│   └── inventory/
│       ├── create-warehouse.ts
│       ├── add-product.ts
│       ├── receive-stock.ts
│       ├── sell-stock.ts
│       ├── adjust-stock.ts
│       └── set-reorder-point.ts
├── lib/
│   ├── cqrs.ts                     # Command dispatcher
│   ├── genesisdb/
│   │   └── client.ts               # GenesisDB client & event types
│   └── projections/
│       ├── cart.ts
│       ├── todo.ts
│       ├── library.ts
│       └── inventory.ts
```

## Event Types

All events use the source `tag:demo.genesisdb.io` and follow the pattern `io.genesisdb.demo.*`:

### Cart Events

| Event Type | Description |
|-----------|-------------|
| `cart-created` | Cart was created |
| `item-added` | Item added to cart |
| `item-removed` | Item removed from cart |
| `item-quantity-changed` | Item quantity updated |
| `cart-checked-out` | Cart was checked out |

### Todo Events

| Event Type | Description |
|-----------|-------------|
| `list-created` | Todo list was created |
| `task-added` | Task added to list |
| `task-completed` | Task marked as complete |
| `task-uncompleted` | Task marked as incomplete |
| `task-deleted` | Task was deleted |
| `task-renamed` | Task title was changed |

### Library Events

| Event Type | Description |
|-----------|-------------|
| `library-created` | Library branch was created |
| `book-added` | Book added to catalog |
| `member-registered` | Member registered |
| `book-borrowed` | Book borrowed by member |
| `book-returned` | Book returned |
| `book-reserved` | Book reserved (while borrowed) |
| `reservation-cancelled` | Reservation cancelled |

### Inventory Events

| Event Type | Description |
|-----------|-------------|
| `warehouse-created` | Warehouse was created |
| `product-added` | Product added to catalog |
| `stock-received` | Stock received into inventory |
| `stock-sold` | Stock sold from inventory |
| `stock-adjusted` | Manual stock adjustment |
| `reorder-point-set` | Reorder threshold updated |

## Event Sourcing Concepts

### Commands (Write Side)

Commands are actions that produce events:

```typescript
await client.commitEvents([{
  source: EVENT_SOURCE,
  subject: `/warehouse/${warehouseId}`,
  type: EventTypes.STOCK_RECEIVED,
  data: { productId, quantity, reference, receivedAt }
}])
```

### Projections (Read Side)

Projections rebuild state from events:

```typescript
for (const event of events) {
  switch (event.type) {
    case EventTypes.STOCK_RECEIVED:
      product.quantity += event.data.quantity
      product.totalReceived += event.data.quantity
      break
    case EventTypes.STOCK_SOLD:
      product.quantity -= event.data.quantity
      product.totalSold += event.data.quantity
      break
  }
}
```

### Preconditions

GenesisDB supports atomic preconditions:

```typescript
// Ensure subject exists before operations
await client.commitEvents([event], [{
  type: "isSubjectExisting",
  payload: { subject: `/warehouse/${warehouseId}` }
}])

// Ensure subject is new
await client.commitEvents([event], [{
  type: "isSubjectNew",
  payload: { subject: `/warehouse/${warehouseId}` }
}])
```

## Learn More

- [GenesisDB Documentation](https://docs.genesisdb.io)
- [CloudEvents Specification](https://cloudevents.io)
- [Start mastering event sourcing](https://www.eventsourcing.dev)

## License

MIT

## Author

* E-Mail: mail@genesisdb.io
* URL: https://www.genesisdb.io
* Docs: https://docs.genesisdb.io
