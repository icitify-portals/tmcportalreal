"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { locationData } from "@/lib/location-data";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Script from 'next/script';

export default function DonationForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form Stats
    const [email, setEmail] = useState("");
    const [amount, setAmount] = useState<string>("");
    const [fullName, setFullName] = useState("");

    // Jurisdiction State
    const [level, setLevel] = useState("National");
    const [selectedState, setSelectedState] = useState("");
    const [selectedLga, setSelectedLga] = useState("");
    const [selectedBranch, setSelectedBranch] = useState("");

    // Paystack Loaded State
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleDonate = () => {
        if (!email || !amount) {
            toast.error("Please fill in email and amount");
            return;
        }

        if (!scriptLoaded) {
            toast.error("Payment system loading, please wait...");
            return;
        }

        const paystack = (window as any).PaystackPop;
        if (!paystack) {
            toast.error("Payment system failed to load");
            return;
        }

        const config = {
            key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_xxxxxxxxxxxxxxxxxxxx',
            email: email,
            amount: (parseFloat(amount || "0") * 100),
            currency: 'NGN',
            metadata: {
                custom_fields: [
                    { display_name: "Full Name", variable_name: "full_name", value: fullName },
                    { display_name: "Jurisdiction Level", variable_name: "level", value: level },
                    { display_name: "State", variable_name: "state", value: selectedState },
                    { display_name: "LGA", variable_name: "lga", value: selectedLga },
                    { display_name: "Branch", variable_name: "branch", value: selectedBranch }
                ]
            },
            onClose: () => {
                toast("Payment cancelled");
            },
            callback: (response: any) => {
                setLoading(true);
                // Verify on server
                fetch('/api/donate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        reference: response, // Paystack returns object with reference
                        email,
                        amount,
                        jurisdiction: { level, state: selectedState, lga: selectedLga, branch: selectedBranch }
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            toast.success("Payment Successful!");
                            router.push(`/donate/success?ref=${response.reference}`);
                        } else {
                            toast.error("Payment verified but recording failed.");
                        }
                    })
                    .catch(err => {
                        toast.error("An error occurred");
                        console.error(err);
                    })
                    .finally(() => setLoading(false));
            }
        };

        paystack.setup(config).openIframe();
    };

    // Helper options
    const states = Object.keys(locationData);
    const lgas = selectedState ? (locationData as any)[selectedState]?.lgas || [] : [];
    const branches = selectedLga ? lgas.find((l: any) => l.name === selectedLga)?.branches || [] : [];

    return (
        <>
            <Script
                src="https://js.paystack.co/v1/inline.js"
                onLoad={() => setScriptLoaded(true)}
                strategy="lazyOnload"
            />
            <Card className="w-full max-w-lg mx-auto shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-center text-green-700">Make a Donation</CardTitle>
                    <CardDescription className="text-center">Support the cause at any level</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Jurisdiction Selection */}
                    <div className="space-y-4 border-b pb-4">
                        <Label>Select Jurisdiction Level</Label>
                        <Select onValueChange={(val) => { setLevel(val); setSelectedState(""); setSelectedLga(""); setSelectedBranch("") }} value={level}>
                            <SelectTrigger><SelectValue placeholder="Level" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="National">National Headquarters</SelectItem>
                                <SelectItem value="State">State</SelectItem>
                                <SelectItem value="LGA">Local Government</SelectItem>
                                <SelectItem value="Branch">Branch</SelectItem>
                            </SelectContent>
                        </Select>

                        {(level === "State" || level === "LGA" || level === "Branch") && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Label>State</Label>
                                <Select onValueChange={(val) => { setSelectedState(val); setSelectedLga(""); setSelectedBranch("") }} value={selectedState}>
                                    <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                                    <SelectContent>
                                        {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {(level === "LGA" || level === "Branch") && selectedState && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Label>Local Government</Label>
                                <Select onValueChange={(val) => { setSelectedLga(val); setSelectedBranch("") }} value={selectedLga}>
                                    <SelectTrigger><SelectValue placeholder="Select LGA" /></SelectTrigger>
                                    <SelectContent>
                                        {lgas.map((l: any) => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {(level === "Branch") && selectedLga && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <Label>Branch</Label>
                                <Select onValueChange={setSelectedBranch} value={selectedBranch}>
                                    <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map((b: string) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Amount & User Info */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name (Optional)</Label>
                                <Input placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Amount (NGN)</Label>
                            <div className="flex gap-2 flex-wrap mb-2">
                                {[1000, 5000, 10000].map(amt => (
                                    <Button key={amt} variant="outline" size="sm" onClick={() => setAmount(amt.toString())} type="button">
                                        <span suppressHydrationWarning>₦{amt.toLocaleString()}</span>
                                    </Button>
                                ))}
                            </div>
                            <Input type="number" placeholder="Enter amount" value={amount} onChange={e => setAmount(e.target.value)} required />
                        </div>
                    </div>

                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-lg py-6" onClick={handleDonate} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pay Now"}
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
}

