import { dispatchCommand } from "@/lib/cqrs"
import "@/commands"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    if (!body?.type || !body?.data) {
      return new Response("Missing 'type' or 'data'", { status: 400 })
    }

    await dispatchCommand(body)
    return new Response("Command executed", { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Command error:", message)
    return new Response(`Error: ${message}`, { status: 400 })
  }
}
