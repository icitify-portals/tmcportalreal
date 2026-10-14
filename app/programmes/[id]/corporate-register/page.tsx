"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PublicNav } from "@/components/layout/public-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, Building, ShieldCheck } from "lucide-react";
import { registerForProgramme, getProgrammeDetailsAction, initializeProgrammeRegistrationPayment } from "@/lib/actions/programmes";
import { toast } from "sonner";

const LEVEL_TO_TIER_KEYWORD: Record<string, string> = {
    STATE: "State Corporate",
    LOCAL_GOVERNMENT: "LG Corporate",
    BRANCH: "Branch Corporate",
};

export default function CorporateRegisterPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();

    const programmeId = params.id as string;
    const [programme, setProgramme] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        entityName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        delegationSize: 1,
    });

    useEffect(() => {
        async function loadProgramme() {
            try {
                const result = await getProgrammeDetailsAction(programmeId);
                if (result.success) {
                    setProgramme(result.programme);
                } else {
                    toast.error("Programme not found");
                }
            } catch (error) {
                toast.error("Failed to load programme");
            } finally {
                setIsLoading(false);
            }
        }
        loadProgramme();
    }, [programmeId]);

    useEffect(() => {
        if (session?.user) {
            setFormData(prev => ({
                ...prev,
                contactName: session.user.name || "",
                contactEmail: session.user.email || "",
                contactPhone: (session.user as any).phone || "",
            }));
        }
    }, [session]);

    const tierKeyword = LEVEL_TO_TIER_KEYWORD[(session?.user as any)?.officialLevel || ""];
    const corporateTier = programme?.pricingTiers
        ? Object.entries(typeof programme.pricingTiers === 'string' ? JSON.parse(programme.pricingTiers) : programme.pricingTiers)
            .find(([label]) => label.includes(tierKeyword))
        : null;

    const tierAmount = corporateTier ? Number(corporateTier[1]) : 0;
    const tierLabel = corporateTier ? corporateTier[0] : null;

    const isAuthorized = !!tierLabel && !!session?.user;
    const isOfficer = !!tierLabel;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!isAuthorized) return;
        setIsSubmitting(true);
        try {
            const submissionData = {
                ...formData,
                amountPaid: tierAmount,
                registrationTier: tierLabel,
                corporateRegistration: true,
                delegationSize: formData.delegationSize,
            };
            const result = await registerForProgramme(programmeId, submissionData as any, searchParams.get("waiver") || undefined);

            if (result.success) {
                if (result.paymentRequired) {
                    const payResult = await initializeProgrammeRegistrationPayment(result.registrationId!, tierAmount);
                    if (payResult.success && payResult.authorizationUrl) {
                        window.location.href = payResult.authorizationUrl;
                    } else {
                        toast.error(payResult.error || "Failed to initialize payment");
                    }
                } else {
                    toast.success("Corporate registration successful");
                    router.push(`/dashboard/member/programmes`);
                }
            } else if (result.registrationId) {
                toast.info(result.error || "Registration exists. Redirecting to payment slip...");
                router.push(`/programmes/registrations/${result.registrationId}/slip`);
            } else {
                toast.error(result.error || "Failed to register");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
                <p className="text-muted-foreground animate-pulse">Loading programme details...</p>
            </div>
        );
    }

    if (!programme) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                <h1 className="text-2xl font-bold">Programme Not Found</h1>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 text-center">
                <Building className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-red-600">Not Authorized</h1>
                <p className="text-muted-foreground mt-2">
                    Corporate registration is restricted to officials of the matching level.
                    {tierKeyword ? ` Required level: <strong>${tierKeyword.replace(" Corporate", "")}</strong>.` : " No matching corporate tier for your level."}
                </p>
                {session?.user && (
                    <p className="text-sm text-muted-foreground mt-2">
                        Your official level: <strong>{(session.user as any).officialLevel || "Not set"}</strong>
                    </p>
                )}
                <Button className="mt-6" asChild>
                    <a href="/programmes">Browse Programmes</a>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
            <Card className="border-t-4 border-t-green-600 shadow-lg">
                <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold text-green-900">{programme.title}</CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-2">
                                <Building className="h-4 w-4 text-green-600" />
                                Corporate / Entity Registration
                            </CardDescription>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1">
                            {tierLabel}
                        </Badge>
                    </div>
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-800">Entity Registration — One Payment</p>
                            <p className="text-xs text-emerald-700">This registers your {tierKeyword?.replace(" Corporate", "").toLowerCase() || "chapter"} as an entity. Fee: <strong>₦{tierAmount.toLocaleString()}</strong>.</p>
                        </div>
                    </div>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 sm:space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-gray-500">Entity / Chapter Name</Label>
                            <Input
                                placeholder="e.g., Oyo State Chapter"
                                value={formData.entityName}
                                onChange={(e) => setFormData({...formData, entityName: e.target.value})}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="contactName" className="text-xs font-bold uppercase text-gray-500">Contact Person Name</Label>
                                <Input
                                    id="contactName"
                                    placeholder="Contact person name"
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({...formData, contactName: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contactEmail" className="text-xs font-bold uppercase text-gray-500">Contact Email</Label>
                                <Input
                                    id="contactEmail"
                                    type="email"
                                    placeholder="contact@chapter.org"
                                    value={formData.contactEmail}
                                    onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone" className="text-xs font-bold uppercase text-gray-500">Contact Phone</Label>
                            <Input
                                id="contactPhone"
                                placeholder="080XXXXXXXX"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="delegationSize" className="text-xs font-bold uppercase text-gray-500">Delegation Size (number of delegates)</Label>
                            <Input
                                id="delegationSize"
                                type="number"
                                min={1}
                                max={100}
                                value={formData.delegationSize}
                                onChange={(e) => setFormData({...formData, delegationSize: parseInt(e.target.value) || 1})}
                                required
                            />
                        </div>

                        {!isSubmitting && programme.paymentRequired && tierAmount > 0 && (
                            <div className="space-y-2 mt-4">
                                <Label className="text-xs font-bold uppercase text-gray-500">Amount to Pay (₦)</Label>
                                <Input
                                    type="number"
                                    min={tierAmount}
                                    step="0.01"
                                    placeholder={`Minimum: ₦${tierAmount}`}
                                    value={tierAmount}
                                    readOnly
                                    className="border-green-300 bg-green-50/20"
                                />
                                <p className="text-[10px] text-gray-500 font-medium">Fixed corporate fee: <strong className="text-black">₦{tierAmount.toLocaleString()}</strong> for {tierLabel}.</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="sticky bottom-0 z-10 flex flex-col gap-3 border-t border-gray-100 bg-card/95 p-4 pt-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-6">
                        <div className="w-full">
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-bold bg-green-700 hover:bg-green-800 shadow-md"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : programme.paymentRequired && tierAmount > 0 ? (
                                    <>
                                        <CreditCard className="mr-2 h-5 w-5" />
                                        Proceed to Payment (₦{tierAmount.toLocaleString()})
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="mr-2 h-5 w-5" />
                                        Complete Registration (Free)
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
                            TMC Portal © {new Date().getFullYear()} • Secure Corporate Registration
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}