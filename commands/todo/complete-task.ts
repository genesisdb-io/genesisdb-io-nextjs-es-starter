import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const CompleteTaskSchema = z.object({
  listId: z.string().uuid(),
  taskId: z.string().uuid(),
})

type Input = z.infer<typeof CompleteTaskSchema>

registerCommand("complete-task", async (data: Input) => {
  const validated = CompleteTaskSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/todo/${validated.listId}`,
        type: EventTypes.TASK_COMPLETED,
        data: {
          listId: validated.listId,
          taskId: validated.taskId,
          completedAt: new Date().toISOString(),
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

  console.log(`Task completed: ${validated.taskId}`)
})
