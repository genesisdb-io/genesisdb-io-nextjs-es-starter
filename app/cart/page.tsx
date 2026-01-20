"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ShoppingCart, Package, ScrollText, Lightbulb, Plus, Minus, X, Check, Store } from "lucide-react"
import {
  createCart,
  addItemToCart,
  removeItemFromCart,
  changeItemQuantity,
  checkoutCart,
  fetchCart,
  fetchAllCarts,
  fetchCartHistory,
} from "./actions"
import type { CartState } from "@/lib/projections/cart"

const PRODUCTS = [
  { productId: "tumbler-001", productName: "Tumbler (Black)", price: 2990000.0 },
  { productId: "cape-001", productName: "Kevlar Cape", price: 45000.0 },
  { productId: "batarang-001", productName: "Batarang Set (x12)", price: 1200.0 },
  { productId: "grapple-001", productName: "Grapple Gun", price: 8500.0 },
  { productId: "cowl-001", productName: "Tactical Cowl", price: 125000.0 },
]

export default function CartDemo() {
  const [isPending, startTransition] = useTransition()
  const [currentCartId, setCurrentCartId] = useState<string | null>(null)
  const [cart, setCart] = useState<CartState | null>(null)
  const [allCarts, setAllCarts] = useState<CartState[]>([])
  const [history, setHistory] = useState<Array<{ id: string; type: string; data: unknown; time: string | undefined }>>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    if (currentCartId) {
      startTransition(async () => {
        const cartState = await fetchCart(currentCartId)
        setCart(cartState)
        const cartHistory = await fetchCartHistory(currentCartId)
        setHistory(cartHistory)
      })
    }
  }, [currentCartId])

  useEffect(() => {
    startTransition(async () => {
      const carts = await fetchAllCarts()
      setAllCarts(carts)
    })
  }, [])

  const refreshData = async () => {
    const carts = await fetchAllCarts()
    setAllCarts(carts)
    if (currentCartId) {
      const cartState = await fetchCart(currentCartId)
      setCart(cartState)
      const cartHistory = await fetchCartHistory(currentCartId)
      setHistory(cartHistory)
    }
  }

  const handleCreateCart = () => {
    startTransition(async () => {
      const { cartId } = await createCart("user-bruce-wayne")
      setCurrentCartId(cartId)
      await refreshData()
    })
  }

  const handleAddItem = (product: (typeof PRODUCTS)[0]) => {
    if (!currentCartId) return
    startTransition(async () => {
      await addItemToCart(currentCartId, product)
      await refreshData()
    })
  }

  const handleRemoveItem = (productId: string) => {
    if (!currentCartId) return
    startTransition(async () => {
      await removeItemFromCart(currentCartId, productId)
      await refreshData()
    })
  }

  const handleChangeQuantity = (productId: string, quantity: number) => {
    if (!currentCartId || quantity < 1) return
    startTransition(async () => {
      await changeItemQuantity(currentCartId, productId, quantity)
      await refreshData()
    })
  }

  const handleCheckout = () => {
    if (!currentCartId) return
    startTransition(async () => {
      await checkoutCart(currentCartId, {
        street: "1007 Mountain Drive",
        city: "Gotham City",
        postalCode: "12345",
        country: "USA",
      })
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

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Shopping Cart Demo</h1>
          <p className="text-muted-foreground">
            A shopping cart demonstrating event sourcing patterns with GenesisDB
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Wayne Enterprises Catalog</h2>
              </div>

              {!currentCartId ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-muted-foreground">Create a cart to start shopping</p>
                  <Button onClick={handleCreateCart} disabled={isPending} size="lg">
                    {isPending ? "Creating..." : "Create New Cart"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {PRODUCTS.map((product) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{product.productName}</p>
                        <p className="text-sm text-muted-foreground">{formatPrice(product.price)}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddItem(product)}
                        disabled={isPending || cart?.status === "checked_out"}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">All Carts</h2>
                </div>
                <Button variant="outline" size="sm" onClick={handleCreateCart} disabled={isPending}>
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>
              {allCarts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No carts yet</p>
              ) : (
                <div className="space-y-2">
                  {allCarts.map((c) => (
                    <button
                      key={c.cartId}
                      onClick={() => setCurrentCartId(c.cartId)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        c.cartId === currentCartId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <p className="font-mono text-xs truncate">{c.cartId}</p>
                      <p className="text-sm flex items-center gap-1">
                        {c.totalItems} items · {formatPrice(c.totalPrice)}
                        {c.status === "checked_out" && <Check className="w-4 h-4 ml-1" />}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Current Cart</h2>
                </div>
                {cart?.status === "checked_out" && (
                  <span className="text-xs bg-green-500/20 text-green-600 px-2 py-1 rounded flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Checked Out
                  </span>
                )}
              </div>

              {!cart ? (
                <p className="text-muted-foreground text-center py-8">Select or create a cart</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground font-mono">{cart.cartId}</p>

                  {cart.items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">Cart is empty</p>
                  ) : (
                    <div className="space-y-3">
                      {cart.items.map((item) => (
                        <div key={item.productId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatPrice(item.price)} × {item.quantity} = {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                          {cart.status !== "checked_out" && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => handleChangeQuantity(item.productId, item.quantity - 1)}
                                disabled={isPending || item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => handleChangeQuantity(item.productId, item.quantity + 1)}
                                disabled={isPending}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon-sm"
                                onClick={() => handleRemoveItem(item.productId)}
                                disabled={isPending}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total ({cart.totalItems} items)</span>
                      <span>{formatPrice(cart.totalPrice)}</span>
                    </div>

                    {cart.status !== "checked_out" && cart.items.length > 0 && (
                      <Button className="w-full" onClick={handleCheckout} disabled={isPending}>
                        {isPending ? "Processing..." : "Checkout"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

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
                Events are the source of truth. The cart state is projected from these events.
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
                      <p className="text-xs text-muted-foreground">{event.time ? new Date(event.time).toLocaleString() : "N/A"}</p>
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
                <h3 className="font-semibold">What is Event Sourcing?</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Instead of storing the current state, we store <strong>all events</strong> that led to that state.
                </p>
                <p>
                  <strong>Benefits:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Complete audit trail</li>
                  <li>Time travel / replay</li>
                  <li>Debug production issues</li>
                  <li>Build multiple projections</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
