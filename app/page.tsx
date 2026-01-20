"use client"

import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, ListTodo, BookOpen, Package } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image src="/gdb.png" alt="GenesisDB" width={80} height={80} className="rounded-lg" />
          </div>
          <h1 className="text-4xl font-bold">GenesisDB Event Sourcing Demo</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore event sourcing patterns with GenesisDB. Select a demo below to see how events
            become the single source of truth for application state.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Link
            href="/cart"
            className="group bg-card rounded-lg border p-8 text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <ShoppingCart className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Shopping Cart</h2>
            </div>
            <p className="text-muted-foreground">
              A complete shopping cart with add/remove items, quantity changes, and checkout.
              See how cart state is projected from immutable events.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-muted px-2 py-1 rounded">cart-created</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">item-added</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">item-removed</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">cart-checked-out</span>
            </div>
          </Link>

          <Link
            href="/todo"
            className="group bg-card rounded-lg border p-8 text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <ListTodo className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Todo List</h2>
            </div>
            <p className="text-muted-foreground">
              A task management system with create, complete, and delete operations.
              Watch the full event history as you manage your tasks.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-muted px-2 py-1 rounded">list-created</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">task-added</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">task-completed</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">task-deleted</span>
            </div>
          </Link>

          <Link
            href="/library"
            className="group bg-card rounded-lg border p-8 text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Library System</h2>
            </div>
            <p className="text-muted-foreground">
              A book borrowing system with members, loans, and returns.
              Track the complete history of every book in the catalog.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-muted px-2 py-1 rounded">book-added</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">member-registered</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">book-borrowed</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">book-returned</span>
            </div>
          </Link>

          <Link
            href="/inventory"
            className="group bg-card rounded-lg border p-8 text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Inventory Tracker</h2>
            </div>
            <p className="text-muted-foreground">
              A warehouse stock management system with receiving, selling, and adjustments.
              Track every stock movement with full audit trail.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-muted px-2 py-1 rounded">product-added</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">stock-received</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">stock-sold</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">stock-adjusted</span>
            </div>
          </Link>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-4">
          <h3 className="font-semibold text-lg">What is Event Sourcing?</h3>
          <div className="text-muted-foreground space-y-3">
            <p>
              Instead of storing only the current state, event sourcing stores <strong>all events</strong> that 
              led to that state. The current state is derived by replaying these events.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <p className="font-medium text-foreground">Benefits</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Complete audit trail</li>
                  <li>Time travel and replay</li>
                  <li>Debug production issues</li>
                  <li>Build multiple projections</li>
                </ul>
              </div>
              <div className="space-y-2">
                <p className="font-medium text-foreground">GenesisDB Features</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>CloudEvents compatible</li>
                  <li>Preconditions for consistency</li>
                  <li>GDBQL query language</li>
                  <li>GDPR-ready data erasure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
