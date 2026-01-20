import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const CreateListSchema = z.object({
  listId: z.string().uuid(),
  name: z.string().min(1).max(100),
})

type Input = z.infer<typeof CreateListSchema>

registerCommand("create-list", async (data: Input) => {
  const validated = CreateListSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/todo/${validated.listId}`,
        type: EventTypes.LIST_CREATED,
        data: {
          listId: validated.listId,
          name: validated.name,
          createdAt: new Date().toISOString(),
        },
      },
    ],
    [
      {
        type: "isSubjectNew",
        payload: { subject: `/todo/${validated.listId}` },
      },
    ]
  )

  console.log(`Todo list created: ${validated.name}`)
})
