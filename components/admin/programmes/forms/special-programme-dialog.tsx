"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Sparkles, Calendar, DollarSign, Award, Layers } from "lucide-react";
import { createProgramme } from "@/lib/actions/programmes";

const SpecialProgrammeSchema = z.object({
  title: z.string().min(1, "Special programme title is required"),
  description: z.string().min(10, "Please provide a detailed event description"),
  venue: z.string().min(1, "Venue is required"),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Start date is required"),
  endDate: z.string().refine((v) => !isNaN(Date.parse(v)), "End date is required"),
  time: z.string().default("08:00"),
  format: z.enum(["PHYSICAL", "VIRTUAL", "HYBRID"]).default("PHYSICAL"),
  targetAudience: z.enum(["PUBLIC", "MEMBERS", "BROTHERS", "SISTERS", "CHILDREN", "YOUTH", "ELDERS"]).default("PUBLIC"),
  // Financials & Ticketing
  paymentRequired: z.boolean().default(false),
  amount: z.string().default("0"),
  allowInstallments: z.boolean().default(false),
  minInstallmentAmount: z.string().default("0"),
  earlyBirdAmount: z.string().optional(),
  earlyBirdDeadline: z.string().optional(),
  budget: z.string().default("0"),
  // Bank Account Custom Routing (Paystack)
  progBankName: z.string().optional(),
  progBankCode: z.string().optional(),
  progBankAccountNumber: z.string().optional(),
  progBankAccountName: z.string().optional(),
  // Committees & Logistics
  committee: z.string().optional(),
  objectives: z.string().optional(),
  hasCertificate: z.boolean().default(false),
});

