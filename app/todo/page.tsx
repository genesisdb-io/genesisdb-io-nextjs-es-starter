"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { ListTodo, ScrollText, Lightbulb, Plus, Trash2, Check, Circle, FolderOpen, SquarePen } from "lucide-react"
import {
  createList,
  addTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  fetchList,
  fetchAllLists,
  fetchListHistory,
} from "./actions"
import type { TodoListState } from "@/lib/projections/todo"

export default function TodoDemo() {
  const [isPending, startTransition] = useTransition()
  const [currentListId, setCurrentListId] = useState<string | null>(null)
  const [list, setList] = useState<TodoListState | null>(null)
  const [allLists, setAllLists] = useState<TodoListState[]>([])
  const [history, setHistory] = useState<Array<{ id: string; type: string; data: unknown; time: string | undefined }>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [newListName, setNewListName] = useState("")
  const [newTaskTitle, setNewTaskTitle] = useState("")

  useEffect(() => {
    if (currentListId) {
      startTransition(async () => {
        const listState = await fetchList(currentListId)
        setList(listState)
        const listHistory = await fetchListHistory(currentListId)
        setHistory(listHistory)
      })
    }
  }, [currentListId])

  useEffect(() => {
    startTransition(async () => {
      const lists = await fetchAllLists()
      setAllLists(lists)
    })
  }, [])

  const refreshData = async () => {
    const lists = await fetchAllLists()
    setAllLists(lists)
    if (currentListId) {
      const listState = await fetchList(currentListId)
      setList(listState)
      const listHistory = await fetchListHistory(currentListId)
      setHistory(listHistory)
    }
  }

  const handleCreateList = () => {
    if (!newListName.trim()) return
    startTransition(async () => {
      const { listId } = await createList(newListName.trim())
      setNewListName("")
      setCurrentListId(listId)
      await refreshData()
    })
  }

  const handleAddTask = () => {
    if (!currentListId || !newTaskTitle.trim()) return
    startTransition(async () => {
      await addTask(currentListId, newTaskTitle.trim())
      setNewTaskTitle("")
      await refreshData()
    })
  }

  const handleToggleTask = (taskId: string, completed: boolean) => {
    if (!currentListId) return
    startTransition(async () => {
      if (completed) {
        await uncompleteTask(currentListId, taskId)
      } else {
        await completeTask(currentListId, taskId)
      }
      await refreshData()
    })
  }

  const handleDeleteTask = (taskId: string) => {
    if (!currentListId) return
    startTransition(async () => {
      await deleteTask(currentListId, taskId)
      await refreshData()
    })
  }

  const formatEventType = (type: string) => {
    return type.replace("io.genesisdb.demo.", "")
  }

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Todo List Demo</h1>
          <p className="text-muted-foreground">
            A task manager demonstrating event sourcing patterns with GenesisDB
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Todo Lists</h2>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                  placeholder="New list name..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                  disabled={isPending}
                />
                <Button size="sm" onClick={handleCreateList} disabled={isPending || !newListName.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {allLists.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No lists yet. Create one above.</p>
              ) : (
                <div className="space-y-2">
                  {allLists.map((l) => (
                    <button
                      key={l.listId}
                      onClick={() => setCurrentListId(l.listId)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        l.listId === currentListId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <p className="font-medium truncate">{l.name}</p>
                      <p className="text-sm opacity-80">
                        {l.completedTasks}/{l.totalTasks} tasks completed
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Tasks</h2>
              </div>

              {!list ? (
                <p className="text-muted-foreground text-center py-8">Select or create a list</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{list.name}</p>
                    <span className="text-sm text-muted-foreground">
                      {list.completedTasks}/{list.totalTasks}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                      placeholder="Add a task..."
                      className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                      disabled={isPending}
                    />
                    <Button size="sm" onClick={handleAddTask} disabled={isPending || !newTaskTitle.trim()}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  {list.tasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No tasks yet</p>
                  ) : (
                    <div className="space-y-2">
                      {list.tasks.map((task) => (
                        <div
                          key={task.taskId}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            task.completed ? "bg-muted/30" : "bg-muted/50"
                          }`}
                        >
                          <button
                            onClick={() => handleToggleTask(task.taskId, task.completed)}
                            disabled={isPending}
                            className="flex-shrink-0"
                          >
                            {task.completed ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                          <span
                            className={`flex-1 ${
                              task.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleDeleteTask(task.taskId)}
                            disabled={isPending}
                          >
                            <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {list.totalTasks > 0 && (
                    <div className="pt-2 border-t">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${(list.completedTasks / list.totalTasks) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ScrollText className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Event History</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? "Hide" : "Show"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Every action is stored as an event. The task list is rebuilt by replaying these events.
              </p>

              {showHistory && history.length > 0 && (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {history.map((event, index) => (
                    <div key={event.id} className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {formatEventType(event.type)}
                        </span>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {event.time ? new Date(event.time).toLocaleString() : "N/A"}
                      </p>
                      <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {showHistory && history.length === 0 && (
                <p className="text-muted-foreground text-sm">No events yet</p>
              )}

              {!showHistory && history.length > 0 && (
                <p className="text-muted-foreground text-sm">{history.length} events recorded</p>
              )}
            </div>

            <div className="bg-card rounded-lg border p-4 mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                <h3 className="font-semibold">Event Sourcing in Action</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Notice how each action creates a new event. The task list state is <strong>projected</strong> from
                  these events, not stored directly.
                </p>
                <p>
                  <strong>Try this:</strong> Complete a task, then look at the event history. You&apos;ll see a{" "}
                  <code className="bg-muted px-1 rounded">task-completed</code> event was added.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
