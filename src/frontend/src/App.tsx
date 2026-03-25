import { Toaster } from "@/components/ui/sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import AdminPage from "./components/AdminPage";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import MyBetsPage from "./components/MyBetsPage";
import WalletPage from "./components/WalletPage";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin } from "./hooks/useQueries";

type Tab = "home" | "wallet" | "bets" | "admin";

function getInitialTab(): Tab {
  const hash = window.location.hash.replace("#", "");
  if (["home", "wallet", "bets", "admin"].includes(hash)) return hash as Tab;
  return "home";
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);
  const { identity, isInitializing } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const { actor } = useActor();
  const registeredRef = useRef(false);

  const handleSetTab = useCallback((tab: Tab) => {
    setActiveTab(tab);
    window.location.hash = tab === "home" ? "" : tab;
  }, []);

  // Auto-register user profile on first login so they appear in admin panel
  useEffect(() => {
    if (!actor || !identity || registeredRef.current) return;
    registeredRef.current = true;
    actor
      .saveCallerUserProfile({ userId: BigInt(0), wallet: BigInt(0) })
      .catch(() => {
        registeredRef.current = false;
      });
  }, [actor, identity]);

  // Wait for auth to initialize before redirecting away from protected tabs
  useEffect(() => {
    if (isInitializing) return;
    if (
      !identity &&
      (activeTab === "wallet" || activeTab === "bets" || activeTab === "admin")
    ) {
      handleSetTab("home");
    }
  }, [identity, isInitializing, activeTab, handleSetTab]);

  // If not admin and on admin tab, go to home
  useEffect(() => {
    if (isAdmin === false && activeTab === "admin") {
      handleSetTab("home");
    }
  }, [isAdmin, activeTab, handleSetTab]);

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster richColors position="top-right" />
      <Header
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        isAdmin={!!isAdmin}
      />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {activeTab === "home" && <HomePage setTab={handleSetTab} />}
        {activeTab === "wallet" && <WalletPage />}
        {activeTab === "bets" && <MyBetsPage />}
        {activeTab === "admin" && isAdmin && <AdminPage />}
      </main>
      <Footer />
    </div>
  );
}
