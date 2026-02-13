import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const PaymentReceipt = ({ payment }: { payment: any }) => {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    if (!payment) return null;
    if (!mounted) return <div className="p-8 text-center text-muted-foreground animate-pulse">Generating receipt...</div>;

    return (
        <Card className="w-full max-w-md mx-auto print:shadow-none print:border-none">
            <CardHeader className="text-center print:pb-2">
                <div className="mx-auto mb-4 h-16 w-16 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/logo.png" alt="TMC Logo" className="object-contain w-full h-full" />
                </div>
                <CardTitle className="text-xl font-bold uppercase text-green-800">Payment Receipt</CardTitle>
                <p className="text-sm text-muted-foreground">The Muslim Congress</p>
            </CardHeader>
            <Separator />
            <CardContent className="space-y-4 pt-6 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference:</span>
                    <span className="font-mono font-medium">{payment.paystackRef || payment.reference}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium" suppressHydrationWarning>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Payer:</span>
                    <span className="font-medium">{payment.metadata?.email}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Jurisdiction:</span>
                    <span className="font-medium text-right">
                        {payment.metadata?.jurisdiction?.level} <br />
                        <span className="text-xs text-muted-foreground">
                            {payment.metadata?.jurisdiction?.branch || payment.metadata?.jurisdiction?.lga || payment.metadata?.jurisdiction?.state}
                        </span>
                    </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center bg-muted/30 p-2 rounded">
                    <span className="font-semibold text-lg">Amount Paid:</span>
                    <span className="font-bold text-xl text-green-700">₦{parseFloat(payment.amount).toLocaleString()}</span>
                </div>

                <div className="pt-8 text-center print:block hidden">
                    <p className="text-xs text-muted-foreground">This is an electronically generated receipt.</p>
                </div>
            </CardContent>
        </Card>
    );
};
