import { getClient, EventTypes } from "@/lib/genesisdb/client"

export interface Task {
  taskId: string
  title: string
  completed: boolean
  addedAt: string
  completedAt: string | null
}

export interface TodoListState {
  listId: string
  name: string
  tasks: Task[]
  totalTasks: number
  completedTasks: number
  status: "active" | "archived"
  createdAt: string
}

interface ListCreatedData {
  listId: string
  name: string
  createdAt: string
}

interface TaskAddedData {
  listId: string
  taskId: string
  title: string
  addedAt: string
}

interface TaskCompletedData {
  listId: string
  taskId: string
  completedAt: string
}

interface TaskUncompletedData {
  listId: string
  taskId: string
  uncompletedAt: string
}

interface TaskDeletedData {
  listId: string
  taskId: string
  deletedAt: string
}

interface TaskRenamedData {
  listId: string
  taskId: string
  title: string
  renamedAt: string
}

export async function getTodoListState(listId: string): Promise<TodoListState | null> {
  const client = getClient()
  const events = await client.streamEvents(`/todo/${listId}`)

  if (events.length === 0) {
    return null
  }

  const state: TodoListState = {
    listId,
    name: "",
    tasks: [],
    totalTasks: 0,
    completedTasks: 0,
    status: "active",
    createdAt: "",
  }

  for (const event of events) {
    const data = event.data as Record<string, unknown>

    switch (event.type) {
      case EventTypes.LIST_CREATED: {
        const d = data as unknown as ListCreatedData
        state.name = d.name
        state.createdAt = d.createdAt
        break
      }

      case EventTypes.TASK_ADDED: {
        const d = data as unknown as TaskAddedData
        state.tasks.push({
          taskId: d.taskId,
          title: d.title,
          completed: false,
          addedAt: d.addedAt,
          completedAt: null,
        })
        break
      }

      case EventTypes.TASK_COMPLETED: {
        const d = data as unknown as TaskCompletedData
        const task = state.tasks.find((t) => t.taskId === d.taskId)
        if (task) {
          task.completed = true
          task.completedAt = d.completedAt
        }
        break
      }

      case EventTypes.TASK_UNCOMPLETED: {
        const d = data as unknown as TaskUncompletedData
        const task = state.tasks.find((t) => t.taskId === d.taskId)
        if (task) {
          task.completed = false
          task.completedAt = null
        }
        break
      }

      case EventTypes.TASK_DELETED: {
        const d = data as unknown as TaskDeletedData
        state.tasks = state.tasks.filter((t) => t.taskId !== d.taskId)
        break
      }

      case EventTypes.TASK_RENAMED: {
        const d = data as unknown as TaskRenamedData
        const task = state.tasks.find((t) => t.taskId === d.taskId)
        if (task) {
          task.title = d.title
        }
        break
      }

      case EventTypes.LIST_ARCHIVED: {
        state.status = "archived"
        break
      }
    }
  }

  state.totalTasks = state.tasks.length
  state.completedTasks = state.tasks.filter((t) => t.completed).length

  return state
}

export async function getAllTodoLists(): Promise<TodoListState[]> {
  const client = getClient()

  const createdEvents = await client.queryEvents(
    `STREAM e FROM events WHERE e.type == "${EventTypes.LIST_CREATED}" ORDER BY e.time DESC MAP { listId: e.data.listId }`
  ) as Array<{ listId: string }>

  const lists: TodoListState[] = []
  for (const event of createdEvents) {
    const listState = await getTodoListState(event.listId)
    if (listState) {
      lists.push(listState)
    }
  }

  return lists
}

export async function getTodoListHistory(listId: string) {
  const client = getClient()
  const events = await client.streamEvents(`/todo/${listId}`)

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    data: event.data,
    time: event.time,
  }))
}
