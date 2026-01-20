import { getClient, EventTypes } from "@/lib/genesisdb/client"

export interface Product {
  productId: string
  sku: string
  name: string
  category: string
  unitPrice: number
  quantity: number
  reorderPoint: number
  totalReceived: number
  totalSold: number
  addedAt: string
}

export interface StockMovement {
  type: "received" | "sold" | "adjusted"
  productId: string
  quantity: number
  reference: string | null
  reason?: string
  notes?: string
  timestamp: string
}

export interface WarehouseState {
  warehouseId: string
  name: string
  location: string | null
  products: Product[]
  movements: StockMovement[]
  totalProducts: number
  totalValue: number
  lowStockCount: number
  createdAt: string
}

interface WarehouseCreatedData {
  warehouseId: string
  name: string
  location: string | null
  createdAt: string
}

interface ProductAddedData {
  warehouseId: string
  productId: string
  sku: string
  name: string
  category: string
  unitPrice: number
  reorderPoint: number
  addedAt: string
}

interface StockReceivedData {
  warehouseId: string
  productId: string
  quantity: number
  reference: string | null
  receivedAt: string
}

interface StockSoldData {
  warehouseId: string
  productId: string
  quantity: number
  reference: string | null
  soldAt: string
}

interface StockAdjustedData {
  warehouseId: string
  productId: string
  adjustment: number
  reason: string
  notes: string | null
  adjustedAt: string
}

interface ReorderPointSetData {
  warehouseId: string
  productId: string
  reorderPoint: number
  setAt: string
}

export async function getWarehouseState(warehouseId: string): Promise<WarehouseState | null> {
  const client = getClient()
  const events = await client.streamEvents(`/warehouse/${warehouseId}`)

  if (events.length === 0) {
    return null
  }

  const state: WarehouseState = {
    warehouseId,
    name: "",
    location: null,
    products: [],
    movements: [],
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    createdAt: "",
  }

  for (const event of events) {
    const data = event.data as Record<string, unknown>

    switch (event.type) {
      case EventTypes.WAREHOUSE_CREATED: {
        const d = data as unknown as WarehouseCreatedData
        state.name = d.name
        state.location = d.location
        state.createdAt = d.createdAt
        break
      }

      case EventTypes.PRODUCT_ADDED: {
        const d = data as unknown as ProductAddedData
        state.products.push({
          productId: d.productId,
          sku: d.sku,
          name: d.name,
          category: d.category,
          unitPrice: d.unitPrice,
          quantity: 0,
          reorderPoint: d.reorderPoint,
          totalReceived: 0,
          totalSold: 0,
          addedAt: d.addedAt,
        })
        break
      }

      case EventTypes.STOCK_RECEIVED: {
        const d = data as unknown as StockReceivedData
        const product = state.products.find((p) => p.productId === d.productId)
        if (product) {
          product.quantity += d.quantity
          product.totalReceived += d.quantity
        }
        state.movements.push({
          type: "received",
          productId: d.productId,
          quantity: d.quantity,
          reference: d.reference,
          timestamp: d.receivedAt,
        })
        break
      }

      case EventTypes.STOCK_SOLD: {
        const d = data as unknown as StockSoldData
        const product = state.products.find((p) => p.productId === d.productId)
        if (product) {
          product.quantity -= d.quantity
          product.totalSold += d.quantity
        }
        state.movements.push({
          type: "sold",
          productId: d.productId,
          quantity: -d.quantity,
          reference: d.reference,
          timestamp: d.soldAt,
        })
        break
      }

      case EventTypes.STOCK_ADJUSTED: {
        const d = data as unknown as StockAdjustedData
        const product = state.products.find((p) => p.productId === d.productId)
        if (product) {
          product.quantity += d.adjustment
        }
        state.movements.push({
          type: "adjusted",
          productId: d.productId,
          quantity: d.adjustment,
          reference: null,
          reason: d.reason,
          notes: d.notes ?? undefined,
          timestamp: d.adjustedAt,
        })
        break
      }

      case EventTypes.REORDER_POINT_SET: {
        const d = data as unknown as ReorderPointSetData
        const product = state.products.find((p) => p.productId === d.productId)
        if (product) {
          product.reorderPoint = d.reorderPoint
        }
        break
      }
    }
  }

  // Calculate totals
  state.totalProducts = state.products.length
  state.totalValue = state.products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0)
  state.lowStockCount = state.products.filter((p) => p.quantity <= p.reorderPoint).length

  return state
}

export async function getAllWarehouses(): Promise<WarehouseState[]> {
  const client = getClient()

  const createdEvents = (await client.queryEvents(
    `STREAM e FROM events WHERE e.type == "${EventTypes.WAREHOUSE_CREATED}" ORDER BY e.time DESC MAP { warehouseId: e.data.warehouseId }`
  )) as Array<{ warehouseId: string }>

  const warehouses: WarehouseState[] = []
  for (const event of createdEvents) {
    const warehouseState = await getWarehouseState(event.warehouseId)
    if (warehouseState) {
      warehouses.push(warehouseState)
    }
  }

  return warehouses
}

export async function getWarehouseHistory(warehouseId: string) {
  const client = getClient()
  const events = await client.streamEvents(`/warehouse/${warehouseId}`)

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    data: event.data,
    time: event.time,
  }))
}

// Helper functions
export function isLowStock(product: Product): boolean {
  return product.quantity <= product.reorderPoint
}

export function isOutOfStock(product: Product): boolean {
  return product.quantity === 0
}

export function getLowStockProducts(state: WarehouseState): Product[] {
  return state.products.filter(isLowStock)
}

export function getOutOfStockProducts(state: WarehouseState): Product[] {
  return state.products.filter(isOutOfStock)
}
