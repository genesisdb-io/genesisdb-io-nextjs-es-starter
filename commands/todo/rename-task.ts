import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const RenameTaskSchema = z.object({
  listId: z.string().uuid(),
  taskId: z.string().uuid(),
  title: z.string().min(1).max(200),
})

type Input = z.infer<typeof RenameTaskSchema>

registerCommand("rename-task", async (data: Input) => {
  const validated = RenameTaskSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/todo/${validated.listId}`,
        type: EventTypes.TASK_RENAMED,
        data: {
          listId: validated.listId,
          taskId: validated.taskId,
          title: validated.title,
          renamedAt: new Date().toISOString(),
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

  console.log(`Task renamed: ${validated.taskId} -> ${validated.title}`)
})
