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
import { Loader2, CreditCard, Building, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { registerForProgramme, getProgrammeDetailsAction, initializeProgrammeRegistrationPayment } from "@/lib/actions/programmes";
import { getCorporateTiers, matchCorporateTierForLevel } from "@/lib/programme-tiers";
import { toast } from "sonner";
import Link from "next/link";

export default function CorporateRegisterPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();

    const programmeId = params.id as string;
    const [programme, setProgramme] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedTierLabel, setSelectedTierLabel] = useState<string>("");

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
                contactName: prev.contactName || session.user.name || "",
                contactEmail: prev.contactEmail || session.user.email || "",
                contactPhone: prev.contactPhone || (session.user as any).phone || "",
            }));
        }
    }, [session]);

    const allCorporateTiers = programme?.pricingTiers ? getCorporateTiers(programme.pricingTiers) : [];

    // Pre-select matching corporate tier on initial load
    useEffect(() => {
        if (allCorporateTiers.length > 0 && !selectedTierLabel) {
            const userLevel = (session?.user as any)?.officialLevel || null;
            const matched = matchCorporateTierForLevel(allCorporateTiers, userLevel);
            if (matched) {
                setSelectedTierLabel(matched.label);
            } else {
                setSelectedTierLabel(allCorporateTiers[0].label);
            }
        }
    }, [allCorporateTiers, selectedTierLabel, session]);

    const activeCorporateTier =
        allCorporateTiers.find((t) => t.label === selectedTierLabel) ||
        allCorporateTiers[0] ||
        null;

    const tierAmount = activeCorporateTier ? activeCorporateTier.amount : Number(programme?.amount || 0);
    const tierLabel = activeCorporateTier ? activeCorporateTier.label : "Corporate Registration";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.entityName.trim()) {
            toast.error("Please enter your Chapter / Entity name");
            return;
        }
        if (!formData.contactName.trim() || !formData.contactEmail.trim()) {
            toast.error("Please provide contact person name and email");
            return;
        }

        setIsSubmitting(true);
        try {
            const submissionData = {
                name: formData.contactName.trim(),
                email: formData.contactEmail.trim(),
                phone: formData.contactPhone.trim() || undefined,
                corporateEntityName: formData.entityName.trim(),
                isCorporateRegistration: true,
                amountPaid: tierAmount,
                registrationTier: tierLabel,
                delegationSize: formData.delegationSize || 1,
            };

            const result = await registerForProgramme(programmeId, submissionData as any, searchParams.get("waiver") || undefined);

            if (result.success) {
                if (result.paymentRequired && tierAmount > 0) {
                    toast.info("Registration saved. Redirecting to payment...");
                    const payResult = await initializeProgrammeRegistrationPayment(result.registrationId!, tierAmount);
                    if (payResult.success && payResult.authorizationUrl) {
                        window.location.href = payResult.authorizationUrl;
                        return;
                    } else {
                        toast.error(payResult.error || "Failed to initialize payment");
                    }
                } else {
                    toast.success("Corporate registration successful!");
                    router.push(`/programmes/registrations/${result.registrationId}/slip`);
                }
            } else if (result.registrationId) {
                if (result.status === 'PARTIALLY_PAID') {
                    toast.info("Active partial payment found. Redirecting to payment slip...");
                } else if (result.status === 'PENDING_PAYMENT') {
                    toast.info("Incomplete registration found. Redirecting to payment slip to complete payment...");
                } else {
                    toast.info("This chapter is already registered. Redirecting to payment slip...");
                }
                router.push(`/programmes/registrations/${result.registrationId}/slip`);
            } else {
                toast.error(result.error || "Failed to register corporate entity");
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
            <div className="min-h-screen bg-slate-50">
                <PublicNav />
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-4" />
                    <p className="text-muted-foreground animate-pulse">Loading programme details...</p>
                </div>
            </div>
        );
    }

    if (!programme) {
        return (
            <div className="min-h-screen bg-slate-50">
                <PublicNav />
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
                    <h1 className="text-2xl font-bold">Programme Not Found</h1>
                    <Button className="mt-4" asChild>
                        <Link href="/programmes">Browse Programmes</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNav />
            <div className="max-w-2xl mx-auto px-4 py-4 sm:py-8">
                <div className="mb-4">
                    <Link
                        href={`/programmes/${programmeId}/register`}
                        className="inline-flex items-center text-xs font-semibold text-emerald-800 hover:text-emerald-900 transition-colors gap-1.5"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back to Individual Registration
                    </Link>
                </div>

                <Card className="border-t-4 border-t-green-600 shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <CardTitle className="text-2xl font-bold text-green-900">{programme.title}</CardTitle>
                                <CardDescription className="mt-1 flex items-center gap-2">
                                    <Building className="h-4 w-4 text-green-600" />
                                    Corporate / Chapter Registration
                                </CardDescription>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1">
                                ₦{tierAmount.toLocaleString()}
                            </Badge>
                        </div>

                        {/* Interactive Tier Selection */}
                        {allCorporateTiers.length > 0 && (
                            <div className="mt-4 pt-3 border-t">
                                <Label className="text-xs font-bold uppercase text-gray-500 mb-2 block">
                                    Select Corporate Level / Tier
                                </Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {allCorporateTiers.map((tier) => {
                                        const isSelected = activeCorporateTier?.label === tier.label;
                                        return (
                                            <button
                                                key={tier.label}
                                                type="button"
                                                onClick={() => setSelectedTierLabel(tier.label)}
                                                className={`text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                                                    isSelected
                                                        ? "border-green-600 bg-green-50 ring-2 ring-green-600/20 shadow-sm"
                                                        : "border-gray-200 bg-white hover:border-green-400 hover:bg-green-50/30"
                                                }`}
                                            >
                                                <div className="min-w-0 pr-1">
                                                    <p className={`text-sm font-bold truncate ${isSelected ? "text-green-900" : "text-gray-800"}`}>
                                                        {tier.label}
                                                    </p>
                                                    <p className="text-[10px] text-emerald-700 font-medium">Chapter entity registration</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <p className={`text-base font-extrabold ${isSelected ? "text-green-800" : "text-gray-900"}`}>
                                                        ₦{tier.amount.toLocaleString()}
                                                    </p>
                                                    {isSelected && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-emerald-800">
                                    {tierLabel} — Single Payment
                                </p>
                                <p className="text-xs text-emerald-700">
                                    Registers your state or local government delegation under one payment of <strong>₦{tierAmount.toLocaleString()}</strong>.
                                </p>
                            </div>
                        </div>
                    </CardHeader>

                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4 sm:space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="entityName" className="text-xs font-bold uppercase text-gray-500">
                                    Entity / Chapter Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="entityName"
                                    placeholder="e.g., Ibadan North Local Government or Lagos State Council"
                                    value={formData.entityName}
                                    onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactName" className="text-xs font-bold uppercase text-gray-500">
                                        Representative / Contact Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="contactName"
                                        placeholder="Full name of chapter official"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail" className="text-xs font-bold uppercase text-gray-500">
                                        Contact Email <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="contactEmail"
                                        type="email"
                                        placeholder="chapter@tmcng.net or personal email"
                                        value={formData.contactEmail}
                                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone" className="text-xs font-bold uppercase text-gray-500">
                                        Contact Phone Number <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="contactPhone"
                                        placeholder="080XXXXXXXX"
                                        value={formData.contactPhone}
                                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="delegationSize" className="text-xs font-bold uppercase text-gray-500">
                                        Delegation Size (Number of delegates)
                                    </Label>
                                    <Input
                                        id="delegationSize"
                                        type="number"
                                        min={1}
                                        max={500}
                                        value={formData.delegationSize}
                                        onChange={(e) => setFormData({ ...formData, delegationSize: parseInt(e.target.value) || 1 })}
                                        required
                                    />
                                </div>
                            </div>

                            {programme.paymentRequired && tierAmount > 0 && (
                                <div className="space-y-2 mt-4 pt-4 border-t">
                                    <Label className="text-xs font-bold uppercase text-gray-500">Total Amount to Pay (₦)</Label>
                                    <Input
                                        type="number"
                                        value={tierAmount}
                                        readOnly
                                        className="border-green-300 bg-green-50/20 font-bold text-lg text-green-900"
                                    />
                                    <p className="text-[11px] text-gray-500 font-medium">
                                        Applicable fee: <strong className="text-black">₦{tierAmount.toLocaleString()}</strong> for <strong>{tierLabel}</strong>.
                                    </p>
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
                                            Pay ₦{tierAmount.toLocaleString()} for {tierLabel}
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck className="mr-2 h-5 w-5" />
                                            Complete Corporate Registration (Free)
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
        </div>
    );
}
