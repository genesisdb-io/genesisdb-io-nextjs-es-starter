import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const CreateLibrarySchema = z.object({
  libraryId: z.string().uuid(),
  name: z.string().min(1).max(100),
  address: z.string().optional(),
})

type Input = z.infer<typeof CreateLibrarySchema>

registerCommand("create-library", async (data: Input) => {
  const validated = CreateLibrarySchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/library/${validated.libraryId}`,
        type: EventTypes.LIBRARY_CREATED,
        data: {
          libraryId: validated.libraryId,
          name: validated.name,
          address: validated.address ?? null,
          createdAt: new Date().toISOString(),
        },
      },
    ],
    [
      {
        type: "isSubjectNew",
        payload: { subject: `/library/${validated.libraryId}` },
      },
    ]
  )

  console.log(`Library created: ${validated.name}`)
})
