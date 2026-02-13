"use client"

import React from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function RevenueChart({ data }: { data: any[] }) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    if (!mounted) return <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg" />

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Monthly Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickFormatter={(val) => {
                                    const [y, m] = val.split('-')
                                    const date = new Date(parseInt(y), parseInt(m) - 1)
                                    return date.toLocaleString('default', { month: 'short' })
                                }}
                            />
                            <YAxis tickFormatter={(val) => `N${val.toLocaleString()}`} />
                            <Tooltip
                                formatter={(val: any) => [`N${val?.toLocaleString() || 0}`, 'Total Revenue']}
                                labelFormatter={(label) => {
                                    const [y, m] = label.split('-')
                                    const date = new Date(parseInt(y), parseInt(m) - 1)
                                    return `${date.toLocaleString('default', { month: 'long' })} ${y}`
                                }}
                            />
                            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

export function ComplianceChart({ data }: { data: { paid: number, pending: number, rate: number } }) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    const pieData = [
        { name: 'Paid', value: data.paid, color: '#16a34a' },
        { name: 'Pending', value: data.pending, color: '#dc2626' }
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fee Compliance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[250px]">
                {!mounted ? (
                    <div className="h-[200px] w-[200px] bg-muted/20 animate-pulse rounded-full" />
                ) : (
                    <>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-center">
                            <div className="text-3xl font-bold">{data.rate.toFixed(1)}%</div>
                            <p className="text-sm text-muted-foreground">Overall Compliance Rate</p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

export function BudgetActualChart({ data }: { data: { allocated: number, spent: number } }) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    const percentage = data.allocated > 0 ? (data.spent / data.allocated) * 100 : 0

    return (
        <Card>
            <CardHeader>
                <CardTitle>Budget vs Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-sm text-muted-foreground">Total Budget</p>
                        <p className="text-2xl font-bold" suppressHydrationWarning>
                            N{mounted ? data.allocated.toLocaleString() : "..."}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-2xl font-bold text-red-600" suppressHydrationWarning>
                            N{mounted ? data.spent.toLocaleString() : "..."}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Utilization</span>
                        <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                </div>
            </CardContent>
        </Card>
    )
}

export function CategoryChart({ data }: { data: any[] }) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent className="min-h-[250px] flex items-center justify-center">
                {!mounted ? (
                    <div className="h-[200px] w-[200px] bg-muted/20 animate-pulse rounded-full" />
                ) : (
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(val: any) => `N${val.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

export function CampaignProgressBoard({ campaigns }: { campaigns: any[] }) {
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    return (
        <Card className="col-span-full md:col-span-2">
            <CardHeader>
                <CardTitle>Fundraising Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {campaigns.length === 0 && <p className="text-center text-muted-foreground py-10">No active campaigns found.</p>}
                {campaigns.map((c, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium">{c.name}</span>
                            <span className="text-muted-foreground" suppressHydrationWarning>
                                N{mounted ? c.raised.toLocaleString() : "..."} / N{mounted ? c.target.toLocaleString() : "..."}
                            </span>
                        </div>
                        <Progress value={c.percentage} className="h-2" />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
