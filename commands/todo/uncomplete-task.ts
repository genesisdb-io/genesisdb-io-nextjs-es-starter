import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const UncompleteTaskSchema = z.object({
  listId: z.string().uuid(),
  taskId: z.string().uuid(),
})

type Input = z.infer<typeof UncompleteTaskSchema>

registerCommand("uncomplete-task", async (data: Input) => {
  const validated = UncompleteTaskSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/todo/${validated.listId}`,
        type: EventTypes.TASK_UNCOMPLETED,
        data: {
          listId: validated.listId,
          taskId: validated.taskId,
          uncompletedAt: new Date().toISOString(),
        },
      },
    ],
    [
      {
        type: "isSubjectExisting",
        payload: { subject: `/todo/${validated.listId}` },
      },
    ]
  )

  console.log(`Task uncompleted: ${validated.taskId}`)
})
