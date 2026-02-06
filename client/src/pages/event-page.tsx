import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { FormDescription } from "@/components/ui/form";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  FileText, 
  Check, 
  X, 
  HelpCircle,
  Lock,
  ThumbsUp,
  ThumbsDown,
  CircleHelp,
  Bell,
  Mail,
  Phone,
  Globe
} from "lucide-react";
import { Logo } from "@/components/logo";
import type { EventWithCounts, Response } from "@shared/schema";

function formatDateInTimezone(date: Date | string, timezone: string | null | undefined): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const tz = timezone || 'America/New_York';
  return d.toLocaleString('en-US', {
    timeZone: tz,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getTimezoneAbbrev(timezone: string | null | undefined): string {
  const tz = timezone || 'America/New_York';
  const abbrevMap: Record<string, string> = {
    'America/New_York': 'ET',
    'America/Chicago': 'CT',
    'America/Denver': 'MT',
    'America/Los_Angeles': 'PT',
    'America/Anchorage': 'AKT',
    'Pacific/Honolulu': 'HT',
    'Europe/London': 'GMT',
    'Europe/Paris': 'CET',
    'Europe/Berlin': 'CET',
    'Asia/Tokyo': 'JST',
    'Asia/Shanghai': 'CST',
    'Asia/Dubai': 'GST',
    'Australia/Sydney': 'AEST',
    'UTC': 'UTC',
  };
  return abbrevMap[tz] || tz;
}

const voteSchema = z.object({
  name: z.string().max(50).optional(),
  choice: z.enum(["yes", "no", "maybe"]),
  comment: z.string().max(140).optional(),
  email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  wantsReminder: z.boolean().optional(),
});

type VoteForm = z.infer<typeof voteSchema>;

export default function EventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<"yes" | "no" | "maybe" | null>(null);

  const form = useForm<VoteForm>({
    resolver: zodResolver(voteSchema),
    defaultValues: {
      name: "",
      comment: "",
      email: "",
      phone: "",
      wantsReminder: false,
    },
  });

  const watchEmail = form.watch("email");
  const watchPhone = form.watch("phone");
  const hasContactInfo = (watchEmail && watchEmail.length > 0) || (watchPhone && watchPhone.length > 0);

  const { data: event, isLoading, error } = useQuery<EventWithCounts>({
    queryKey: ["/api/events", eventId],
  });

  const voteMutation = useMutation({
    mutationFn: async (data: VoteForm) => {
      await apiRequest("POST", `/api/events/${eventId}/vote`, data);
    },
    onSuccess: () => {
      setHasVoted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/events", eventId] });
      toast({
        title: "Thanks!",
        description: "Your response has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVote = (choice: "yes" | "no" | "maybe") => {
    setSelectedChoice(choice);
  };

  const submitVote = () => {
    if (!selectedChoice) return;
    const formData = form.getValues();
    voteMutation.mutate({
      ...formData,
      choice: selectedChoice,
    });
  };

  const isVotingClosed = event ? new Date(event.startsAt) <= new Date() : false;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Logo />
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Logo />
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-destructive">Event Not Found</CardTitle>
              <CardDescription>
                This event doesn't exist or the link may be incorrect.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/">
                <Button>Go Home</Button>
              </Link>
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

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-2xl break-words" data-testid="text-event-title">
                  {event.title}
                </CardTitle>
              </div>
              {isVotingClosed && (
                <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3" />
                  Voting Closed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <span data-testid="text-event-date">
                  {formatDateInTimezone(event.startsAt, event.timezone)} ({getTimezoneAbbrev(event.timezone)})
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span data-testid="text-event-location">{event.location}</span>
                </div>
              )}
              {event.note && (
                <div className="flex items-start gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="whitespace-pre-wrap" data-testid="text-event-note">{event.note}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!isVotingClosed && !hasVoted && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Response</CardTitle>
              <CardDescription>
                Let the organizer know if you're coming
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <Button
                  type="button"
                  variant={selectedChoice === "yes" ? "default" : "outline"}
                  className={`h-20 flex flex-col gap-2 ${selectedChoice === "yes" ? "bg-green-600 hover:bg-green-700 border-green-600" : ""}`}
                  onClick={() => handleVote("yes")}
                  data-testid="button-vote-yes"
                >
                  <ThumbsUp className="w-6 h-6" />
                  <span className="font-medium">Yes</span>
                </Button>
                <Button
                  type="button"
                  variant={selectedChoice === "no" ? "default" : "outline"}
                  className={`h-20 flex flex-col gap-2 ${selectedChoice === "no" ? "bg-red-600 hover:bg-red-700 border-red-600" : ""}`}
                  onClick={() => handleVote("no")}
                  data-testid="button-vote-no"
                >
                  <ThumbsDown className="w-6 h-6" />
                  <span className="font-medium">No</span>
                </Button>
                <Button
                  type="button"
                  variant={selectedChoice === "maybe" ? "default" : "outline"}
                  className={`h-20 flex flex-col gap-2 ${selectedChoice === "maybe" ? "bg-yellow-600 hover:bg-yellow-700 border-yellow-600" : ""}`}
                  onClick={() => handleVote("maybe")}
                  data-testid="button-vote-maybe"
                >
                  <CircleHelp className="w-6 h-6" />
                  <span className="font-medium">Maybe</span>
                </Button>
              </div>

              {selectedChoice && (
                <Form {...form}>
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Name (optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Anonymous" 
                              {...field}
                              data-testid="input-voter-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comment (optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Add a short note..." 
                              className="resize-none"
                              rows={2}
                              maxLength={140}
                              {...field}
                              data-testid="input-voter-comment"
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground text-right">
                            {field.value?.length || 0}/140
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="border-t pt-4 mt-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Bell className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">Get a reminder (optional)</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        We'll remind you about this event the day before
                      </p>

                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="email"
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
                                  data-testid="input-voter-email"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
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
                                  data-testid="input-voter-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {hasContactInfo && (
                          <FormField
                            control={form.control}
                            name="wantsReminder"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="checkbox-voter-reminder"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Send me a reminder
                                  </FormLabel>
                                  <FormDescription>
                                    Get a notification the day before the event
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={submitVote}
                      className="w-full"
                      disabled={voteMutation.isPending}
                      data-testid="button-submit-vote"
                    >
                      {voteMutation.isPending ? "Submitting..." : "Submit Response"}
                    </Button>
                  </div>
                </Form>
              )}
            </CardContent>
          </Card>
        )}

        {hasVoted && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 mx-auto flex items-center justify-center mb-3">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <p className="font-medium text-green-500" data-testid="text-vote-confirmed">Thanks! Your response has been recorded.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-green-500" data-testid="text-yes-count">
                  {event.yesCount}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> Yes
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-red-500" data-testid="text-no-count">
                  {event.noCount}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <ThumbsDown className="w-3 h-3" /> No
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-yellow-500" data-testid="text-maybe-count">
                  {event.maybeCount}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <CircleHelp className="w-3 h-3" /> Maybe
                </div>
              </div>
            </div>

            {event.responses.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-3">
                {event.responses.map((response: Response) => (
                  <div 
                    key={response.id} 
                    className="flex items-start gap-3 p-3 rounded-md bg-muted/50"
                    data-testid={`response-item-${response.id}`}
                  >
                    <div className="shrink-0">
                      {response.choice === "yes" && (
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                      )}
                      {response.choice === "no" && (
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                          <X className="w-4 h-4 text-red-500" />
                        </div>
                      )}
                      {response.choice === "maybe" && (
                        <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                          <HelpCircle className="w-4 h-4 text-yellow-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {response.name || "Anonymous"}
                      </p>
                      {response.comment && (
                        <p className="text-sm text-muted-foreground mt-1 break-words">
                          {response.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {event.responses.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <p>No responses yet. Be the first!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
