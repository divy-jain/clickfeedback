import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-clickfeedback.jpg";
import { MousePointerClick, MessageSquare, Code2, Camera, ShieldCheck, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground hero-surface">
      <header className="container mx-auto py-6">
        <nav className="flex items-center justify-between">
          <a href="#" aria-label="ClickFeedback Home" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-sidebar-ring" aria-hidden="true" />
            <span className="text-lg font-semibold">ClickFeedback</span>
          </a>
          <div className="flex items-center gap-3">
            <Button variant="link" asChild>
              <a href="#features">Features</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="#waitlist">Join Waitlist</a>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto grid gap-10 px-4 pb-8 pt-8 md:grid-cols-2 md:items-center md:gap-12 md:pb-16 md:pt-16">
          <div>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Right‑click feedback for any website
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Add “Give Feedback” to your browser’s right‑click menu. Capture screenshots, DOM selectors, and perfect context instantly.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="hero" asChild>
                <a href="#" aria-label="Get the Chrome Extension">Get the Chrome Extension</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="#waitlist">Join Waitlist</a>
              </Button>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">No setup. Works on any site. Free to start.</p>
          </div>
          <div className="relative">
            <img
              src={heroImage}
              alt="Browser context menu with ‘Give Feedback’ and highlighted UI element"
              className="w-full rounded-lg border shadow-xl"
              decoding="async"
              loading="eager"
            />
          </div>
        </section>

        <section id="features" className="container mx-auto px-4 py-12 md:py-16">
          <h2 className="text-2xl font-semibold">
            Why teams choose <span className="gradient-text">ClickFeedback</span>
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <article className="card-elevated p-6">
              <MousePointerClick className="text-primary" />
              <h3 className="mt-3 font-semibold">Native right‑click</h3>
              <p className="mt-1 text-muted-foreground">Works everywhere via the browser’s context menu—zero integration.</p>
            </article>
            <article className="card-elevated p-6">
              <Camera className="text-primary" />
              <h3 className="mt-3 font-semibold">Perfect visual context</h3>
              <p className="mt-1 text-muted-foreground">Auto‑captures and crops screenshots with a highlight around the element.</p>
            </article>
            <article className="card-elevated p-6">
              <Code2 className="text-primary" />
              <h3 className="mt-3 font-semibold">Actionable technical detail</h3>
              <p className="mt-1 text-muted-foreground">Exact DOM selectors, attributes, and page metadata—ready for devs.</p>
            </article>
            <article className="card-elevated p-6">
              <MessageSquare className="text-primary" />
              <h3 className="mt-3 font-semibold">Frictionless feedback</h3>
              <p className="mt-1 text-muted-foreground">Simple, guided form with categories and priority in one place.</p>
            </article>
            <article className="card-elevated p-6">
              <ShieldCheck className="text-primary" />
              <h3 className="mt-3 font-semibold">Privacy‑first</h3>
              <p className="mt-1 text-muted-foreground">Smart context capture with privacy‑respecting defaults.</p>
            </article>
            <article className="card-elevated p-6">
              <Zap className="text-primary" />
              <h3 className="mt-3 font-semibold">Faster resolution</h3>
              <p className="mt-1 text-muted-foreground">Cut clarification time and ship fixes faster with precise reports.</p>
            </article>
          </div>
        </section>

        <section id="waitlist" className="container mx-auto px-4 pb-16">
          <div className="card-elevated mx-auto max-w-xl p-6 md:p-8">
            <h2 className="text-xl font-semibold">Join the early access waitlist</h2>
            <p className="mt-1 text-muted-foreground">Be the first to try the extension and dashboard.</p>
            <form
              className="mt-4 flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const input = form.elements.namedItem('email') as HTMLInputElement;
                const email = input?.value?.trim();
                if (email) {
                  try {
                    const list = JSON.parse(localStorage.getItem('cf_waitlist') || '[]');
                    if (!list.includes(email)) {
                      list.push(email);
                      localStorage.setItem('cf_waitlist', JSON.stringify(list));
                    }
                    alert('Thanks! We\'ll be in touch soon.');
                    input.value = '';
                  } catch (_) {
                    alert('Thanks! We\'ll be in touch soon.');
                  }
                }
              }}
            >
              <input
                type="email"
                name="email"
                required
                placeholder="you@company.com"
                className="flex-1 rounded-md border bg-background px-4 py-3 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Your email"
              />
              <Button type="submit" className="sm:self-stretch">Notify me</Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">We’ll only email you about ClickFeedback. Unsubscribe anytime.</p>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <span className="text-sm text-muted-foreground">© {new Date().getFullYear()} ClickFeedback</span>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#waitlist" className="text-muted-foreground hover:text-foreground transition-colors">Waitlist</a>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Index;
