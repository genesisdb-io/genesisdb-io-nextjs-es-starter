import { getClient, EventTypes } from "@/lib/genesisdb/client"

export interface Book {
  bookId: string
  isbn: string | null
  title: string
  author: string
  category: string
  status: "available" | "borrowed" | "reserved"
  borrowedBy: string | null
  borrowedAt: string | null
  dueDate: string | null
  reservedBy: string | null
  addedAt: string
}

export interface Member {
  memberId: string
  name: string
  email: string | null
  registeredAt: string
  currentLoans: string[] // bookIds
  loanHistory: Array<{ bookId: string; borrowedAt: string; returnedAt: string }>
}

export interface LibraryState {
  libraryId: string
  name: string
  address: string | null
  books: Book[]
  members: Member[]
  totalBooks: number
  availableBooks: number
  totalMembers: number
  createdAt: string
}

interface LibraryCreatedData {
  libraryId: string
  name: string
  address: string | null
  createdAt: string
}

interface BookAddedData {
  libraryId: string
  bookId: string
  isbn: string | null
  title: string
  author: string
  category: string
  addedAt: string
}

interface MemberRegisteredData {
  libraryId: string
  memberId: string
  name: string
  email: string | null
  registeredAt: string
}

interface BookBorrowedData {
  libraryId: string
  bookId: string
  memberId: string
  borrowedAt: string
  dueDate: string
}

interface BookReturnedData {
  libraryId: string
  bookId: string
  memberId: string
  returnedAt: string
}

interface BookReservedData {
  libraryId: string
  bookId: string
  memberId: string
  reservedAt: string
}

interface ReservationCancelledData {
  libraryId: string
  bookId: string
  memberId: string
  cancelledAt: string
}

export async function getLibraryState(libraryId: string): Promise<LibraryState | null> {
  const client = getClient()
  const events = await client.streamEvents(`/library/${libraryId}`)

  if (events.length === 0) {
    return null
  }

  const state: LibraryState = {
    libraryId,
    name: "",
    address: null,
    books: [],
    members: [],
    totalBooks: 0,
    availableBooks: 0,
    totalMembers: 0,
    createdAt: "",
  }

  for (const event of events) {
    const data = event.data as Record<string, unknown>

    switch (event.type) {
      case EventTypes.LIBRARY_CREATED: {
        const d = data as unknown as LibraryCreatedData
        state.name = d.name
        state.address = d.address
        state.createdAt = d.createdAt
        break
      }

      case EventTypes.BOOK_ADDED: {
        const d = data as unknown as BookAddedData
        state.books.push({
          bookId: d.bookId,
          isbn: d.isbn,
          title: d.title,
          author: d.author,
          category: d.category,
          status: "available",
          borrowedBy: null,
          borrowedAt: null,
          dueDate: null,
          reservedBy: null,
          addedAt: d.addedAt,
        })
        break
      }

      case EventTypes.MEMBER_REGISTERED: {
        const d = data as unknown as MemberRegisteredData
        state.members.push({
          memberId: d.memberId,
          name: d.name,
          email: d.email,
          registeredAt: d.registeredAt,
          currentLoans: [],
          loanHistory: [],
        })
        break
      }

      case EventTypes.BOOK_BORROWED: {
        const d = data as unknown as BookBorrowedData
        const book = state.books.find((b) => b.bookId === d.bookId)
        const member = state.members.find((m) => m.memberId === d.memberId)
        if (book) {
          book.status = "borrowed"
          book.borrowedBy = d.memberId
          book.borrowedAt = d.borrowedAt
          book.dueDate = d.dueDate
          book.reservedBy = null // Clear reservation if any
        }
        if (member) {
          member.currentLoans.push(d.bookId)
        }
        break
      }

      case EventTypes.BOOK_RETURNED: {
        const d = data as unknown as BookReturnedData
        const book = state.books.find((b) => b.bookId === d.bookId)
        const member = state.members.find((m) => m.memberId === d.memberId)
        if (book && member) {
          // Add to loan history
          member.loanHistory.push({
            bookId: d.bookId,
            borrowedAt: book.borrowedAt!,
            returnedAt: d.returnedAt,
          })
          // Remove from current loans
          member.currentLoans = member.currentLoans.filter((id) => id !== d.bookId)
          // Update book status
          book.status = book.reservedBy ? "reserved" : "available"
          book.borrowedBy = null
          book.borrowedAt = null
          book.dueDate = null
        }
        break
      }

      case EventTypes.BOOK_RESERVED: {
        const d = data as unknown as BookReservedData
        const book = state.books.find((b) => b.bookId === d.bookId)
        if (book && book.status === "borrowed") {
          book.reservedBy = d.memberId
        }
        break
      }

      case EventTypes.RESERVATION_CANCELLED: {
        const d = data as unknown as ReservationCancelledData
        const book = state.books.find((b) => b.bookId === d.bookId)
        if (book && book.reservedBy === d.memberId) {
          book.reservedBy = null
        }
        break
      }
    }
  }

  state.totalBooks = state.books.length
  state.availableBooks = state.books.filter((b) => b.status === "available").length
  state.totalMembers = state.members.length

  return state
}

export async function getAllLibraries(): Promise<LibraryState[]> {
  const client = getClient()

  const createdEvents = (await client.queryEvents(
    `STREAM e FROM events WHERE e.type == "${EventTypes.LIBRARY_CREATED}" ORDER BY e.time DESC MAP { libraryId: e.data.libraryId }`
  )) as Array<{ libraryId: string }>

  const libraries: LibraryState[] = []
  for (const event of createdEvents) {
    const libraryState = await getLibraryState(event.libraryId)
    if (libraryState) {
      libraries.push(libraryState)
    }
  }

  return libraries
}

export async function getLibraryHistory(libraryId: string) {
  const client = getClient()
  const events = await client.streamEvents(`/library/${libraryId}`)

  return events.map((event) => ({
    id: event.id,
    type: event.type,
    data: event.data,
    time: event.time,
  }))
}

// Helper to check if a book is overdue
export function isBookOverdue(book: Book): boolean {
  if (!book.dueDate || book.status !== "borrowed") return false
  return new Date(book.dueDate) < new Date()
}

// Get overdue books for a library
export function getOverdueBooks(state: LibraryState): Book[] {
  return state.books.filter(isBookOverdue)
}

// Get member's current loans with book details
export function getMemberLoans(state: LibraryState, memberId: string): Book[] {
  const member = state.members.find((m) => m.memberId === memberId)
  if (!member) return []
  return state.books.filter((b) => member.currentLoans.includes(b.bookId))
}
