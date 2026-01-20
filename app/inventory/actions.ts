"use server"

import { v4 as uuid } from "uuid"
import { dispatchCommand } from "@/lib/cqrs"
import {
  getWarehouseState,
  getAllWarehouses,
  getWarehouseHistory,
  type WarehouseState,
} from "@/lib/projections/inventory"
import "@/commands/inventory"

export async function createWarehouse(name: string, location?: string): Promise<{ warehouseId: string }> {
  const warehouseId = uuid()

  await dispatchCommand({
    type: "create-warehouse",
    data: { warehouseId, name, location },
  })

  return { warehouseId }
}

export async function addProduct(
  warehouseId: string,
  product: {
    sku: string
    name: string
    category?: string
    unitPrice: number
    reorderPoint?: number
  }
): Promise<{ productId: string }> {
  const productId = uuid()

  await dispatchCommand({
    type: "add-product",
    data: {
      warehouseId,
      productId,
      sku: product.sku,
      name: product.name,
      category: product.category,
      unitPrice: product.unitPrice,
      reorderPoint: product.reorderPoint ?? 10,
    },
  })

  return { productId }
}

export async function receiveStock(
  warehouseId: string,
  productId: string,
  quantity: number,
  reference?: string
) {
  await dispatchCommand({
    type: "receive-stock",
    data: { warehouseId, productId, quantity, reference },
  })
}

export async function sellStock(
  warehouseId: string,
  productId: string,
  quantity: number,
  reference?: string
) {
  await dispatchCommand({
    type: "sell-stock",
    data: { warehouseId, productId, quantity, reference },
  })
}

export async function adjustStock(
  warehouseId: string,
  productId: string,
  adjustment: number,
  reason: "damaged" | "lost" | "found" | "correction" | "other",
  notes?: string
) {
  await dispatchCommand({
    type: "adjust-stock",
    data: { warehouseId, productId, adjustment, reason, notes },
  })
}

export async function setReorderPoint(warehouseId: string, productId: string, reorderPoint: number) {
  await dispatchCommand({
    type: "set-reorder-point",
    data: { warehouseId, productId, reorderPoint },
  })
}

export async function fetchWarehouse(warehouseId: string): Promise<WarehouseState | null> {
  return getWarehouseState(warehouseId)
}

export async function fetchAllWarehouses(): Promise<WarehouseState[]> {
  return getAllWarehouses()
}

export async function fetchWarehouseHistory(warehouseId: string) {
  return getWarehouseHistory(warehouseId)
}
