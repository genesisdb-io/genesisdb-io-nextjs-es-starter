"use server"

import { v4 as uuid } from "uuid"
import { dispatchCommand } from "@/lib/cqrs"
import { getCartState, getAllCarts, getCartHistory, type CartState } from "@/lib/projections/cart"
import "@/commands/cart"

export async function createCart(userId?: string): Promise<{ cartId: string }> {
  const cartId = uuid()

  await dispatchCommand({
    type: "create-cart",
    data: { cartId, userId },
  })

  return { cartId }
}

export async function addItemToCart(
  cartId: string,
  product: {
    productId: string
    productName: string
    price: number
    quantity?: number
  }
) {
  await dispatchCommand({
    type: "add-item",
    data: {
      cartId,
      productId: product.productId,
      productName: product.productName,
      price: product.price,
      quantity: product.quantity ?? 1,
    },
  })
}

export async function removeItemFromCart(cartId: string, productId: string) {
  await dispatchCommand({
    type: "remove-item",
    data: { cartId, productId },
  })
}

export async function changeItemQuantity(cartId: string, productId: string, quantity: number) {
  await dispatchCommand({
    type: "change-quantity",
    data: { cartId, productId, quantity },
  })
}

export async function checkoutCart(
  cartId: string,
  shippingAddress: {
    street: string
    city: string
    postalCode: string
    country: string
  }
) {
  await dispatchCommand({
    type: "checkout-cart",
    data: { cartId, shippingAddress },
  })
}

export async function fetchCart(cartId: string): Promise<CartState | null> {
  return getCartState(cartId)
}

export async function fetchAllCarts(): Promise<CartState[]> {
  return getAllCarts()
}

export async function fetchCartHistory(cartId: string) {
  return getCartHistory(cartId)
}
