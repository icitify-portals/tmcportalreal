"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { locationData } from "@/lib/location-data"
import { Search, Loader2 } from "lucide-react"
import Link from "next/link"

interface MemberSearchFiltersProps {
  initialSearch?: string
  initialState?: string
  initialLga?: string
  initialBranch?: string
}

export function MemberSearchFilters({
  initialSearch = "",
  initialState = "all",
  initialLga = "all",
  initialBranch = "",
}: MemberSearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch)
  const [state, setState] = useState(initialState || "all")
  const [lga, setLga] = useState(initialLga || "all")
  const [branch, setBranch] = useState(initialBranch)

  // Keep state in sync with URL searchParams if changed outside
  useEffect(() => {
    setSearch(initialSearch || "")
  }, [initialSearch])

  const applyFilters = (newParams: { search?: string; state?: string; lga?: string; branch?: string }) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    
    // Page reset to 1 when filters change
    params.set("page", "1")

    const nextSearch = newParams.search !== undefined ? newParams.search : search
    const nextState = newParams.state !== undefined ? newParams.state : state
    const nextLga = newParams.lga !== undefined ? newParams.lga : lga
    const nextBranch = newParams.branch !== undefined ? newParams.branch : branch

    if (nextSearch && nextSearch.trim().length >= 3) {
      params.set("search", nextSearch.trim())
    } else {
      params.delete("search")
    }

    if (nextState && nextState !== "all") {
      params.set("state", nextState)
    } else {
      params.delete("state")
    }

    if (nextLga && nextLga !== "all") {
      params.set("lga", nextLga)
    } else {
      params.delete("lga")
    }

    if (nextBranch && nextBranch.trim()) {
      params.set("branch", nextBranch.trim())
    } else {
      params.delete("branch")
    }

    startTransition(() => {
      router.push(`/dashboard/admin/members?${params.toString()}`)
    })
  }

  // Live search debounce effect: triggers automatically once at least 3 characters are typed or when cleared
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== initialSearch) {
        if (search.trim().length >= 3 || search.trim().length === 0) {
          applyFilters({ search })
        }
      }
    }, 400)

    return () => clearTimeout(handler)
  }, [search])

  const handleStateChange = (val: string) => {
    setState(val)
    setLga("all")
    applyFilters({ state: val, lga: "all" })
  }

  const handleLgaChange = (val: string) => {
    setLga(val)
    applyFilters({ lga: val })
  }

  const handleBranchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      applyFilters({ branch })
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters({ search, state, lga, branch })
  }

  const hasActiveFilters = Boolean(
    (search && search.trim().length > 0) ||
    (state && state !== "all") ||
    (lga && lga !== "all") ||
    (branch && branch.trim().length > 0)
  )

  return (
    <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Live Search (3+ letters)</Label>
          {isPending && <Loader2 className="h-3 w-3 animate-spin text-green-600" />}
        </div>
        <div className="relative">
          <Input
            name="search"
            placeholder="Type 'ADE' to search names/emails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white pr-8"
          />
          <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">State</Label>
        <Select value={state} onValueChange={handleStateChange}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {Object.keys(locationData).map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">LGA</Label>
        <Select value={lga} onValueChange={handleLgaChange} disabled={!state || state === "all"}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="All LGAs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All LGAs</SelectItem>
            {state && state !== "all" && (locationData as any)[state]?.lgas.map((l: any) => (
              <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Branch Keyword</Label>
        <Input
          name="branch"
          placeholder="Filter branch..."
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          onKeyDown={handleBranchKeyDown}
          onBlur={() => applyFilters({ branch })}
          className="bg-white"
        />
      </div>

      <div className="flex items-end gap-2">
        <Button type="submit" disabled={isPending} className="flex-1 bg-green-700 hover:bg-green-800 text-white">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Filter
        </Button>
        {hasActiveFilters && (
          <Link href="/dashboard/admin/members">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setSearch("")
                setState("all")
                setLga("all")
                setBranch("")
              }}
            >
              Reset
            </Button>
          </Link>
        )}
      </div>
    </form>
  )
}
