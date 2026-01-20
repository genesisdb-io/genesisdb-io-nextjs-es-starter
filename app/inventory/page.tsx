"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Warehouse,
  Package,
  ScrollText,
  Lightbulb,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PackageX,
  ArrowDownToLine,
  ArrowUpFromLine,
  Wrench,
} from "lucide-react"
import {
  createWarehouse,
  addProduct,
  receiveStock,
  sellStock,
  adjustStock,
  fetchWarehouse,
  fetchAllWarehouses,
  fetchWarehouseHistory,
} from "./actions"
import type { WarehouseState, Product } from "@/lib/projections/inventory"

const SAMPLE_PRODUCTS = [
  { sku: "WDG-001", name: "Widget Pro", category: "Widgets", unitPrice: 29.99 },
  { sku: "WDG-002", name: "Widget Basic", category: "Widgets", unitPrice: 14.99 },
  { sku: "GDG-001", name: "Gadget X", category: "Gadgets", unitPrice: 49.99 },
  { sku: "GDG-002", name: "Gadget Mini", category: "Gadgets", unitPrice: 24.99 },
  { sku: "ACC-001", name: "Accessory Pack", category: "Accessories", unitPrice: 9.99 },
]

export default function InventoryDemo() {
  const [isPending, startTransition] = useTransition()
  const [currentWarehouseId, setCurrentWarehouseId] = useState<string | null>(null)
  const [warehouse, setWarehouse] = useState<WarehouseState | null>(null)
  const [allWarehouses, setAllWarehouses] = useState<WarehouseState[]>([])
  const [history, setHistory] = useState<Array<{ id: string; type: string; data: unknown; time: string | undefined }>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [newWarehouseName, setNewWarehouseName] = useState("")
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [stockQuantity, setStockQuantity] = useState(10)

  useEffect(() => {
    if (currentWarehouseId) {
      startTransition(async () => {
        const warehouseState = await fetchWarehouse(currentWarehouseId)
        setWarehouse(warehouseState)
        const warehouseHistory = await fetchWarehouseHistory(currentWarehouseId)
        setHistory(warehouseHistory)
      })
    }
  }, [currentWarehouseId])

  useEffect(() => {
    startTransition(async () => {
      const warehouses = await fetchAllWarehouses()
      setAllWarehouses(warehouses)
    })
  }, [])

  const refreshData = async () => {
    const warehouses = await fetchAllWarehouses()
    setAllWarehouses(warehouses)
    if (currentWarehouseId) {
      const warehouseState = await fetchWarehouse(currentWarehouseId)
      setWarehouse(warehouseState)
      const warehouseHistory = await fetchWarehouseHistory(currentWarehouseId)
      setHistory(warehouseHistory)
    }
  }

  const handleCreateWarehouse = () => {
    if (!newWarehouseName.trim()) return
    startTransition(async () => {
      const { warehouseId } = await createWarehouse(newWarehouseName.trim())
      setNewWarehouseName("")
      setCurrentWarehouseId(warehouseId)
      await refreshData()
    })
  }

  const handleAddProduct = (product: (typeof SAMPLE_PRODUCTS)[0]) => {
    if (!currentWarehouseId) return
    startTransition(async () => {
      await addProduct(currentWarehouseId, product)
      await refreshData()
    })
  }

  const handleReceiveStock = (productId: string) => {
    if (!currentWarehouseId || stockQuantity <= 0) return
    startTransition(async () => {
      await receiveStock(currentWarehouseId, productId, stockQuantity, `PO-${Date.now()}`)
      await refreshData()
    })
  }

  const handleSellStock = (productId: string) => {
    if (!currentWarehouseId || stockQuantity <= 0) return
    const product = warehouse?.products.find((p) => p.productId === productId)
    if (!product || product.quantity < stockQuantity) return
    startTransition(async () => {
      await sellStock(currentWarehouseId, productId, stockQuantity, `ORD-${Date.now()}`)
      await refreshData()
    })
  }

  const handleAdjustStock = (productId: string, adjustment: number, reason: "damaged" | "lost" | "found" | "correction") => {
    if (!currentWarehouseId) return
    startTransition(async () => {
      await adjustStock(currentWarehouseId, productId, adjustment, reason)
      await refreshData()
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatEventType = (type: string) => {
    return type.replace("io.genesisdb.demo.", "")
  }

  const isLowStock = (product: Product) => product.quantity <= product.reorderPoint && product.quantity > 0
  const isOutOfStock = (product: Product) => product.quantity === 0

  const selectedProduct = warehouse?.products.find((p) => p.productId === selectedProductId)

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            A stock tracking system demonstrating event sourcing with GenesisDB
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Warehouses & Add Products */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Warehouses</h2>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWarehouseName}
                  onChange={(e) => setNewWarehouseName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateWarehouse()}
                  placeholder="New warehouse name..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                  disabled={isPending}
                />
                <Button size="sm" onClick={handleCreateWarehouse} disabled={isPending || !newWarehouseName.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {allWarehouses.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No warehouses yet</p>
              ) : (
                <div className="space-y-2">
                  {allWarehouses.map((wh) => (
                    <button
                      key={wh.warehouseId}
                      onClick={() => {
                        setCurrentWarehouseId(wh.warehouseId)
                        setSelectedProductId(null)
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        wh.warehouseId === currentWarehouseId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <p className="font-medium">{wh.name}</p>
                      <p className="text-sm opacity-80">
                        {wh.totalProducts} products · {formatPrice(wh.totalValue)}
                        {wh.lowStockCount > 0 && (
                          <span className="ml-2 text-orange-500">
                            <AlertTriangle className="w-3 h-3 inline" /> {wh.lowStockCount} low
                          </span>
                        )}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Products */}
            {warehouse && (
              <div className="bg-card rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Add Products</h2>
                </div>
                <div className="space-y-2">
                  {SAMPLE_PRODUCTS.map((product) => {
                    const exists = warehouse.products.some((p) => p.sku === product.sku)
                    return (
                      <div key={product.sku} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="text-sm">
                          <p className="font-medium">{product.name}</p>
                          <p className="text-muted-foreground">
                            {product.sku} · {formatPrice(product.unitPrice)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddProduct(product)}
                          disabled={isPending || exists}
                        >
                          {exists ? "Added" : <Plus className="w-3 h-3" />}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Products & Stock */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              {!warehouse ? (
                <p className="text-muted-foreground text-center py-8">Select or create a warehouse</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      <h2 className="text-xl font-semibold">{warehouse.name}</h2>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatPrice(warehouse.totalValue)}</span>
                  </div>

                  {warehouse.products.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No products in inventory</p>
                  ) : (
                    <div className="space-y-3">
                      {warehouse.products.map((product) => (
                        <button
                          key={product.productId}
                          onClick={() => setSelectedProductId(product.productId)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            isOutOfStock(product)
                              ? "bg-destructive/10 border border-destructive/20"
                              : isLowStock(product)
                              ? "bg-orange-500/10 border border-orange-500/20"
                              : "bg-muted/50"
                          } ${selectedProductId === product.productId ? "ring-2 ring-primary" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {product.sku} · {formatPrice(product.unitPrice)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg">{product.quantity}</p>
                              <div className="flex items-center gap-1 justify-end">
                                {isOutOfStock(product) && (
                                  <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded flex items-center gap-1">
                                    <PackageX className="w-3 h-3" />
                                    Out
                                  </span>
                                )}
                                {isLowStock(product) && (
                                  <span className="text-xs bg-orange-500/20 text-orange-600 px-2 py-0.5 rounded flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    Low
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3 text-green-500" />
                              {product.totalReceived} in
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingDown className="w-3 h-3 text-red-500" />
                              {product.totalSold} out
                            </span>
                            <span>Reorder: {product.reorderPoint}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Stock Actions */}
            {selectedProduct && (
              <div className="bg-card rounded-lg border p-4 space-y-4">
                <h3 className="font-semibold">{selectedProduct.name}</h3>
                <p className="text-sm text-muted-foreground">Current stock: {selectedProduct.quantity}</p>

                <div className="flex items-center gap-2">
                  <label className="text-sm">Quantity:</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-2 py-1 text-sm border rounded-md bg-background"
                    min="1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReceiveStock(selectedProduct.productId)}
                    disabled={isPending}
                    className="flex items-center gap-1"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Receive
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSellStock(selectedProduct.productId)}
                    disabled={isPending || selectedProduct.quantity < stockQuantity}
                    className="flex items-center gap-1"
                  >
                    <ArrowUpFromLine className="w-4 h-4" />
                    Sell
                  </Button>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2 flex items-center gap-1">
                    <Wrench className="w-4 h-4" />
                    Adjustments
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdjustStock(selectedProduct.productId, -1, "damaged")}
                      disabled={isPending || selectedProduct.quantity < 1}
                      className="text-xs"
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      Damaged
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdjustStock(selectedProduct.productId, -1, "lost")}
                      disabled={isPending || selectedProduct.quantity < 1}
                      className="text-xs"
                    >
                      <Minus className="w-3 h-3 mr-1" />
                      Lost
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdjustStock(selectedProduct.productId, 1, "found")}
                      disabled={isPending}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Found
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdjustStock(selectedProduct.productId, 1, "correction")}
                      disabled={isPending}
                      className="text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Correction
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Event History */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScrollText className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Event History</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? "Hide" : "Show"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Every stock movement is recorded as an immutable event. Inventory levels are calculated by replaying these events.
              </p>

              {showHistory && history.length > 0 && (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {history.map((event, index) => (
                    <div key={event.id} className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {formatEventType(event.type)}
                        </span>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.time ? new Date(event.time).toLocaleString() : "N/A"}
                      </p>
                      <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {showHistory && history.length === 0 && (
                <p className="text-muted-foreground text-sm">No events yet</p>
              )}

              {!showHistory && history.length > 0 && (
                <p className="text-muted-foreground text-sm">{history.length} events recorded</p>
              )}
            </div>

            <div className="bg-card rounded-lg border p-4 mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-semibold">Why Event Sourcing for Inventory?</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Inventory management is a perfect use case for event sourcing:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Complete audit trail of all stock movements</li>
                  <li>Trace discrepancies back to specific events</li>
                  <li>Calculate stock at any point in time</li>
                  <li>Never lose data due to overwrites</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
