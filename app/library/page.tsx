"use client"

import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Library,
  BookOpen,
  Users,
  ScrollText,
  Lightbulb,
  Plus,
  BookMarked,
  UserPlus,
  RotateCcw,
  Clock,
  AlertTriangle,
} from "lucide-react"
import {
  createLibrary,
  addBook,
  registerMember,
  borrowBook,
  returnBook,
  fetchLibrary,
  fetchAllLibraries,
  fetchLibraryHistory,
} from "./actions"
import type { LibraryState, Book, Member } from "@/lib/projections/library"

const SAMPLE_BOOKS = [
  { title: "The Pragmatic Programmer", author: "David Thomas & Andrew Hunt", category: "Technology" },
  { title: "Clean Code", author: "Robert C. Martin", category: "Technology" },
  { title: "1984", author: "George Orwell", category: "Fiction" },
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", category: "Fiction" },
  { title: "Sapiens", author: "Yuval Noah Harari", category: "Non-Fiction" },
]

export default function LibraryDemo() {
  const [isPending, startTransition] = useTransition()
  const [currentLibraryId, setCurrentLibraryId] = useState<string | null>(null)
  const [library, setLibrary] = useState<LibraryState | null>(null)
  const [allLibraries, setAllLibraries] = useState<LibraryState[]>([])
  const [history, setHistory] = useState<Array<{ id: string; type: string; data: unknown; time: string | undefined }>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [newLibraryName, setNewLibraryName] = useState("")
  const [newMemberName, setNewMemberName] = useState("")
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"books" | "members">("books")

  useEffect(() => {
    if (currentLibraryId) {
      startTransition(async () => {
        const libraryState = await fetchLibrary(currentLibraryId)
        setLibrary(libraryState)
        const libraryHistory = await fetchLibraryHistory(currentLibraryId)
        setHistory(libraryHistory)
      })
    }
  }, [currentLibraryId])

  useEffect(() => {
    startTransition(async () => {
      const libraries = await fetchAllLibraries()
      setAllLibraries(libraries)
    })
  }, [])

  const refreshData = async () => {
    const libraries = await fetchAllLibraries()
    setAllLibraries(libraries)
    if (currentLibraryId) {
      const libraryState = await fetchLibrary(currentLibraryId)
      setLibrary(libraryState)
      const libraryHistory = await fetchLibraryHistory(currentLibraryId)
      setHistory(libraryHistory)
    }
  }

  const handleCreateLibrary = () => {
    if (!newLibraryName.trim()) return
    startTransition(async () => {
      const { libraryId } = await createLibrary(newLibraryName.trim())
      setNewLibraryName("")
      setCurrentLibraryId(libraryId)
      await refreshData()
    })
  }

  const handleAddBook = (book: (typeof SAMPLE_BOOKS)[0]) => {
    if (!currentLibraryId) return
    startTransition(async () => {
      await addBook(currentLibraryId, book)
      await refreshData()
    })
  }

  const handleRegisterMember = () => {
    if (!currentLibraryId || !newMemberName.trim()) return
    startTransition(async () => {
      const { memberId } = await registerMember(currentLibraryId, { name: newMemberName.trim() })
      setNewMemberName("")
      setSelectedMemberId(memberId)
      await refreshData()
    })
  }

  const handleBorrowBook = (bookId: string) => {
    if (!currentLibraryId || !selectedMemberId) return
    startTransition(async () => {
      await borrowBook(currentLibraryId, bookId, selectedMemberId)
      await refreshData()
    })
  }

  const handleReturnBook = (bookId: string, memberId: string) => {
    if (!currentLibraryId) return
    startTransition(async () => {
      await returnBook(currentLibraryId, bookId, memberId)
      await refreshData()
    })
  }

  const formatEventType = (type: string) => {
    return type.replace("io.genesisdb.demo.", "")
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const isOverdue = (book: Book) => {
    if (!book.dueDate || book.status !== "borrowed") return false
    return new Date(book.dueDate) < new Date()
  }

  const getMemberName = (memberId: string) => {
    return library?.members.find((m) => m.memberId === memberId)?.name ?? "Unknown"
  }

  const selectedMember = library?.members.find((m) => m.memberId === selectedMemberId)

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Library Book Borrowing System</h1>
          <p className="text-muted-foreground">
            A library management system demonstrating event sourcing with GenesisDB
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Library Selection & Add Books */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Library className="w-5 h-5" />
                <h2 className="text-xl font-semibold">Libraries</h2>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLibraryName}
                  onChange={(e) => setNewLibraryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateLibrary()}
                  placeholder="New library name..."
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                  disabled={isPending}
                />
                <Button size="sm" onClick={handleCreateLibrary} disabled={isPending || !newLibraryName.trim()}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {allLibraries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No libraries yet</p>
              ) : (
                <div className="space-y-2">
                  {allLibraries.map((lib) => (
                    <button
                      key={lib.libraryId}
                      onClick={() => {
                        setCurrentLibraryId(lib.libraryId)
                        setSelectedMemberId(null)
                      }}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        lib.libraryId === currentLibraryId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                    >
                      <p className="font-medium">{lib.name}</p>
                      <p className="text-sm opacity-80">
                        {lib.totalBooks} books · {lib.totalMembers} members
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add Sample Books */}
            {library && (
              <div className="bg-card rounded-lg border p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  <h2 className="text-xl font-semibold">Add Books</h2>
                </div>
                <div className="space-y-2">
                  {SAMPLE_BOOKS.map((book, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="text-sm">
                        <p className="font-medium">{book.title}</p>
                        <p className="text-muted-foreground">{book.author}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleAddBook(book)} disabled={isPending}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Books & Members */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg border p-4 space-y-4">
              {!library ? (
                <p className="text-muted-foreground text-center py-8">Select or create a library</p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">{library.name}</h2>
                    <span className="text-sm text-muted-foreground">
                      {library.availableBooks}/{library.totalBooks} available
                    </span>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b">
                    <button
                      onClick={() => setActiveTab("books")}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "books"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      Books
                    </button>
                    <button
                      onClick={() => setActiveTab("members")}
                      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "members"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      Members
                    </button>
                  </div>

                  {/* Books Tab */}
                  {activeTab === "books" && (
                    <div className="space-y-3">
                      {library.books.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No books in catalog</p>
                      ) : (
                        library.books.map((book) => (
                          <div
                            key={book.bookId}
                            className={`p-3 rounded-lg ${
                              isOverdue(book) ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{book.title}</p>
                                <p className="text-sm text-muted-foreground">{book.author}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {book.status === "available" && (
                                    <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded">
                                      Available
                                    </span>
                                  )}
                                  {book.status === "borrowed" && (
                                    <span className="text-xs bg-orange-500/20 text-orange-600 px-2 py-0.5 rounded flex items-center gap-1">
                                      <BookMarked className="w-3 h-3" />
                                      {getMemberName(book.borrowedBy!)}
                                    </span>
                                  )}
                                  {isOverdue(book) && (
                                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" />
                                      Overdue
                                    </span>
                                  )}
                                  {book.dueDate && book.status === "borrowed" && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Due: {formatDate(book.dueDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                {book.status === "available" && selectedMemberId && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleBorrowBook(book.bookId)}
                                    disabled={isPending}
                                  >
                                    Borrow
                                  </Button>
                                )}
                                {book.status === "borrowed" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleReturnBook(book.bookId, book.borrowedBy!)}
                                    disabled={isPending}
                                  >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Return
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      {!selectedMemberId && library.books.some((b) => b.status === "available") && (
                        <p className="text-sm text-muted-foreground text-center">
                          Select a member to borrow books
                        </p>
                      )}
                    </div>
                  )}

                  {/* Members Tab */}
                  {activeTab === "members" && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleRegisterMember()}
                          placeholder="Register new member..."
                          className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                          disabled={isPending}
                        />
                        <Button
                          size="sm"
                          onClick={handleRegisterMember}
                          disabled={isPending || !newMemberName.trim()}
                        >
                          <UserPlus className="w-4 h-4" />
                        </Button>
                      </div>

                      {library.members.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No members registered</p>
                      ) : (
                        library.members.map((member) => (
                          <button
                            key={member.memberId}
                            onClick={() => setSelectedMemberId(member.memberId)}
                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                              member.memberId === selectedMemberId
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 hover:bg-muted"
                            }`}
                          >
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm opacity-80">
                              {member.currentLoans.length} books borrowed ·{" "}
                              {member.loanHistory.length} returned
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Selected Member Info */}
            {selectedMember && (
              <div className="bg-card rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <h3 className="font-semibold">Active Member</h3>
                </div>
                <div>
                  <p className="font-medium">{selectedMember.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since {formatDate(selectedMember.registeredAt)}
                  </p>
                </div>
                {selectedMember.currentLoans.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Current Loans:</p>
                    <div className="space-y-1">
                      {selectedMember.currentLoans.map((bookId) => {
                        const book = library?.books.find((b) => b.bookId === bookId)
                        return book ? (
                          <p key={bookId} className="text-sm text-muted-foreground">
                            • {book.title}
                          </p>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Event History */}
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
                Every borrow and return is recorded as an immutable event. The library state is projected from these events.
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
                <h3 className="font-semibold">Why Event Sourcing for Libraries?</h3>
              </div>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  A library system benefits greatly from event sourcing:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Complete borrowing history for each book</li>
                  <li>Audit trail for lost or damaged books</li>
                  <li>Track member reading patterns over time</li>
                  <li>Easy to add late fee calculations</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
