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
  FormDescription,
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
import { toast } from "sonner";
import { Loader2, Repeat, Calendar, Clock, MapPin } from "lucide-react";
import { createProgramme } from "@/lib/actions/programmes";

const RepetitiveProgrammeSchema = z.object({
  title: z.string().min(1, "Programme title is required"),
  description: z.string().min(10, "Please provide a brief description"),
  venue: z.string().min(1, "Venue is required"),
  startDate: z.string().refine((v) => !isNaN(Date.parse(v)), "Valid start date is required"),
  time: z.string().min(1, "Commencement time is required"),
  format: z.enum(["PHYSICAL", "VIRTUAL", "HYBRID"]).default("PHYSICAL"),
  meetingUrl: z.string().optional(),
  targetAudience: z.enum(["PUBLIC", "MEMBERS", "BROTHERS", "SISTERS", "CHILDREN", "YOUTH", "ELDERS"]).default("MEMBERS"),
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY", "CUSTOM"]).default("MONTHLY"),
  recurrenceType: z.enum(["BY_DATE", "BY_DAY_OF_WEEK"]).default("BY_DAY_OF_WEEK"),
  weekDay: z.coerce.number().min(0).max(6).default(0), // 0 = Sunday
  weekOrdinal: z.coerce.number().default(1), // 1 = 1st, 2 = 2nd, etc.
  rruleString: z.string().optional(),
});

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDINALS = [
  { value: 1, label: "1st (First)" },
  { value: 2, label: "2nd (Second)" },
  { value: 3, label: "3rd (Third)" },
  { value: 4, label: "4th (Fourth)" },
  { value: -1, label: "Last" },
];

export function RepetitiveProgrammeDialog({
  organizationId,
  userOfficialId,
  userOfficeId,
  userLevel,
  triggerLabel = "Repetitive Programme",
}: {
  organizationId: string;
  userOfficialId?: string;
  userOfficeId?: string;
  userLevel?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof RepetitiveProgrammeSchema>>({
    resolver: zodResolver(RepetitiveProgrammeSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      venue: "",
      startDate: new Date().toISOString().slice(0, 10),
      time: "07:00",
      format: "PHYSICAL",
      meetingUrl: "",
      targetAudience: "MEMBERS",
      frequency: "MONTHLY",
      recurrenceType: "BY_DAY_OF_WEEK",
      weekDay: 0, // Sunday (e.g. State / Branch Adhkar)
      weekOrdinal: 1, // 1st Sunday
      rruleString: "",
    },
  });

  const recurrenceType = form.watch("recurrenceType");
  const frequency = form.watch("frequency");

  async function onSubmit(values: z.infer<typeof RepetitiveProgrammeSchema>) {
    setIsSubmitting(true);
    try {
      const payload: any = {
        title: values.title,
        description: values.description,
        venue: values.venue,
        organizationId: organizationId,
        startDate: values.startDate,
        time: values.time,
        format: values.format,
        meetingUrl: values.meetingUrl || "",
        targetAudience: values.targetAudience,
        frequency: values.frequency,
        recurrenceType: values.recurrenceType,
        weekDay: values.recurrenceType === "BY_DAY_OF_WEEK" ? Number(values.weekDay) : null,
        weekOrdinal: values.recurrenceType === "BY_DAY_OF_WEEK" ? Number(values.weekOrdinal) : null,
        rruleString: values.frequency === "CUSTOM" ? values.rruleString : "",
        paymentRequired: false,
        amount: "0",
        budget: "0",
        organizingOfficialId: userOfficialId || undefined,
        organizingOfficeId: userOfficeId || undefined,
      };

      const result = await createProgramme(payload, organizationId);
      if (result.success) {
        toast.success("Repetitive programme series scheduled successfully across the year!");
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error || "Failed to schedule repetitive programme");
      }
    } catch (e: any) {
      toast.error(e.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-teal-600 text-teal-700 hover:bg-teal-50">
          <Repeat className="mr-2 h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-1.5 text-teal-800 text-xs font-semibold uppercase">
            <Repeat className="h-3.5 w-3.5" />
            Recurring & Administrative Schedule
          </div>
          <DialogTitle className="text-xl">Schedule Repetitive Programme</DialogTitle>
          <DialogDescription>
            Dedicated workflow for routine administrative programmes, Adhkar, and meetings holding periodically (e.g. 1st Sunday of every month) without ticketing or camping fees.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold text-xs">Programme Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. State Monthly Adhkar / Branch Usrah" {...field} />
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
                  <FormLabel className="font-semibold text-xs">Brief Description / Objective</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Brief details about the recurring activity..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Venue / Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Physical center or hall" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Format</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PHYSICAL">Physical Only</SelectItem>
                        <SelectItem value="VIRTUAL">Virtual (Online)</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">First Occurrence Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Commencement Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Recurrence Engine Configuration */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-3.5 space-y-3">
              <div className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Dating & Calendar Recurrence (Google Calendar Style)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="CUSTOM">Custom (RRULE)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurrenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Recurrence Basis</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Recurrence basis" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="BY_DAY_OF_WEEK">Nth Weekday (e.g. 1st Sunday)</SelectItem>
                          <SelectItem value="BY_DATE">Exact Calendar Day (e.g. Every 5th)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {recurrenceType === "BY_DAY_OF_WEEK" && frequency === "MONTHLY" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <FormField
                    control={form.control}
                    name="weekOrdinal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Occurrence</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          defaultValue={String(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Occurrence" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ORDINALS.map((o) => (
                              <SelectItem key={o.value} value={String(o.value)}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weekDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Day of Week</FormLabel>
                        <Select
                          onValueChange={(val) => field.onChange(Number(val))}
                          defaultValue={String(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {WEEKDAYS.map((day, idx) => (
                              <SelectItem key={idx} value={String(idx)}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-700 hover:bg-teal-800 text-white">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule All Yearly Instances
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
