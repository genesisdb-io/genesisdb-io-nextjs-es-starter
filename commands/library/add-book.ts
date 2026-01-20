import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const AddBookSchema = z.object({
  libraryId: z.string().uuid(),
  bookId: z.string().uuid(),
  isbn: z.string().optional(),
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  category: z.string().optional(),
})

type Input = z.infer<typeof AddBookSchema>

registerCommand("add-book", async (data: Input) => {
  const validated = AddBookSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/library/${validated.libraryId}`,
        type: EventTypes.BOOK_ADDED,
        data: {
          libraryId: validated.libraryId,
          bookId: validated.bookId,
          isbn: validated.isbn ?? null,
          title: validated.title,
          author: validated.author,
          category: validated.category ?? "General",
          addedAt: new Date().toISOString(),
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

  console.log(`Book added: ${validated.title} by ${validated.author}`)
})
