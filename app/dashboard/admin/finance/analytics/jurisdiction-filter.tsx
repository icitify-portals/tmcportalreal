"use client"

import React, { useState, useMemo } from 'react'
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

    // 1. Build a map for quick lookups
    const orgMap = useMemo(() => {
        const map = new Map()
        jurisdictions.forEach(j => map.set(j.id, j))
        return map
    }, [jurisdictions])

    // 2. Figure out the current selection hierarchy
    let selectedState: string | null = null
    let selectedLGA: string | null = null
    let selectedBranch: string | null = null

    if (currentId && orgMap.has(currentId)) {
        let current = orgMap.get(currentId)
        if (current.level === 'STATE' || current.level === 'NATIONAL' || current.level === 'SYSTEM') {
            selectedState = current.id
        } else if (current.level === 'LOCAL_GOVERNMENT') {
            selectedLGA = current.id
            selectedState = current.parentId
        } else if (current.level === 'BRANCH') {
            selectedBranch = current.id
            selectedLGA = current.parentId
            if (selectedLGA && orgMap.has(selectedLGA)) {
                selectedState = orgMap.get(selectedLGA).parentId
            }
        }
    }

    // 3. Filter options for each dropdown
    const statesAndNational = useMemo(() => {
        return jurisdictions.filter(j => j.level === 'STATE' || j.level === 'NATIONAL' || j.level === 'SYSTEM')
    }, [jurisdictions])

    const lgasForState = useMemo(() => {
        if (!selectedState) return []
        return jurisdictions.filter(j => j.level === 'LOCAL_GOVERNMENT' && j.parentId === selectedState)
    }, [jurisdictions, selectedState])

    const branchesForLga = useMemo(() => {
        if (!selectedLGA) return []
        return jurisdictions.filter(j => j.level === 'BRANCH' && j.parentId === selectedLGA)
    }, [jurisdictions, selectedLGA])

    // The action to perform when a selection changes
    const handleSelect = (id: string | null) => {
        if (id) {
            router.push(`${pathname}?orgId=${id}`)
        } else {
            router.push(pathname)
        }
    }

    return (
        <div className="flex flex-col gap-2 w-full">
            {/* Level 1: State / National */}
            <DropdownSelector 
                options={statesAndNational} 
                value={selectedState} 
                placeholder="Consolidated View (Select State)" 
                onSelect={(val) => handleSelect(val)} 
            />

            {/* Level 2: LGA */}
            {selectedState && lgasForState.length > 0 && (
                <DropdownSelector 
                    options={lgasForState} 
                    value={selectedLGA} 
                    placeholder="All Local Governments (Select LGA)" 
                    onSelect={(val) => handleSelect(val || selectedState)} // if cleared, fallback to state
                />
            )}

            {/* Level 3: Branch */}
            {selectedLGA && branchesForLga.length > 0 && (
                <DropdownSelector 
                    options={branchesForLga} 
                    value={selectedBranch} 
                    placeholder="All Branches (Select Branch)" 
                    onSelect={(val) => handleSelect(val || selectedLGA)} // if cleared, fallback to LGA
                />
            )}
        </div>
    )
}

function DropdownSelector({
    options,
    value,
    placeholder,
    onSelect
}: {
    options: any[],
    value: string | null,
    placeholder: string,
    onSelect: (val: string | null) => void
}) {
    const [open, setOpen] = useState(false)
    const selectedOption = options.find(o => o.id === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <span className="truncate pr-2">
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="all_or_clear"
                                onSelect={() => {
                                    onSelect(null)
                                    setOpen(false)
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        !value ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                {placeholder}
                            </CommandItem>
                            {options.map((opt) => (
                                <CommandItem
                                    key={opt.id}
                                    value={opt.name}
                                    onSelect={() => {
                                        onSelect(opt.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === opt.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {opt.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
