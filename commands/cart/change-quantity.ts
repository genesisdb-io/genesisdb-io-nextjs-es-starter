import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const ChangeQuantitySchema = z.object({
  cartId: z.string().uuid(),
  productId: z.string(),
  quantity: z.number().int().positive(),
})

type Input = z.infer<typeof ChangeQuantitySchema>

registerCommand("change-quantity", async (data: Input) => {
  const validated = ChangeQuantitySchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/cart/${validated.cartId}`,
        type: EventTypes.ITEM_QUANTITY_CHANGED,
        data: {
          cartId: validated.cartId,
          productId: validated.productId,
          quantity: validated.quantity,
          changedAt: new Date().toISOString(),
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

  console.log(`Quantity changed in cart ${validated.cartId}: ${validated.productId} -> ${validated.quantity}`)
})
