"use client";
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { PaymentReceipt } from '@/components/donation/payment-receipt';
import { CheckCircle, Printer } from 'lucide-react';
import Link from 'next/link';

export function SuccessContent() {
    const searchParams = useSearchParams();
    const reference = searchParams.get('ref');

    const [paymentStub, setPaymentStub] = useState<{
        paystackRef: string;
        amount: string;
        metadata: any;
        date?: Date;
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (reference) {
            import('@/lib/actions/donation').then(({ getPaymentByReference }) => {
                getPaymentByReference(reference).then(result => {
                    if (result.success && result.payment) {
                        setPaymentStub({
                            paystackRef: result.payment.paystackRef,
                            amount: result.payment.amount,
                            metadata: result.payment.metadata,
                            date: result.payment.createdAt
                        });
                    }
                    setLoading(false);
                })
            })
        }
    }, [reference]);

    if (!reference) return null;
    if (loading) return <div className="flex justify-center p-8"><span className="animate-spin">Loading...</span></div>;
    if (!paymentStub) return <div className="text-center p-8 text-red-500">Payment not found</div>;

    const handlePrint = () => {
        window.print();
    }

    return (
        <div className="min-h-screen bg-muted/10 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8 space-y-2">
                <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold text-green-800">Donation Successful!</h1>
                <p className="text-muted-foreground">Thank you for your generous support.</p>
            </div>

            <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg mb-8">
                <div className="text-center space-y-4">
                    <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                        Note: For security, full details are sent to your email.
                        Here is your transaction reference.
                    </p>
                    <PaymentReceipt payment={paymentStub} />
                </div>
            </div>

            <div className="flex gap-4 print:hidden">
                <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print Receipt
                </Button>
                <Button asChild>
                    <Link href="/donate">Donate Again</Link>
                </Button>
                <Button variant="ghost" asChild>
                    <Link href="/">Back Home</Link>
                </Button>
            </div>
        </div>
    )
}
