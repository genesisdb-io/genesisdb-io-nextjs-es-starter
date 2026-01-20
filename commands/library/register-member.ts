import { z } from "zod"
import { registerCommand } from "@/lib/cqrs"
import { getClient, EVENT_SOURCE, EventTypes } from "@/lib/genesisdb/client"

export const RegisterMemberSchema = z.object({
  libraryId: z.string().uuid(),
  memberId: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
})

type Input = z.infer<typeof RegisterMemberSchema>

registerCommand("register-member", async (data: Input) => {
  const validated = RegisterMemberSchema.parse(data)
  const client = getClient()

  await client.commitEvents(
    [
      {
        source: EVENT_SOURCE,
        subject: `/library/${validated.libraryId}`,
        type: EventTypes.MEMBER_REGISTERED,
        data: {
          libraryId: validated.libraryId,
          memberId: validated.memberId,
          name: validated.name,
          email: validated.email ?? null,
          registeredAt: new Date().toISOString(),
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

  console.log(`Member registered: ${validated.name}`)
})
