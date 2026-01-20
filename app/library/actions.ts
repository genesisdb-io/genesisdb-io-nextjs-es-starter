"use server"

import { v4 as uuid } from "uuid"
import { dispatchCommand } from "@/lib/cqrs"
import {
  getLibraryState,
  getAllLibraries,
  getLibraryHistory,
  type LibraryState,
} from "@/lib/projections/library"
import "@/commands/library"

export async function createLibrary(name: string, address?: string): Promise<{ libraryId: string }> {
  const libraryId = uuid()

  await dispatchCommand({
    type: "create-library",
    data: { libraryId, name, address },
  })

  return { libraryId }
}

export async function addBook(
  libraryId: string,
  book: { title: string; author: string; isbn?: string; category?: string }
): Promise<{ bookId: string }> {
  const bookId = uuid()

  await dispatchCommand({
    type: "add-book",
    data: {
      libraryId,
      bookId,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      category: book.category,
    },
  })

  return { bookId }
}

export async function registerMember(
  libraryId: string,
  member: { name: string; email?: string }
): Promise<{ memberId: string }> {
  const memberId = uuid()

  await dispatchCommand({
    type: "register-member",
    data: {
      libraryId,
      memberId,
      name: member.name,
      email: member.email,
    },
  })

  return { memberId }
}

export async function borrowBook(libraryId: string, bookId: string, memberId: string) {
  // Default loan period: 14 days
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 14)

  await dispatchCommand({
    type: "borrow-book",
    data: {
      libraryId,
      bookId,
      memberId,
      dueDate: dueDate.toISOString(),
    },
  })
}

export async function returnBook(libraryId: string, bookId: string, memberId: string) {
  await dispatchCommand({
    type: "return-book",
    data: { libraryId, bookId, memberId },
  })
}

export async function reserveBook(libraryId: string, bookId: string, memberId: string) {
  await dispatchCommand({
    type: "reserve-book",
    data: { libraryId, bookId, memberId },
  })
}

export async function cancelReservation(libraryId: string, bookId: string, memberId: string) {
  await dispatchCommand({
    type: "cancel-reservation",
    data: { libraryId, bookId, memberId },
  })
}

export async function fetchLibrary(libraryId: string): Promise<LibraryState | null> {
  return getLibraryState(libraryId)
}

export async function fetchAllLibraries(): Promise<LibraryState[]> {
  return getAllLibraries()
}

export async function fetchLibraryHistory(libraryId: string) {
  return getLibraryHistory(libraryId)
}
