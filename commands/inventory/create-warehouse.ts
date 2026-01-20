import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const CreateWarehouseSchema = z.object({
  warehouseId: z.string().uuid(),
  name: z.string().min(1).max(100),
  location: z.string().optional(),
})

type Input = z.infer<typeof CreateWarehouseSchema>

registerCommand("create-warehouse", async (data: Input) => {
  const validated = CreateWarehouseSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/warehouse/${validated.warehouseId}`,
        type: EventTypes.WAREHOUSE_CREATED,
        data: {
          warehouseId: validated.warehouseId,
          name: validated.name,
          location: validated.location ?? null,
          createdAt: new Date().toISOString(),
        },
      },
    ],
    [
      {
        type: "isSubjectNew",
        payload: { subject: `/warehouse/${validated.warehouseId}` },
      },
    ]
  )

  console.log(`Warehouse created: ${validated.name}`)
})
