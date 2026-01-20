import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const ReturnBookSchema = z.object({
  libraryId: z.string().uuid(),
  bookId: z.string().uuid(),
  memberId: z.string().uuid(),
})

type Input = z.infer<typeof ReturnBookSchema>

registerCommand("return-book", async (data: Input) => {
  const validated = ReturnBookSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/library/${validated.libraryId}`,
        type: EventTypes.BOOK_RETURNED,
        data: {
          libraryId: validated.libraryId,
          bookId: validated.bookId,
          memberId: validated.memberId,
          returnedAt: new Date().toISOString(),
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

  console.log(`Book ${validated.bookId} returned by member ${validated.memberId}`)
})
