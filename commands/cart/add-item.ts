import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const AddItemSchema = z.object({
  cartId: z.string().uuid(),
  productId: z.string(),
  productName: z.string(),
  price: z.number().positive(),
  quantity: z.number().int().positive().default(1),
})

type Input = z.infer<typeof AddItemSchema>

registerCommand("add-item", async (data: Input) => {
  const validated = AddItemSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/cart/${validated.cartId}`,
        type: EventTypes.ITEM_ADDED,
        data: {
          cartId: validated.cartId,
          productId: validated.productId,
          productName: validated.productName,
          price: validated.price,
          quantity: validated.quantity,
          addedAt: new Date().toISOString(),
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

  console.log(`Item added to cart ${validated.cartId}: ${validated.productName} x${validated.quantity}`)
})
