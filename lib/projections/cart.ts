import { getClient, EventTypes } from "@/lib/genesisdb/client"

// Cart item type
export interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
}

// Cart state projected from events
export interface CartState {
  cartId: string
  userId: string | null
  items: CartItem[]
  totalItems: number
  totalPrice: number
  status: "active" | "checked_out"
  createdAt: string
  checkedOutAt: string | null
}

// Event data types
interface CartCreatedData {
  cartId: string
  userId: string | null
  createdAt: string
}

interface ItemAddedData {
  cartId: string
  productId: string
  productName: string
  price: number
  quantity: number
  addedAt: string
}

interface ItemRemovedData {
  cartId: string
  productId: string
  removedAt: string
}

interface ItemQuantityChangedData {
  cartId: string
  productId: string
  quantity: number
  changedAt: string
}

interface CartCheckedOutData {
  cartId: string
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
  checkedOutAt: string
}

// Project cart state from events
export async function getCartState(cartId: string): Promise<CartState | null> {
  const client = getClient()
  const events = await client.streamEvents(`/cart/${cartId}`)

  if (events.length === 0) {
    return null
  }

  // Initial state
  const state: CartState = {
    cartId,
    userId: null,
    items: [],
    totalItems: 0,
    totalPrice: 0,
    status: "active",
    createdAt: "",
    checkedOutAt: null,
  }

  // Apply events to build current state (event sourcing projection)
  for (const event of events) {
    const data = event.data as Record<string, unknown>

    switch (event.type) {
      case EventTypes.CART_CREATED: {
        const d = data as unknown as CartCreatedData
        state.userId = d.userId
        state.createdAt = d.createdAt
        break
      }

      case EventTypes.ITEM_ADDED: {
        const d = data as unknown as ItemAddedData
        const existingItem = state.items.find((i) => i.productId === d.productId)
        if (existingItem) {
          existingItem.quantity += d.quantity
        } else {
          state.items.push({
            productId: d.productId,
            productName: d.productName,
            price: d.price,
            quantity: d.quantity,
          })
        }
        break
      }

      case EventTypes.ITEM_REMOVED: {
        const d = data as unknown as ItemRemovedData
        state.items = state.items.filter((i) => i.productId !== d.productId)
        break
      }

      case EventTypes.ITEM_QUANTITY_CHANGED: {
        const d = data as unknown as ItemQuantityChangedData
        const item = state.items.find((i) => i.productId === d.productId)
        if (item) {
          item.quantity = d.quantity
        }
        break
      }

      case EventTypes.CART_CLEARED: {
        state.items = []
        break
      }

      case EventTypes.CART_CHECKED_OUT: {
        const d = data as unknown as CartCheckedOutData
        state.status = "checked_out"
        state.checkedOutAt = d.checkedOutAt
        break
      }
    }
  }

  // Calculate totals
  state.totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0)
  state.totalPrice = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return state
}

// Get all carts (for demo purposes)
export async function getAllCarts(): Promise<CartState[]> {
  const client = getClient()

  // Query all cart-created events to find all cart IDs
  const createdEvents = await client.queryEvents(
    `STREAM e FROM events WHERE e.type == "${EventTypes.CART_CREATED}" ORDER BY e.time DESC MAP { cartId: e.data.cartId }`
  ) as Array<{ cartId: string }>

  // Build state for each cart
  const carts: CartState[] = []
  for (const event of createdEvents) {
    const cartState = await getCartState(event.cartId)
    if (cartState) {
      carts.push(cartState)
    }
  }

  return carts
}

// Get event history for a cart
export async function getCartHistory(cartId: string) {
  const client = getClient()
  const events = await client.streamEvents(`/cart/${cartId}`)

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    data: event.data,
    time: event.time,
  }))
}
