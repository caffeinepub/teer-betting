import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import AdminPage from "./components/AdminPage";
import Footer from "./components/Footer";
import Header from "./components/Header";
import HomePage from "./components/HomePage";
import MyBetsPage from "./components/MyBetsPage";
import WalletPage from "./components/WalletPage";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useIsAdmin } from "./hooks/useQueries";

type Tab = "home" | "wallet" | "bets" | "admin";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const { identity } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();

  // If not logged in and on auth-required tab, go back to home
  useEffect(() => {
    if (
      !identity &&
      (activeTab === "wallet" || activeTab === "bets" || activeTab === "admin")
    ) {
      setActiveTab("home");
    }
  }, [identity, activeTab]);

  // If not admin and on admin tab, go to home
  useEffect(() => {
    if (!isAdmin && activeTab === "admin") {
      setActiveTab("home");
    }
  }, [isAdmin, activeTab]);

  return (
    <div className="min-h-screen flex flex-col">
      <Toaster richColors position="top-right" />
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdmin={!!isAdmin}
      />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {activeTab === "home" && <HomePage setTab={setActiveTab} />}
        {activeTab === "wallet" && <WalletPage />}
        {activeTab === "bets" && <MyBetsPage />}
        {activeTab === "admin" && isAdmin && <AdminPage />}
      </main>
      <Footer />
    </div>
  );
}
