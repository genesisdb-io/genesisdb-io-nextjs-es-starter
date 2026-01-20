import { Client } from "genesisdb"

let client: Client | null = null

export function getClient(): Client {
  if (!client) {
    client = new Client()
  }
  return client
}

export const EVENT_SOURCE = "tag:demo.genesisdb.io"

export const EventTypes = {
  // Cart events
  CART_CREATED: "io.genesisdb.demo.cart-created",
  ITEM_ADDED: "io.genesisdb.demo.item-added",
  ITEM_REMOVED: "io.genesisdb.demo.item-removed",
  ITEM_QUANTITY_CHANGED: "io.genesisdb.demo.item-quantity-changed",
  CART_CLEARED: "io.genesisdb.demo.cart-cleared",
  CART_CHECKED_OUT: "io.genesisdb.demo.cart-checked-out",

  // Todo events
  LIST_CREATED: "io.genesisdb.demo.list-created",
  TASK_ADDED: "io.genesisdb.demo.task-added",
  TASK_COMPLETED: "io.genesisdb.demo.task-completed",
  TASK_UNCOMPLETED: "io.genesisdb.demo.task-uncompleted",
  TASK_DELETED: "io.genesisdb.demo.task-deleted",
  TASK_RENAMED: "io.genesisdb.demo.task-renamed",
  LIST_ARCHIVED: "io.genesisdb.demo.list-archived",

  // Library events
  LIBRARY_CREATED: "io.genesisdb.demo.library-created",
  BOOK_ADDED: "io.genesisdb.demo.book-added",
  MEMBER_REGISTERED: "io.genesisdb.demo.member-registered",
  BOOK_BORROWED: "io.genesisdb.demo.book-borrowed",
  BOOK_RETURNED: "io.genesisdb.demo.book-returned",
  BOOK_RESERVED: "io.genesisdb.demo.book-reserved",
  RESERVATION_CANCELLED: "io.genesisdb.demo.reservation-cancelled",

  // Inventory events
  WAREHOUSE_CREATED: "io.genesisdb.demo.warehouse-created",
  PRODUCT_ADDED: "io.genesisdb.demo.product-added",
  STOCK_RECEIVED: "io.genesisdb.demo.stock-received",
  STOCK_SOLD: "io.genesisdb.demo.stock-sold",
  STOCK_ADJUSTED: "io.genesisdb.demo.stock-adjusted",
  REORDER_POINT_SET: "io.genesisdb.demo.reorder-point-set",
} as const

export type EventType = (typeof EventTypes)[keyof typeof EventTypes]
