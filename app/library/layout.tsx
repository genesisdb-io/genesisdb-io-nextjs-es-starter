import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="border-b bg-card px-8">
        <div className="max-w-6xl mx-auto py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to demos
          </Link>
          <span className="text-muted-foreground">|</span>
          <span className="font-medium">Library System Demo</span>
        </div>
      </div>
      {children}
    </div>
  )
}
