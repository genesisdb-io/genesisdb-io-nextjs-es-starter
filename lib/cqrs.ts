type CommandHandler<T = unknown> = (data: T) => Promise<void>

const commandRegistry = new Map<string, CommandHandler>()

export function registerCommand<T>(type: string, handler: CommandHandler<T>) {
  if (commandRegistry.has(type)) {
    console.warn(`Command "${type}" is already registered. Overwriting.`)
  }
  commandRegistry.set(type, handler as CommandHandler)
}

export async function dispatchCommand(command: { type: string; data: unknown }) {
  const handler = commandRegistry.get(command.type)
  if (!handler) {
    throw new Error(`No handler registered for command type: ${command.type}`)
  }
  await handler(command.data)
}

export function getRegisteredCommands(): string[] {
  return Array.from(commandRegistry.keys())
}
