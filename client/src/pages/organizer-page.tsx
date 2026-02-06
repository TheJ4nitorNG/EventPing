import { Link, useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  FileText, 
  Check, 
  X, 
  HelpCircle,
  Lock,
  Shield,
  ThumbsUp,
  ThumbsDown,
  CircleHelp,
  Copy
} from "lucide-react";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
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

export default function OrganizerPage() {
  const params = useParams<{ id: string }>();
  const search = useSearch();
  const eventId = params.id;
  const urlParams = new URLSearchParams(search);
  const token = urlParams.get("token");
  const { toast } = useToast();

  const { data: event, isLoading, error } = useQuery<EventWithCounts>({
    queryKey: ["/api/events", eventId, "organizer", token],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}/organizer?token=${token}`);
      if (!res.ok) {
        throw new Error("Unauthorized or event not found");
      }
      return res.json();
    },
    enabled: !!token,
  });

  const getBaseUrl = () => window.location.origin;

  const copyPublicLink = async () => {
    const publicUrl = `${getBaseUrl()}/e/${eventId}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast({
        title: "Copied!",
        description: "Public link copied to clipboard.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const isVotingClosed = event ? new Date(event.startsAt) <= new Date() : false;

  if (!token) {
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
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                A valid organizer token is required to view this page.
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
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                Invalid token or event not found.
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
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-primary">
              <Shield className="w-5 h-5" />
              <span className="font-medium">Organizer View</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Only you can see this dashboard with your private link.
            </p>
          </CardContent>
        </Card>

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

            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={copyPublicLink}
                data-testid="button-copy-public-link"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Public Link
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Response Summary</CardTitle>
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

            <div className="text-center pt-2">
              <span className="text-lg font-medium">
                {event.yesCount + event.noCount + event.maybeCount} total responses
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Responses</CardTitle>
            <CardDescription>
              View all responses from your attendees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {event.responses.length > 0 ? (
              <div className="space-y-3">
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
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {response.name || "Anonymous"}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(response.createdAt!), "MMM d, h:mm a")}
                        </span>
                      </div>
                      {response.comment && (
                        <p className="text-sm text-muted-foreground mt-1 break-words">
                          {response.comment}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-2">No responses yet</p>
                <p className="text-sm">Share the public link to start collecting RSVPs!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
