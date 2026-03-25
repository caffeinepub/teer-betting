export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const utmLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="border-t border-border bg-card-deep mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-neon flex items-center justify-center">
                <span className="text-xs font-bold text-black">T</span>
              </div>
              <span className="font-bold text-lg tracking-widest uppercase text-foreground">
                TEER
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs">
              A fair and transparent number betting game. Pick 00–99, bet your
              amount, win 8X profit.
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 items-start">
            {["About", "Terms", "Privacy", "Support", "Fair Play"].map(
              (link) => (
                <a
                  key={link}
                  href="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link}
                </a>
              ),
            )}
          </nav>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-muted-foreground">
            © {year}. Built with ❤️ using{" "}
            <a
              href={utmLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon hover:underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-xs text-muted-foreground">support@teer.game</p>
        </div>
      </div>
    </footer>
  );
}
