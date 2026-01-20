import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const CheckoutCartSchema = z.object({
  cartId: z.string().uuid(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
})

type Input = z.infer<typeof CheckoutCartSchema>

registerCommand("checkout-cart", async (data: Input) => {
  const validated = CheckoutCartSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/cart/${validated.cartId}`,
        type: EventTypes.CART_CHECKED_OUT,
        data: {
          cartId: validated.cartId,
          shippingAddress: validated.shippingAddress,
          checkedOutAt: new Date().toISOString(),
        },
      },
    ],
    [
      {
        type: "isSubjectExisting",
        payload: { subject: `/cart/${validated.cartId}` },
      },
    ]
  )

  console.log(`Cart checked out: ${validated.cartId}`)
})
