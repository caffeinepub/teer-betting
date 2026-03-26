export default function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const utmLink = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer className="border-t border-border bg-card-deep mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between gap-8">
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
              amount, win 80X profit.
            </p>
          </div>

          {/* Customer Support */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              Customer Support
            </p>
            <a
              href="https://t.me/CustomerSupport_Teer"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-semibold text-[#229ED9] hover:text-[#229ED9]/80 transition-colors"
            >
              <svg
                role="img"
                aria-label="Telegram"
                viewBox="0 0 24 24"
                className="w-5 h-5 fill-current flex-shrink-0"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              @CustomerSupport_Teer
            </a>
            <p className="text-xs text-muted-foreground">
              Available 24/7 on Telegram
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
