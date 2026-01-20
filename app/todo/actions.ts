"use server"

import { v4 as uuid } from "uuid"
import { dispatchCommand } from "@/lib/cqrs"
import { getTodoListState, getAllTodoLists, getTodoListHistory, type TodoListState } from "@/lib/projections/todo"
import "@/commands/todo"

export async function createList(name: string): Promise<{ listId: string }> {
  const listId = uuid()

  await dispatchCommand({
    type: "create-list",
    data: { listId, name },
  })

  return { listId }
}

export async function addTask(listId: string, title: string): Promise<{ taskId: string }> {
  const taskId = uuid()

  await dispatchCommand({
    type: "add-task",
    data: { listId, taskId, title },
  })

  return { taskId }
}

export async function completeTask(listId: string, taskId: string) {
  await dispatchCommand({
    type: "complete-task",
    data: { listId, taskId },
  })
}

export async function uncompleteTask(listId: string, taskId: string) {
  await dispatchCommand({
    type: "uncomplete-task",
    data: { listId, taskId },
  })
}

export async function deleteTask(listId: string, taskId: string) {
  await dispatchCommand({
    type: "delete-task",
    data: { listId, taskId },
  })
}

export async function renameTask(listId: string, taskId: string, title: string) {
  await dispatchCommand({
    type: "rename-task",
    data: { listId, taskId, title },
  })
}

export async function fetchList(listId: string): Promise<TodoListState | null> {
  return getTodoListState(listId)
}

export async function fetchAllLists(): Promise<TodoListState[]> {
  return getAllTodoLists()
}

export async function fetchListHistory(listId: string) {
  return getTodoListHistory(listId)
}
