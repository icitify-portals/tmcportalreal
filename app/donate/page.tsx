export const dynamic = 'force-dynamic'

import DonationWrapper from "@/components/donation/donation-wrapper";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav"

export default function DonatePage() {
    return (
        <div className="min-h-screen flex flex-col bg-background font-sans">
            {/* Header */}
            <PublicNav />

            <main className="flex-grow container mx-auto px-4 py-12 space-y-12">
                <div className="flex items-center text-sm text-muted-foreground -mt-8 mb-4">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <ChevronRight className="h-4 w-4 mx-1" />
                    <span className="font-bold text-green-700">Donate</span>
                </div>

                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h1 className="text-4xl font-extrabold tracking-tight text-green-800 dark:text-green-400">Support Our Dawah</h1>
                    <p className="text-xl text-muted-foreground">
                        Your contribution helps The Muslim Congress foster unity, provide education, and support community development across Nigeria.
                    </p>
                </div>

                <div className="flex justify-center">
                    <DonationWrapper />
                </div>

                <div className="max-w-2xl mx-auto text-center space-y-6 pt-12">
                    <Separator />
                    <h3 className="text-lg font-semibold text-muted-foreground">Why Donate?</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-bold text-green-700 mb-2">Community Development</h4>
                            <p>Funding local projects, infrastructure, and social welfare programs.</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-bold text-green-700 mb-2">Education & Dawah</h4>
                            <p>Supporting schools, lectures, and propagation of Islamic knowledge.</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-bold text-green-700 mb-2">Humanitarian Aid</h4>
                            <p>Providing relief and assistance to the needy within our society.</p>
                        </div>
                    </div>
                </div>

            </main>

            <footer className="bg-green-950 text-green-100 py-8 border-t border-green-900 mt-auto text-center text-sm">
                <p>&copy; <span suppressHydrationWarning>{new Date().getFullYear()}</span> The Muslim Congress. Jazakumullahu Khairan for your support.</p>
            </footer>
        </div>
    );
}
