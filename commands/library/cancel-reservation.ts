import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const CancelReservationSchema = z.object({
  libraryId: z.string().uuid(),
  bookId: z.string().uuid(),
  memberId: z.string().uuid(),
})

type Input = z.infer<typeof CancelReservationSchema>

registerCommand("cancel-reservation", async (data: Input) => {
  const validated = CancelReservationSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/library/${validated.libraryId}`,
        type: EventTypes.RESERVATION_CANCELLED,
        data: {
          libraryId: validated.libraryId,
          bookId: validated.bookId,
          memberId: validated.memberId,
          cancelledAt: new Date().toISOString(),
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

  console.log(`Reservation cancelled for book ${validated.bookId} by member ${validated.memberId}`)
})
