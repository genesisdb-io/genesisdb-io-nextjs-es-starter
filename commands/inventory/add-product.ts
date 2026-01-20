import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const AddProductSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  category: z.string().optional(),
  unitPrice: z.number().positive(),
  reorderPoint: z.number().int().min(0).default(10),
})

type Input = z.infer<typeof AddProductSchema>

registerCommand("add-product", async (data: Input) => {
  const validated = AddProductSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/warehouse/${validated.warehouseId}`,
        type: EventTypes.PRODUCT_ADDED,
        data: {
          warehouseId: validated.warehouseId,
          productId: validated.productId,
          sku: validated.sku,
          name: validated.name,
          category: validated.category ?? "General",
          unitPrice: validated.unitPrice,
          reorderPoint: validated.reorderPoint,
          addedAt: new Date().toISOString(),
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

  console.log(`Product added: ${validated.name} (SKU: ${validated.sku})`)
})
