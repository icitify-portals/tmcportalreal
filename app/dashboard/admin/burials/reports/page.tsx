"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getBurialAnalytics } from "@/lib/actions/burial"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface AnalyticsData {
    total: number;
    averageAge: number;
    males: number;
    females: number;
    topState: string;
    ageGroups: { name: string, value: number }[];
    sexDistribution: { name: string, value: number }[];
    stateDistribution: { name: string, value: number }[];
    maritalDistribution: { name: string, value: number }[];
}

export default function BurialReportsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            const result = await getBurialAnalytics()
            if (result.success && result.data) {
                setData(result.data)
            } else {
                setData(null)
            }
            setLoading(false)
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <DashboardLayout>
                <div className="container mx-auto py-8">
                    <p>Loading analytics...</p>
                </div>
            </DashboardLayout>
        )
    }

    if (!data) {
        return (
            <DashboardLayout>
                <div className="container mx-auto py-8">
                    <p>Failed to load analytics.</p>
                </div>
            </DashboardLayout>
        )
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a28bfe']

    return (
        <DashboardLayout>
            <div className="container mx-auto py-8 max-w-7xl">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard/admin/burials">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Burial Demographics & Analytics</h1>
                        <p className="text-muted-foreground">Comprehensive overview of mortality and burial statistics.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{data.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Average Age</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{data.averageAge}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Most Common State</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-ellipsis overflow-hidden whitespace-nowrap">{data.topState}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Males / Females</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{data.males} / {data.females}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Age Distribution</CardTitle>
                            <CardDescription>Breakdown by age groups</CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.ageGroups} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <RechartsTooltip />
                                    <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Sex Distribution</CardTitle>
                            <CardDescription>Male vs Female</CardDescription>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.sexDistribution}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} (${((Number(percent ?? 0)) * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {data.sexDistribution.map((entry: { name: string, value: number }, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Marital Status</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.maritalDistribution} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" label>
                                        {data.maritalDistribution.map((entry: { name: string, value: number }, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>State of Origin</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.stateDistribution} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" width={80} />
                                    <RechartsTooltip />
                                    <Bar dataKey="value" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
