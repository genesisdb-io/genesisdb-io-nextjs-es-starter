import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const DeleteTaskSchema = z.object({
  listId: z.string().uuid(),
  taskId: z.string().uuid(),
})

type Input = z.infer<typeof DeleteTaskSchema>

registerCommand("delete-task", async (data: Input) => {
  const validated = DeleteTaskSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/todo/${validated.listId}`,
        type: EventTypes.TASK_DELETED,
        data: {
          listId: validated.listId,
          taskId: validated.taskId,
          deletedAt: new Date().toISOString(),
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

  console.log(`Task deleted: ${validated.taskId}`)
})
