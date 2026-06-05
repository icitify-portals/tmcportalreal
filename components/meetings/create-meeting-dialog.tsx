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
import { Checkbox } from "@/components/ui/checkbox";
import { createMeeting } from "@/lib/actions/meetings";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledAt: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  venue: z.string().optional(),
  groupId: z.string().min(1, "Group is required"),
  isOnline: z.boolean().default(false),
  meetingLink: z.string().optional(),
  previousMinutesUrl: z.string().optional(),
  frequency: z.enum(['ONCE', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'CUSTOM']).optional().default('ONCE'),
  rruleString: z.string().optional(),
  occurrences: z.coerce.number().min(1).max(52).optional().default(5)
});

interface CreateMeetingDialogProps {
  members: { id: string; name: string | null }[];
  currentOrgId: string; // Admin's org
  isSuperAdmin?: boolean;
}

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMeetingGroups } from "@/lib/actions/meetings";
import { getOrganizations } from "@/lib/actions/organization";
import { useEffect } from "react";
import { Upload, Copy, Check } from "lucide-react";
import { FormJurisdictionSelector } from "./form-jurisdiction-selector";

export function CreateMeetingDialog({
  members,
  currentOrgId,
  isSuperAdmin,
}: CreateMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [organizationsList, setOrganizationsList] = useState<any[]>([]);
  const [minutesFile, setMinutesFile] = useState<File | null>(null);
  const [createdMeeting, setCreatedMeeting] = useState<{ id: string, shareCode?: string, title: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setMinutesFile(null);
      setCreatedMeeting(null);
      setCopied(false);
      getMeetingGroups(currentOrgId).then(setGroups);
    }
  }, [open, currentOrgId]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      scheduledAt: "",
      time: "",
      venue: "",
      groupId: "",
      meetingLink: "",
      isOnline: false,
      previousMinutesUrl: "",
      frequency: "ONCE" as "ONCE" | "WEEKLY" | "BI_WEEKLY" | "MONTHLY" | "CUSTOM",
      rruleString: "",
      occurrences: 5,
    },
  });

  // Groups fetched on open

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    try {
      let minuteUrl = "";
      if (minutesFile) {
        const formData = new FormData();
        formData.append("file", minutesFile);
        formData.append("category", "minutes");
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          minuteUrl = uploadData.url;
        } else {
          toast.error("Failed to upload minutes");
          setIsPending(false);
          return;
        }
      }

      // Combine date and time
      const date = new Date(values.scheduledAt);
      const [hours, mins] = values.time.split(":");
      date.setHours(parseInt(hours), parseInt(mins));

      const res = await createMeeting({
        ...values,
        scheduledAt: date.toISOString(),
        groupId: values.groupId,
        previousMinutesUrl: minuteUrl || undefined,
        attendees: [],
      });

      if (res.success) {
        toast.success("Meeting scheduled and Notifications sent");
        setCreatedMeeting({ id: res.meetingId, shareCode: res.shareCode, title: values.title });
        form.reset();
        setMinutesFile(null);
      } else {
        toast.error(res.error || "Failed");
      }
    } catch (error) {
      toast.error("Error creating meeting");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Schedule Meeting</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{createdMeeting ? "Meeting Created Successfully" : "Schedule New Meeting"}</DialogTitle>
          <DialogDescription>
            {createdMeeting ? "Your meeting is ready. Share the link below with your invitees." : "Create a meeting. Officials in this jurisdiction will be invited automatically."}
          </DialogDescription>
        </DialogHeader>

        {createdMeeting ? (
          <div className="flex flex-col items-center justify-center p-6 space-y-6">
            <div className="bg-green-50 text-green-700 p-4 rounded-full">
              <Check className="h-10 w-10" />
            </div>
            <h3 className="text-lg font-semibold">{createdMeeting.title}</h3>
            
            <div className="w-full space-y-2">
              <p className="text-sm font-medium">Shareable Guest Link</p>
              <div className="flex gap-2">
                <Input readOnly value={`${window.location.origin}/live/${createdMeeting.shareCode}`} className="bg-muted" />
                <Button variant="outline" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/live/${createdMeeting.shareCode}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success("Link copied!");
                }}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="w-full flex flex-col gap-3 pt-4 border-t">
              <Button asChild className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                <a href={`https://wa.me/?text=${encodeURIComponent(`Join our meeting: ${createdMeeting.title}\n\nLink: ${window.location.origin}/live/${createdMeeting.shareCode}`)}`} target="_blank" rel="noreferrer">
                  Share via WhatsApp
                </a>
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Monthly Exco Meeting"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="groupId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Group</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4">
                <FormItem>
                  <FormLabel>Previous Minutes (Optional)</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        setMinutesFile(e.target.files?.[0] || null)
                      }
                      className="cursor-pointer"
                    />
                    {minutesFile && (
                      <Upload className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <FormDescription>
                    Upload to share with all invitees
                  </FormDescription>
                </FormItem>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="isOnline"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 flex-1">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Online Meeting</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ONCE">Does not repeat</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="BI_WEEKLY">Bi-Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="CUSTOM">Custom (Google Calendar Rule)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("frequency") === "CUSTOM" && (
                  <FormField
                    control={form.control}
                    name="rruleString"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recurrence Rule (RRULE)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. FREQ=MONTHLY;BYDAY=2SA" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Use iCalendar standards. For example, 'Second Saturday of every month' is <b>FREQ=MONTHLY;BYDAY=2SA</b>.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("frequency") !== "ONCE" && form.watch("frequency") !== "CUSTOM" && (
                  <FormField
                    control={form.control}
                    name="occurrences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Occurrences</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={1} 
                            max={52} 
                            {...field} 
                            value={field.value as number | string}
                            onChange={e => field.onChange(parseInt(e.target.value) || 5)} 
                          />
                        </FormControl>
                        <FormDescription>How many meetings to generate</FormDescription>
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {form.watch("isOnline") ? (
                <FormField
                  control={form.control}
                  name="meetingLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Meeting Link (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://zoom.us/... (Leave blank for native room)"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave this blank to automatically generate a native
                        200-person capacity virtual room.
                      </FormDescription>
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Conference Room" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}



              <DialogFooter>
                <Button type="submit" disabled={isPending} className="w-full">
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Schedule Meeting
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
