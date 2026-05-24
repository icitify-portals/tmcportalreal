"use client"

import React, { useState } from 'react'
import { useRouter, usePathname } from "next/navigation"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function JurisdictionFilter({
    jurisdictions,
    currentId
}: {
    jurisdictions: any[],
    currentId?: string
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [open, setOpen] = useState(false)

    // Option structure: 'all' or org ID
    const currentValue = currentId || "all"
    const currentLabel = currentValue === "all" 
        ? "Consolidated View" 
        : jurisdictions.find(j => j.id === currentId)?.name || "Select Jurisdiction"

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <span className="truncate pr-2">{currentLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search jurisdiction..." />
                    <CommandList>
                        <CommandEmpty>No jurisdiction found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="all"
                                onSelect={() => {
                                    router.push(pathname)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        currentValue === "all" ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                Consolidated View
                            </CommandItem>
                            {jurisdictions.map((j) => (
                                <CommandItem
                                    key={j.id}
                                    value={j.name} // Search acts on this value by default
                                    onSelect={() => {
                                        router.push(`${pathname}?orgId=${j.id}`)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            currentValue === j.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {j.name} ({j.level})
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
