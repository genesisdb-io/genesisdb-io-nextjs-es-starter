import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const AdjustStockSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  adjustment: z.number().int(), // Can be positive or negative
  reason: z.enum(["damaged", "lost", "found", "correction", "other"]),
  notes: z.string().optional(),
})

type Input = z.infer<typeof AdjustStockSchema>

registerCommand("adjust-stock", async (data: Input) => {
  const validated = AdjustStockSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/warehouse/${validated.warehouseId}`,
        type: EventTypes.STOCK_ADJUSTED,
        data: {
          warehouseId: validated.warehouseId,
          productId: validated.productId,
          adjustment: validated.adjustment,
          reason: validated.reason,
          notes: validated.notes ?? null,
          adjustedAt: new Date().toISOString(),
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

  console.log(`Stock adjusted: ${validated.adjustment} units (${validated.reason})`)
})