export function SpecialProgrammeDialog({
  organizationId,
  userOfficialId,
  userOfficeId,
  userLevel,
  triggerLabel = "Special Programme",
}: {
  organizationId: string;
  userOfficialId?: string;
  userOfficeId?: string;
  userLevel?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const form = useForm<z.infer<typeof SpecialProgrammeSchema>>({
    resolver: zodResolver(SpecialProgrammeSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      venue: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      time: "08:00",
      format: "PHYSICAL",
      targetAudience: "PUBLIC",
      paymentRequired: false,
      amount: "0",
      allowInstallments: false,
      minInstallmentAmount: "0",
      earlyBirdAmount: "",
      earlyBirdDeadline: "",
      budget: "0",
      progBankName: "",
      progBankCode: "",
      progBankAccountNumber: "",
      progBankAccountName: "",
      committee: "",
      objectives: "",
      hasCertificate: false,
    },
  });

  const paymentRequired = form.watch("paymentRequired");
  const allowInstallments = form.watch("allowInstallments");

  async function onSubmit(values: z.infer<typeof SpecialProgrammeSchema>) {
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: values.title,
        description: values.description,
        venue: values.venue,
        organizationId: organizationId,
        startDate: values.startDate,
        endDate: values.endDate,
        time: values.time,
        format: values.format,
        targetAudience: values.targetAudience,
        frequency: "ONCE", // Special programmes are flagship single-window events
        paymentRequired: values.paymentRequired,
        amount: values.paymentRequired ? values.amount : "0",
        allowInstallments: values.paymentRequired && values.allowInstallments,
        minInstallmentAmount: values.paymentRequired && values.allowInstallments ? values.minInstallmentAmount : "0",
        earlyBirdAmount: values.paymentRequired && values.earlyBirdAmount ? values.earlyBirdAmount : null,
        earlyBirdDeadline: values.paymentRequired && values.earlyBirdDeadline ? values.earlyBirdDeadline : null,
        budget: values.budget || "0",
        progBankName: values.progBankName || null,
        progBankCode: values.progBankCode || null,
        progBankAccountNumber: values.progBankAccountNumber || null,
        progBankAccountName: values.progBankAccountName || null,
        committee: values.committee || null,
        objectives: values.objectives || null,
        hasCertificate: values.hasCertificate,
        organizingOfficialId: userOfficialId || undefined,
        organizingOfficeId: userOfficeId || undefined,
      };

      const result = await createProgramme(payload, organizationId);
      if (result.success) {
        toast.success("Special Programme created successfully!");
        setOpen(false);
        form.reset();
      } else {
        console.error("Special programme creation rejected:", result.error);
        toast.error(result.error || "Failed to create special programme");
      }
    } catch (e: any) {
      console.error("Special programme submit exception:", e);
      toast.error(e?.message || "An unexpected error occurred while saving the programme");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-700 hover:bg-emerald-800 text-white">
          <Sparkles className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-slate-200">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-emerald-700" />
            Flagship Event & Camping Builder
          </div>
          <DialogTitle className="text-xl font-extrabold text-slate-950">Create Special Programme</DialogTitle>
          <DialogDescription className="text-xs font-medium text-slate-700">
            Dedicated workflow for flagship conferences, National Islamic Training Programme (NITP), Camps, and Seminars with multi-day schedules, fee registration, and committee planning.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 bg-emerald-50/90 border border-emerald-200 p-1 rounded-xl">
                <TabsTrigger value="general" className="text-xs font-bold text-slate-700 data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  1. Event Details
                </TabsTrigger>
                <TabsTrigger value="financials" className="text-xs font-bold text-slate-700 data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
                  <DollarSign className="h-3.5 w-3.5 mr-1" />
                  2. Fees & Budget
                </TabsTrigger>
                <TabsTrigger value="logistics" className="text-xs font-bold text-slate-700 data-[state=active]:bg-emerald-700 data-[state=active]:text-white">
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  3. Logistics & Certificates
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: General Details */}
              <TabsContent value="general" className="space-y-3.5 pt-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs text-slate-950">Event Title / Theme</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 33rd National Islamic Training Programme (NITP)" {...field} className="border-slate-300 font-medium text-slate-950 placeholder:text-slate-400 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-xs text-slate-950">Description & Scope</FormLabel>
                      <FormControl>
                        <Textarea rows={3} placeholder="Comprehensive description of the flagship event..." {...field} className="border-slate-300 font-medium text-slate-950 placeholder:text-slate-400 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-950">Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="border-slate-300 font-semibold text-slate-950 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-950">End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="border-slate-300 font-semibold text-slate-950 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-950">Venue / Camp Ground</FormLabel>
                        <FormControl>
                          <Input placeholder="Location or facility" {...field} className="border-slate-300 font-medium text-slate-950 placeholder:text-slate-400 bg-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-bold text-slate-950">Target Audience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-slate-300 font-semibold text-slate-950 bg-white">
                              <SelectValue placeholder="Audience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {["PUBLIC", "MEMBERS", "BROTHERS", "SISTERS", "CHILDREN", "YOUTH", "ELDERS"].map((aud) => (
                              <SelectItem key={aud} value={aud} className="font-medium text-slate-950">
                                {aud}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              {/* TAB 2: Fees & Budget */}
              <TabsContent value="financials" className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-950">Approved Programme Budget (₦)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" placeholder="0.00" {...field} className="border-slate-300 font-semibold text-slate-950 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-950">Delegate Registration Fee</div>
                      <div className="text-[11px] font-medium text-slate-600">Does this programme require delegates to pay a registration fee?</div>
                    </div>
                    <FormField
                      control={form.control}
                      name="paymentRequired"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {paymentRequired && (
                    <div className="space-y-3 pt-3 border-t border-slate-200">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-bold text-slate-950">Standard Registration Fee (₦)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="e.g. 15000" {...field} className="border-slate-300 font-bold text-slate-950 bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <FormField
                          control={form.control}
                          name="earlyBirdAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-slate-950">Early Bird Fee (₦)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="Optional discount" {...field} className="border-slate-300 font-semibold text-slate-950 bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="earlyBirdDeadline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-slate-950">Early Bird Deadline</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} className="border-slate-300 font-semibold text-slate-950 bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs font-bold text-slate-950">Allow Installment Payments?</div>
                        <FormField
                          control={form.control}
                          name="allowInstallments"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {allowInstallments && (
                        <FormField
                          control={form.control}
                          name="minInstallmentAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-bold text-slate-950">Minimum First Installment (₦)</FormLabel>
                              <FormControl>
                                <Input type="number" min="0" placeholder="e.g. 5000" {...field} className="border-slate-300 font-semibold text-slate-950 bg-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* TAB 3: Logistics & Certificates */}
              <TabsContent value="logistics" className="space-y-3.5 pt-2">
                <FormField
                  control={form.control}
                  name="committee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-950">Planning Committee Members</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Names, roles, and contacts of deployed officers..." {...field} className="border-slate-300 font-medium text-slate-950 placeholder:text-slate-400 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="objectives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-950">Specific Event Milestones & Objectives</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Target attendance, key deliverables..." {...field} className="border-slate-300 font-medium text-slate-950 placeholder:text-slate-400 bg-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wide">
                      <Award className="h-4 w-4 text-emerald-700" />
                      Issue Digital Certificates of Participation
                    </div>
                    <div className="text-[11px] font-medium text-slate-700 mt-0.5">Allow registered attendees to download certified slips upon completion.</div>
                  </div>
                  <FormField
                    control={form.control}
                    name="hasCertificate"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="border-slate-300 text-slate-800 font-semibold hover:bg-slate-100" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Special Programme
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
