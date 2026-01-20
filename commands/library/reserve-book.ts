import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const ReserveBookSchema = z.object({
  libraryId: z.string().uuid(),
  bookId: z.string().uuid(),
  memberId: z.string().uuid(),
})

type Input = z.infer<typeof ReserveBookSchema>

registerCommand("reserve-book", async (data: Input) => {
  const validated = ReserveBookSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/library/${validated.libraryId}`,
        type: EventTypes.BOOK_RESERVED,
        data: {
          libraryId: validated.libraryId,
          bookId: validated.bookId,
          memberId: validated.memberId,
          reservedAt: new Date().toISOString(),
        },
      },
    ],
    [
      {
        type: "isSubjectExisting",
        payload: { subject: `/library/${validated.libraryId}` },
      },
    ]
  )

  console.log(`Book ${validated.bookId} reserved by member ${validated.memberId}`)
})
