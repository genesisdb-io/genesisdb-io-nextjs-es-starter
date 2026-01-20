import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const RemoveItemSchema = z.object({
  cartId: z.string().uuid(),
  productId: z.string(),
})

type Input = z.infer<typeof RemoveItemSchema>

registerCommand("remove-item", async (data: Input) => {
  const validated = RemoveItemSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/cart/${validated.cartId}`,
        type: EventTypes.ITEM_REMOVED,
        data: {
          cartId: validated.cartId,
          productId: validated.productId,
          removedAt: new Date().toISOString(),
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

  console.log(`Item removed from cart ${validated.cartId}: ${validated.productId}`)
})
