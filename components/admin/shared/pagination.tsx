import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

interface PaginationProps {
    total: number
    page: number
    limit: number
    baseUrl: string
    searchParams?: Record<string, string | undefined>
}

export function Pagination({ total, page, limit, baseUrl, searchParams = {} }: PaginationProps) {
    const totalPages = Math.ceil(total / limit)
    if (totalPages <= 1) return null

    const createUrl = (p: number) => {
        const params = new URLSearchParams()
        Object.entries(searchParams).forEach(([key, value]) => {
            if (value && value !== "all") params.set(key, value)
        })
        params.set("page", p.toString())
        params.set("limit", limit.toString())
        return `${baseUrl}?${params.toString()}`
    }

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = []
        const maxVisible = 5
        let start = Math.max(1, page - Math.floor(maxVisible / 2))
        let end = Math.min(totalPages, start + maxVisible - 1)

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1)
        }

        for (let i = start; i <= end; i++) {
            pages.push(i)
        }
        return pages
    }

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Showing {Math.min(total, (page - 1) * limit + 1)} to {Math.min(total, page * limit)} of {total} results
            </div>
            <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                    <Link href={createUrl(1)}>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1}>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={createUrl(page - 1)}>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page <= 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center space-x-1">
                    {getPageNumbers().map(p => (
                        <Link key={p} href={createUrl(p)}>
                            <Button
                                variant={p === page ? "default" : "outline"}
                                className="h-8 w-8 p-0"
                            >
                                {p}
                            </Button>
                        </Link>
                    ))}
                </div>

                <div className="flex items-center space-x-1">
                    <Link href={createUrl(page + 1)}>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={createUrl(totalPages)}>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages}>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
