import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const BorrowBookSchema = z.object({
  libraryId: z.string().uuid(),
  bookId: z.string().uuid(),
  memberId: z.string().uuid(),
  dueDate: z.string(), // ISO date string
})

type Input = z.infer<typeof BorrowBookSchema>

registerCommand("borrow-book", async (data: Input) => {
  const validated = BorrowBookSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/library/${validated.libraryId}`,
        type: EventTypes.BOOK_BORROWED,
        data: {
          libraryId: validated.libraryId,
          bookId: validated.bookId,
          memberId: validated.memberId,
          borrowedAt: new Date().toISOString(),
          dueDate: validated.dueDate,
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

  console.log(`Book ${validated.bookId} borrowed by member ${validated.memberId}`)
})
