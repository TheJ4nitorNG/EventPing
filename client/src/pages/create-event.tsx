import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CalendarPlus, Copy, Check, ExternalLink, Bell, Mail, Phone, Globe } from "lucide-react";
import { Logo } from "@/components/logo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Anchorage", label: "Alaska Time (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii Time (HT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
  { value: "Europe/Berlin", label: "Berlin (CET/CEST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "UTC", label: "UTC" },
];

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
  startsAt: z.string().min(1, "Date and time is required"),
  timezone: z.string().min(1, "Timezone is required"),
  location: z.string().max(200).optional(),
  note: z.string().max(500).optional(),
  organizerEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  organizerPhone: z.string().max(20).optional(),
  reminderDayBefore: z.boolean().optional(),
  reminderDayOf: z.boolean().optional(),
});

type CreateEventForm = z.infer<typeof createEventSchema>;

type CreateEventResult = {
  eventId: string;
  organizerToken: string;
};

export default function CreateEvent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [result, setResult] = useState<CreateEventResult | null>(null);
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedOrganizer, setCopiedOrganizer] = useState(false);

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const defaultTimezone = TIMEZONES.find(tz => tz.value === browserTimezone)?.value || "America/New_York";

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      startsAt: "",
      timezone: defaultTimezone,
      location: "",
      note: "",
      organizerEmail: "",
      organizerPhone: "",
      reminderDayBefore: false,
      reminderDayOf: false,
    },
  });

  const watchEmail = form.watch("organizerEmail");
  const watchPhone = form.watch("organizerPhone");
  const hasContactInfo = (watchEmail && watchEmail.length > 0) || (watchPhone && watchPhone.length > 0);

  const createMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      const res = await apiRequest("POST", "/api/events", data);
      return await res.json() as CreateEventResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Event created!",
        description: "Share the public link to collect RSVPs.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateEventForm) => {
    createMutation.mutate(data);
  };

  const getBaseUrl = () => {
    return window.location.origin;
  };

  const copyToClipboard = async (text: string, type: "public" | "organizer") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "public") {
        setCopiedPublic(true);
        setTimeout(() => setCopiedPublic(false), 2000);
      } else {
        setCopiedOrganizer(true);
        setTimeout(() => setCopiedOrganizer(false), 2000);
      }
      toast({
        title: "Copied!",
        description: "Link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  if (result) {
    const publicUrl = `${getBaseUrl()}/e/${result.eventId}`;
    const organizerUrl = `${getBaseUrl()}/o/${result.eventId}?token=${result.organizerToken}`;

    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back-home">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Logo />
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/10 mx-auto flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Event Created!</CardTitle>
              <CardDescription>
                Share these links to collect RSVPs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Public Link (share with attendees)</label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={publicUrl} 
                    className="font-mono text-sm"
                    data-testid="input-public-url"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(publicUrl, "public")}
                    data-testid="button-copy-public-url"
                  >
                    {copiedPublic ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Link href={`/e/${result.eventId}`}>
                    <Button variant="outline" size="icon" data-testid="button-open-public-url">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Organizer Link (keep this private)</label>
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={organizerUrl} 
                    className="font-mono text-sm"
                    data-testid="input-organizer-url"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(organizerUrl, "organizer")}
                    data-testid="button-copy-organizer-url"
                  >
                    {copiedOrganizer ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Link href={`/o/${result.eventId}?token=${result.organizerToken}`}>
                    <Button variant="outline" size="icon" data-testid="button-open-organizer-url">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  This link lets you view all responses. Keep it safe!
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <Link href={`/e/${result.eventId}`}>
                  <Button className="w-full" data-testid="button-view-event">
                    View Event Page
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setResult(null);
                    form.reset();
                  }}
                  data-testid="button-create-another"
                >
                  Create Another Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back-home">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Logo />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="w-5 h-5" />
              Create Event
            </CardTitle>
            <CardDescription>
              Fill in the details below to create your event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Team lunch, Birthday party, etc." 
                          {...field}
                          data-testid="input-title"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startsAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time *</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local"
                          {...field}
                          data-testid="input-starts-at"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Time Zone *
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-timezone">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Office, Restaurant, Online..." 
                          {...field}
                          data-testid="input-location"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional details..." 
                          className="resize-none"
                          rows={3}
                          {...field}
                          data-testid="input-note"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Reminders (optional)</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get notified about your event with a summary of RSVPs
                  </p>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="organizerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="your@email.com" 
                              {...field}
                              data-testid="input-organizer-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="organizerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number (for SMS)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="tel"
                              placeholder="+1 555 123 4567" 
                              {...field}
                              data-testid="input-organizer-phone"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {hasContactInfo && (
                      <div className="space-y-3 pt-2">
                        <FormField
                          control={form.control}
                          name="reminderDayBefore"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-reminder-day-before"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Remind me 1 day before
                                </FormLabel>
                                <FormDescription>
                                  Get a summary of RSVPs 24 hours before your event
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="reminderDayOf"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="checkbox-reminder-day-of"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  Remind me on the day
                                </FormLabel>
                                <FormDescription>
                                  Get a final RSVP count the morning of your event
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMutation.isPending}
                  data-testid="button-submit-create"
                >
                  {createMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
