"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Moon, Sun, Monitor, Check } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return <Button variant="outline" size="icon" disabled><Sun className="h-[1.2rem] w-[1.2rem]" /></Button>
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("green")}>
                    <div className="mr-2 h-4 w-4 rounded-full bg-green-600" />
                    Green
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

const themes = [
    { name: "green", label: "Green", color: "bg-green-600" },
    { name: "violet", label: "Violet", color: "bg-violet-600" },
    { name: "blue", label: "Blue", color: "bg-blue-600" },
    { name: "orange", label: "Orange", color: "bg-orange-600" },
]

export function ColorSwitcher() {
    const { theme, setTheme } = useTheme() // Using generic theme for mode, but we need data-theme for colors or custom logic
    // next-themes handles class or data-attribute. 
    // Getting "green-dark" or separate providers is complex. 
    // Simpler approach: Use a separate context or just set a data attribute on document body manually if next-themes doesn't support dual dimensionality easily.
    // actually next-themes supports ANY string. So "light", "dark", "green-light", "green-dark" etc.
    // But usually we want Mode (Light/Dark) AND Color (Green/Blue) orthogonal.
    // Let's implement color switching by setting a data-color attribute on document.documentElement.

    const [color, setColor] = React.useState("green")
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
        document.documentElement.setAttribute("data-color", color)
    }, [color])

    if (!mounted) return null

    return (
        <div className="flex items-center gap-2 p-2">
            {themes.map((t) => (
                <button
                    key={t.name}
                    onClick={() => setColor(t.name)}
                    className={`w-6 h-6 rounded-full ${t.color} flex items-center justify-center ring-offset-background transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${color === t.name ? "ring-2 ring-ring ring-offset-2" : ""}`}
                    title={t.label}
                >
                    {color === t.name && <Check className="w-3 h-3 text-white" />}
                    <span className="sr-only">{t.label}</span>
                </button>
            ))}
        </div>
    )
}
