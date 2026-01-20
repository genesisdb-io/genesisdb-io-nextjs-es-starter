import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const CreateCartSchema = z.object({
  cartId: z.string().uuid(),
  userId: z.string().optional(),
})

type Input = z.infer<typeof CreateCartSchema>

registerCommand("create-cart", async (data: Input) => {
  const validated = CreateCartSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/cart/${validated.cartId}`,
        type: EventTypes.CART_CREATED,
        data: {
          cartId: validated.cartId,
          userId: validated.userId ?? null,
          createdAt: new Date().toISOString(),
        },
      },
    ],
    [
      {
        type: "isSubjectNew",
        payload: { subject: `/cart/${validated.cartId}` },
      },
    ]
  )

  console.log(`Cart created: ${validated.cartId}`)
})
