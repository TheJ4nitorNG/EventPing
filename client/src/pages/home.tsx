import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarPlus, Share2, Users } from "lucide-react";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Logo />
          <Link href="/create">
            <Button data-testid="button-create-event-header">
              <CalendarPlus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Simple Event RSVPs
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Create an event, share a link, collect Yes/No/Maybe votes. 
              No accounts, no complexity. Just quick answers.
            </p>
          </div>

          <Link href="/create">
            <Button size="lg" className="text-lg px-8" data-testid="button-create-event-hero">
              <CalendarPlus className="w-5 h-5 mr-2" />
              Create Your Event
            </Button>
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
            <Card className="bg-card/50">
              <CardContent className="pt-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-accent mx-auto flex items-center justify-center">
                  <CalendarPlus className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-medium">Create in Seconds</h3>
                <p className="text-sm text-muted-foreground">
                  Add a title, date, and optional details. Done.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="pt-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-accent mx-auto flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-medium">Share the Link</h3>
                <p className="text-sm text-muted-foreground">
                  Send your event link to anyone who needs to RSVP.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50">
              <CardContent className="pt-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-accent mx-auto flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-medium">Collect Responses</h3>
                <p className="text-sm text-muted-foreground">
                  See Yes, No, and Maybe counts instantly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>EventPing — Simple event RSVPs, no account required.</p>
      </footer>
    </div>
  );
}
