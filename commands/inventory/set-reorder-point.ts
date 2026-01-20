import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const SetReorderPointSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  reorderPoint: z.number().int().min(0),
})

type Input = z.infer<typeof SetReorderPointSchema>

registerCommand("set-reorder-point", async (data: Input) => {
  const validated = SetReorderPointSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/warehouse/${validated.warehouseId}`,
        type: EventTypes.REORDER_POINT_SET,
        data: {
          warehouseId: validated.warehouseId,
          productId: validated.productId,
          reorderPoint: validated.reorderPoint,
          setAt: new Date().toISOString(),
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

  console.log(`Reorder point set: ${validated.reorderPoint} for product ${validated.productId}`)
})
