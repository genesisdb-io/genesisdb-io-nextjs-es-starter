import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const ReceiveStockSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  reference: z.string().optional(), // PO number, supplier reference, etc.
})

type Input = z.infer<typeof ReceiveStockSchema>

registerCommand("receive-stock", async (data: Input) => {
  const validated = ReceiveStockSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/warehouse/${validated.warehouseId}`,
        type: EventTypes.STOCK_RECEIVED,
        data: {
          warehouseId: validated.warehouseId,
          productId: validated.productId,
          quantity: validated.quantity,
          reference: validated.reference ?? null,
          receivedAt: new Date().toISOString(),
        },
      },
    ],
    [
      {
        type: "isSubjectExisting",
        payload: { subject: `/warehouse/${validated.warehouseId}` },
      },
    ]
  )

  console.log(`Stock received: ${validated.quantity} units of product ${validated.productId}`)
})
