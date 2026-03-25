import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, LogOut, User, Wallet } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUserProfile } from "../hooks/useQueries";

type Tab = "home" | "wallet" | "bets" | "admin";

interface HeaderProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  isAdmin: boolean;
}

export default function Header({
  activeTab,
  setActiveTab,
  isAdmin,
}: HeaderProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const isLoggedIn = !!identity;

  const navLinks: { label: string; tab: Tab; requiresAuth?: boolean }[] = [
    { label: "Home", tab: "home" },
    { label: "Wallet", tab: "wallet", requiresAuth: true },
    { label: "My Bets", tab: "bets", requiresAuth: true },
    ...(isAdmin ? [{ label: "Admin", tab: "admin" as Tab }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-card-deep border-b border-border backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setActiveTab("home")}
        >
          <div className="w-8 h-8 rounded-lg bg-neon flex items-center justify-center">
            <span className="text-sm font-bold text-black">T</span>
          </div>
          <span className="font-bold text-xl tracking-widest text-foreground uppercase">
            TEER
          </span>
        </button>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks
            .filter((l) => !l.requiresAuth || isLoggedIn)
            .map((link) => (
              <button
                key={link.tab}
                type="button"
                data-ocid={`nav.${link.tab}.link`}
                onClick={() => setActiveTab(link.tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === link.tab
                    ? "text-neon bg-neon/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {link.label}
              </button>
            ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoggedIn && profile && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/40 bg-gold/10">
              <Wallet className="w-3.5 h-3.5 text-gold" />
              <span className="text-gold font-bold text-sm">
                ₹{profile.wallet.toString()}
              </span>
            </div>
          )}

          {isLoggedIn && (
            <button
              type="button"
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  data-ocid="nav.account.dropdown_menu"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border hover:border-neon/40 transition-colors text-sm text-muted-foreground hover:text-foreground"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Account</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="bg-card-mid border-border"
              >
                <DropdownMenuItem className="text-muted-foreground text-xs cursor-default">
                  {identity?.getPrincipal().toString().slice(0, 20)}...
                </DropdownMenuItem>
                <DropdownMenuItem
                  data-ocid="nav.logout.button"
                  onClick={clear}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              data-ocid="nav.login.button"
              onClick={login}
              disabled={isLoggingIn}
              size="sm"
              className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full px-5"
            >
              {isLoggingIn ? "Connecting..." : "Login"}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-2 overflow-x-auto">
        {navLinks
          .filter((l) => !l.requiresAuth || isLoggedIn)
          .map((link) => (
            <button
              key={link.tab}
              type="button"
              data-ocid={`mobile.nav.${link.tab}.link`}
              onClick={() => setActiveTab(link.tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === link.tab
                  ? "text-neon bg-neon/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </button>
          ))}
      </div>
    </header>
  );
}
