"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Loader2, Repeat, Sparkles } from "lucide-react";
import { createProgramme } from "@/lib/actions/programmes";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be detailed"),
  venue: z.string().min(1, "Venue is required"),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  time: z.string().optional(),
  format: z.enum(["PHYSICAL", "VIRTUAL", "HYBRID"]).default("PHYSICAL"),
  meetingUrl: z.string().optional(),
  // Repetitive
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY", "CUSTOM"]).optional(),
  recurrenceType: z.enum(["BY_DATE", "BY_DAY_OF_WEEK"]).optional(),
  weekDay: z.coerce.number().min(0).max(6).nullable().optional(),
  weekOrdinal: z.coerce.number().nullable().optional(),
  rruleString: z.string().optional(),
  // Special
  endDate: z.string().optional(),
  targetAudience: z.enum(["PUBLIC", "MEMBERS", "BROTHERS", "SISTERS", "CHILDREN", "YOUTH", "ELDERS"]).optional(),
  budget: z.string().optional(),
  committee: z.string().optional(),
  objectives: z.string().optional(),
});

type ProgrammeType = "REPETITIVE" | "SPECIAL";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function QuickProgrammeDialog({
  type,
  organizationId,
  triggerLabel,
}: {
  type: ProgrammeType;
  organizationId: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRepetitive = type === "REPETITIVE";
  const label = isRepetitive ? "Repetitive Programme" : "Special Programme";
  const Icon = isRepetitive ? Repeat : Sparkles;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      venue: "",
      startDate: "",
      time: "",
      format: "PHYSICAL",
      meetingUrl: "",
      frequency: isRepetitive ? "MONTHLY" : undefined,
      recurrenceType: "BY_DATE",
      weekDay: 0,
      weekOrdinal: 1,
      rruleString: "",
      endDate: "",
      targetAudience: "PUBLIC",
      budget: "0",
      committee: "",
      objectives: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!organizationId) {
      toast.error("No organization context");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: data.title,
        description: data.description,
        venue: data.venue,
        startDate: new Date(data.startDate),
        time: data.time || undefined,
        format: data.format,
        meetingUrl: data.meetingUrl || undefined,
        isOnline: data.format !== "PHYSICAL",
        targetAudience: data.targetAudience || "PUBLIC",
        hasCertificate: false,
        isRecurringAdmin: isRepetitive,
        frequency: isRepetitive ? (data.frequency || "MONTHLY") : "ONCE",
        recurrenceType: data.recurrenceType || "BY_DATE",
        weekDay: data.weekDay ?? null,
        weekOrdinal: data.weekOrdinal ?? null,
        rruleString: data.rruleString || undefined,
        amount: 0,
        paymentRequired: false,
      };
      if (!isRepetitive) {
        payload.endDate = data.endDate ? new Date(data.endDate) : undefined;
        payload.budget = parseFloat(data.budget || "0");
        payload.committee = data.committee || undefined;
        payload.objectives = data.objectives || undefined;
      }

      const res = await createProgramme(payload, organizationId);
      if (res.success) {
        toast.success(isRepetitive
          ? "Repetitive programme scheduled (auto-approved for administrators)."
          : "Special programme created.");
        setOpen(false);
        form.reset();
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to create programme");
      }
    } catch (e) {
      console.error(e);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={isRepetitive ? "border-indigo-200 text-indigo-700 hover:bg-indigo-50" : "border-amber-200 text-amber-700 hover:bg-amber-50"}>
          <Icon className="mr-2 h-4 w-4" />
          {triggerLabel || `New ${label}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Icon className="h-5 w-5" />{label}</DialogTitle>
          <DialogDescription>
            {isRepetitive
              ? "For recurring / administrative programmes (e.g. Adhkar, Teskiyyah, meetings). These are auto-approved and can repeat on a schedule."
              : "For special one-off events (e.g. conferences, special days, launches). Submit for the usual approval flow."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g. Weekly Adhkar" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the programme..." rows={3} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="venue" render={({ field }) => (
                <FormItem><FormLabel>Venue</FormLabel><FormControl><Input placeholder="e.g. Central Mosque" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="format" render={({ field }) => (
                <FormItem><FormLabel>Format</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="PHYSICAL">Physical</SelectItem>
                      <SelectItem value="VIRTUAL">Virtual</SelectItem>
                      <SelectItem value="HYBRID">Hybrid</SelectItem>
                    </SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="startDate" render={({ field }) => (
                <FormItem><FormLabel>{isRepetitive ? "First Date" : "Start Date"}</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="time" render={({ field }) => (
                <FormItem><FormLabel>Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>

            {form.watch("format") !== "PHYSICAL" && (
              <FormField control={form.control} name="meetingUrl" render={({ field }) => (
                <FormItem><FormLabel>Meeting Link (optional)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl>
                  <FormDescription>Leave blank to auto-generate a native virtual room.</FormDescription><FormMessage /></FormItem>
              )} />
            )}

            {isRepetitive && (
              <div className="rounded-md border border-indigo-200 bg-indigo-50/50 p-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="frequency" render={({ field }) => (
                    <FormItem><FormLabel>Repeats</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="ANNUALLY">Annually</SelectItem>
                          <SelectItem value="CUSTOM">Custom (RRULE)</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="recurrenceType" render={({ field }) => (
                    <FormItem><FormLabel>Recurrence Basis</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="BY_DATE">Same date each period</SelectItem>
                          <SelectItem value="BY_DAY_OF_WEEK">Nth weekday (e.g. first Sunday)</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>

                {form.watch("frequency") === "CUSTOM" ? (
                  <FormField control={form.control} name="rruleString" render={({ field }) => (
                    <FormItem><FormLabel>Recurrence Rule (RRULE)</FormLabel><FormControl>
                      <Input placeholder="e.g. FREQ=MONTHLY;BYDAY=1SU (first Sunday)" {...field} /></FormControl>
                      <FormDescription>Google-Calendar style rule.</FormDescription><FormMessage /></FormItem>
                  )} />
                ) : (form.watch("recurrenceType") === "BY_DAY_OF_WEEK" && form.watch("frequency") === "MONTHLY") && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="weekDay" render={({ field }) => (
                      <FormItem><FormLabel>Weekday</FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value ?? 0)}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {WEEKDAYS.map((d, i) => <SelectItem key={d} value={String(i)}>{d}</SelectItem>)}
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="weekOrdinal" render={({ field }) => (
                      <FormItem><FormLabel>Occurrence</FormLabel>
                        <Select onValueChange={(v) => field.onChange(Number(v))} defaultValue={String(field.value ?? 1)}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="1">First</SelectItem>
                            <SelectItem value="2">Second</SelectItem>
                            <SelectItem value="3">Third</SelectItem>
                            <SelectItem value="4">Fourth</SelectItem>
                            <SelectItem value="-1">Last</SelectItem>
                          </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                  </div>
                )}
              </div>
            )}

            {!isRepetitive && (
              <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="endDate" render={({ field }) => (
                    <FormItem><FormLabel>End Date (optional)</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="targetAudience" render={({ field }) => (
                    <FormItem><FormLabel>Target Audience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value as string}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="PUBLIC">Public</SelectItem>
                          <SelectItem value="MEMBERS">Members</SelectItem>
                          <SelectItem value="BROTHERS">Brothers</SelectItem>
                          <SelectItem value="SISTERS">Sisters</SelectItem>
                          <SelectItem value="YOUTH">Youth</SelectItem>
                          <SelectItem value="CHILDREN">Children</SelectItem>
                          <SelectItem value="ELDERS">Elders</SelectItem>
                        </SelectContent>
                      </Select><FormMessage /></FormItem>
                  )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="budget" render={({ field }) => (
                    <FormItem><FormLabel>Budget (NGN)</FormLabel><FormControl><Input type="number" min="0" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="committee" render={({ field }) => (
                    <FormItem><FormLabel>Committee</FormLabel><FormControl><Input placeholder="Organizing committee" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="objectives" render={({ field }) => (
                  <FormItem><FormLabel>Objectives</FormLabel><FormControl><Textarea rows={2} placeholder="What this special programme aims to achieve" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className={isRepetitive ? "bg-indigo-700 hover:bg-indigo-800" : "bg-amber-600 hover:bg-amber-700"}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create {label}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
