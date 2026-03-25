import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Hash, Loader2, TrendingUp, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useActiveDraw,
  useDrawHistory,
  usePlaceBet,
} from "../hooks/useQueries";
import NumberGrid from "./NumberGrid";

type SetTab = (tab: "home" | "wallet" | "bets" | "admin") => void;

interface HomePageProps {
  setTab: SetTab;
}

const HOW_IT_WORKS = [
  {
    id: "select",
    icon: <Hash className="w-8 h-8 text-neon" />,
    title: "Select Numbers",
    desc: "Pick any number from 00 to 99. Select multiple for more chances to win!",
  },
  {
    id: "bet",
    icon: <TrendingUp className="w-8 h-8 text-neon" />,
    title: "Place Your Bet",
    desc: "Enter your bet amount and confirm. Minimum ₹1 per number.",
  },
  {
    id: "win",
    icon: <Trophy className="w-8 h-8 text-gold" />,
    title: "Win 8X Profit",
    desc: "If your number is drawn, you win 8 times your bet amount instantly!",
  },
];

function pickRandomNumbers(count: number): number[] {
  const pool = Array.from({ length: 100 }, (_, i) => i);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function HomePage({ setTab }: HomePageProps) {
  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: activeDraw, isLoading: drawLoading } = useActiveDraw();
  const { data: history } = useDrawHistory();
  const placeBet = usePlaceBet();

  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [betAmount, setBetAmount] = useState("");
  const [housePickNote, setHousePickNote] = useState(false);

  const toggleNumber = (n: number) => {
    setHousePickNote(false);
    setSelectedNumbers((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n],
    );
  };

  const handleQuickPick = () => {
    const nums = pickRandomNumbers(5);
    setSelectedNumbers(nums);
    setHousePickNote(false);
  };

  const handleHousePick = () => {
    const nums = pickRandomNumbers(10);
    setSelectedNumbers(nums);
    setHousePickNote(true);
  };

  const handleClearAll = () => {
    setSelectedNumbers([]);
    setHousePickNote(false);
  };

  const handlePlaceBet = async () => {
    if (!activeDraw) return;
    if (selectedNumbers.length === 0) {
      toast.error("Please select at least one number");
      return;
    }
    const amount = Number.parseInt(betAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid bet amount");
      return;
    }
    try {
      for (const num of selectedNumbers) {
        await placeBet.mutateAsync({
          drawId: activeDraw.id,
          number: BigInt(num),
          amount: BigInt(amount),
        });
      }
      toast.success(`Bet placed on ${selectedNumbers.length} number(s)!`);
      setSelectedNumbers([]);
      setBetAmount("");
      setHousePickNote(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to place bet");
    }
  };

  const settledHistory = (history ?? []).filter(
    (d) => d.status.__kind__ === "settled",
  );

  const isDrawOpen = activeDraw?.status.__kind__ === "open";
  const isInteractive = isLoggedIn;

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl bg-card-deep border border-border p-8 md:p-12">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              "radial-gradient(ellipse at 70% 50%, oklch(0.79 0.22 148) 0%, transparent 60%)",
          }}
        />
        <div className="relative grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-5"
          >
            <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-tight leading-tight">
              TEER: CHOOSE YOUR
              <br />
              NUMBERS.
              <br />
              <span className="text-gold">WIN 8X PROFIT!</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-md">
              Pick any number from 00 to 99, place your bet and win 8 times your
              stake instantly when your number hits. Fast, fair, and thrilling.
            </p>
            <div className="flex flex-wrap gap-3">
              {isLoggedIn ? (
                <Button
                  data-ocid="hero.place_bet.primary_button"
                  onClick={() =>
                    document
                      .getElementById("current-draw")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full px-6 py-2.5 neon-glow"
                >
                  PLACE YOUR BET NOW
                </Button>
              ) : (
                <Button
                  data-ocid="hero.login.primary_button"
                  onClick={login}
                  className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full px-6 py-2.5 neon-glow"
                >
                  LOGIN TO PLAY
                </Button>
              )}
              <Button
                data-ocid="hero.how_to_play.secondary_button"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                variant="outline"
                className="rounded-full px-6 py-2.5 border-border text-foreground hover:border-neon/50"
              >
                LEARN HOW TO PLAY
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="w-48 h-48 rounded-2xl border-2 border-neon/30 bg-card-mid flex flex-col items-center justify-center gap-3 neon-glow">
                <TrendingUp className="w-12 h-12 text-neon" />
                <div className="text-center">
                  <p className="text-4xl font-bold text-neon">8X</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">
                    Profit
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-card-deep border border-neon/30 text-neon text-xs font-bold whitespace-nowrap">
                {isDrawOpen ? "🟢 DRAW OPEN" : "⏳ AWAITING DRAW"}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CURRENT DRAW */}
      <section id="current-draw">
        <Card className="bg-card-deep border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold uppercase tracking-wide">
              Current Draw
            </CardTitle>
            {activeDraw?.status.__kind__ === "open" && (
              <Badge className="bg-neon/20 text-neon border-neon/30 border">
                OPEN
              </Badge>
            )}
            {activeDraw?.status.__kind__ === "closed" && (
              <Badge className="bg-gold/20 text-gold border-gold/30 border">
                CLOSED
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {drawLoading ? (
              <div
                data-ocid="draw.loading_state"
                className="flex items-center justify-center py-12"
              >
                <Loader2 className="w-8 h-8 animate-spin text-neon" />
              </div>
            ) : isInteractive ? (
              /* Full interactive betting flow */
              <div className="space-y-5">
                {/* Quick Pick & House Pick Buttons */}
                <div className="flex gap-3 flex-wrap items-center mb-2">
                  <button
                    type="button"
                    data-ocid="bet.quick_pick.button"
                    disabled={placeBet.isPending}
                    onClick={handleQuickPick}
                    className="bg-neon/20 border border-neon text-neon hover:bg-neon/30 font-bold rounded-full px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    ⚡ QUICK PICK (5)
                  </button>
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      data-ocid="bet.house_pick.button"
                      disabled={placeBet.isPending}
                      onClick={handleHousePick}
                      className="bg-gold/20 border border-gold text-gold hover:bg-gold/30 font-bold rounded-full px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      🏠 HOUSE SELECT (10)
                    </button>
                    {housePickNote && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-gold/70 text-center"
                      >
                        10 lucky house numbers selected!
                      </motion.p>
                    )}
                  </div>
                  {selectedNumbers.length > 0 && (
                    <button
                      type="button"
                      data-ocid="bet.clear_all.button"
                      onClick={handleClearAll}
                      className="ml-auto text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                <NumberGrid
                  selected={selectedNumbers}
                  onToggle={toggleNumber}
                  disabled={placeBet.isPending}
                />
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="space-y-1 flex-1">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                      Bet Amount (₹)
                    </p>
                    <Input
                      data-ocid="bet.amount.input"
                      type="number"
                      min="1"
                      placeholder="Enter amount"
                      value={betAmount}
                      onChange={(e) => setBetAmount(e.target.value)}
                      className="bg-card-mid border-border focus:border-neon text-foreground"
                    />
                  </div>
                  {selectedNumbers.length > 0 && betAmount && (
                    <div className="text-sm text-muted-foreground space-y-0.5 min-w-[140px]">
                      <p>
                        Numbers:{" "}
                        <span className="text-neon font-bold">
                          {selectedNumbers.length}
                        </span>
                      </p>
                      <p>
                        Total:{" "}
                        <span className="text-gold font-bold">
                          ₹
                          {(
                            selectedNumbers.length *
                            Number.parseInt(betAmount || "0")
                          ).toLocaleString()}
                        </span>
                      </p>
                      <p>
                        Win:{" "}
                        <span className="text-neon font-bold">
                          ₹
                          {(
                            selectedNumbers.length *
                            Number.parseInt(betAmount || "0") *
                            8
                          ).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 items-stretch">
                    {!isDrawOpen && (
                      <motion.div
                        data-ocid="draw.waiting.panel"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 rounded-lg border border-border bg-card-mid px-4 py-2 text-sm text-muted-foreground"
                      >
                        <span>⏳</span>
                        <span>Waiting for draw to open...</span>
                      </motion.div>
                    )}
                    <Button
                      data-ocid="bet.confirm.primary_button"
                      onClick={handlePlaceBet}
                      disabled={
                        placeBet.isPending ||
                        selectedNumbers.length === 0 ||
                        !betAmount ||
                        !isDrawOpen
                      }
                      className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full px-8 neon-glow"
                    >
                      {placeBet.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Placing...
                        </>
                      ) : (
                        "CONFIRM BET"
                      )}
                    </Button>
                  </div>
                </div>
                {selectedNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedNumbers.map((n) => (
                      <button
                        key={n}
                        type="button"
                        className="px-2 py-0.5 rounded-full bg-neon text-black text-xs font-bold cursor-pointer"
                        onClick={() => toggleNumber(n)}
                      >
                        {n.toString().padStart(2, "0")} ✕
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Preview mode — grid always visible, CTA overlay below */
              <div className="space-y-5">
                <div className="relative">
                  <NumberGrid
                    selected={[]}
                    onToggle={() => {}}
                    disabled={true}
                  />
                  {/* Subtle gradient fade at the bottom of the grid */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none rounded-b-lg"
                    style={{
                      background:
                        "linear-gradient(to bottom, transparent, oklch(0.15 0.02 240 / 0.7))",
                    }}
                  />
                </div>

                {/* CTA banner */}
                <motion.div
                  data-ocid="draw.login.primary_button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-neon/30 bg-neon/5 px-6 py-4"
                >
                  <div>
                    <p className="font-bold text-foreground">Ready to play?</p>
                    <p className="text-sm text-muted-foreground">
                      Login to place bets on any number from 00 to 99.
                    </p>
                  </div>
                  <Button
                    onClick={login}
                    className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full px-8 neon-glow shrink-0"
                  >
                    Login to Place Bets
                  </Button>
                </motion.div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works">
        <h2 className="text-2xl font-bold uppercase tracking-widest text-center mb-8">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              viewport={{ once: true }}
            >
              <Card className="bg-card-deep border-border text-center p-6 hover:border-neon/30 transition-colors">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="font-bold uppercase tracking-wide mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LATEST RESULTS */}
      <section>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-card-deep border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold uppercase tracking-wide">
                Latest Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {settledHistory.length === 0 ? (
                <div
                  data-ocid="results.empty_state"
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No results yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-xs">
                        Draw ID
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Winner
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Date
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Prize
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settledHistory.slice(0, 10).map((draw, idx) => (
                      <TableRow
                        key={draw.id.toString()}
                        data-ocid={`results.item.${idx + 1}`}
                        className="border-border"
                      >
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          #{draw.id.toString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-neon font-bold text-sm">
                            {draw.status.__kind__ === "settled"
                              ? draw.status.settled.toString().padStart(2, "0")
                              : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(
                            Number(draw.createdAt) / 1_000_000,
                          ).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gold/20 text-gold border-gold/30 border text-xs">
                            8X
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card-deep border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold uppercase tracking-wide">
                Deposit & Withdrawal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Instant UPI Payments
              </p>
              <div className="flex gap-2 flex-wrap">
                {["BHIM UPI", "GPay", "PhonePe"].map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground"
                  >
                    {p}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  data-ocid="upi.deposit.primary_button"
                  onClick={() => setTab("wallet")}
                  className="flex-1 bg-neon text-black hover:bg-neon/90 font-bold rounded-full"
                >
                  Deposit
                </Button>
                <Button
                  data-ocid="upi.withdraw.secondary_button"
                  onClick={() => setTab("wallet")}
                  variant="outline"
                  className="flex-1 border-gold text-gold hover:bg-gold/10 font-bold rounded-full"
                >
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
