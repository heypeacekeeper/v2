import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  Users,
  BookOpen,
  Bot,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Community Feed",
    description: "Connect with fellow founders, share updates, and get feedback",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Resources Library",
    description: "Curated tools, templates, and guides for every startup stage",
  },
  {
    icon: <Bot className="w-6 h-6" />,
    title: "Jarvis AI",
    description: "Your personal AI assistant for startup advice and strategy",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold">StartiGeniX</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="px-4 py-20 max-w-4xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm">
          <Sparkles className="w-4 h-4" />
          The ultimate startup launchpad
        </div>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance leading-tight">
          Launch your startup journey with confidence
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance leading-relaxed">
          StartiGeniX is the all-in-one platform for student founders. Connect with peers, access curated resources, and get AI-powered guidance every step of the way.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">
              Start for free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      </section>

      <section className="px-4 py-16 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-2xl bg-card border border-border space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-lg">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-16 max-w-4xl mx-auto text-center space-y-6">
        <h2 className="text-2xl font-bold">Ready to start building?</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Join thousands of student founders who are turning their ideas into reality with StartiGeniX.
        </p>
        <Button size="lg" asChild>
          <Link href="/auth/sign-up">
            Get started today
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </section>

      <footer className="px-4 py-8 border-t border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-primary" />
            <span>StartiGeniX</span>
          </div>
          <p>Built for founders, by founders.</p>
        </div>
      </footer>
    </main>
  );
}
