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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  CreditCard,
  ListOrdered,
  Loader2,
  Play,
  Square,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_pending_approved_rejected } from "../backend.d";
import {
  useActiveDraw,
  useAllBets,
  useAllTransactions,
  useAllUserProfiles,
  useApproveTransaction,
  useCloseDraw,
  useDrawHistory,
  usePendingRequests,
  useRejectTransaction,
  useSettleDraw,
  useStartDraw,
} from "../hooks/useQueries";

export default function AdminPage() {
  const { data: activeDraw } = useActiveDraw();
  const { data: drawHistory } = useDrawHistory();
  const { data: pendingRequests } = usePendingRequests();
  const { data: allTransactions } = useAllTransactions();
  const { data: allUsers } = useAllUserProfiles();
  const { data: allBets } = useAllBets();

  const startDraw = useStartDraw();
  const closeDraw = useCloseDraw();
  const settleDraw = useSettleDraw();
  const approveTransaction = useApproveTransaction();
  const rejectTransaction = useRejectTransaction();

  const [winnerNumber, setWinnerNumber] = useState("");
  const [activeAdminTab, setActiveAdminTab] = useState("draws");

  const handleStartDraw = async () => {
    try {
      await startDraw.mutateAsync();
      toast.success("New draw started!");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start draw");
    }
  };

  const handleCloseDraw = async () => {
    if (!activeDraw) return;
    try {
      await closeDraw.mutateAsync(activeDraw.id);
      toast.success("Draw closed!");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to close draw");
    }
  };

  const handleSettle = async () => {
    if (!activeDraw) return;
    const num = Number.parseInt(winnerNumber);
    if (Number.isNaN(num) || num < 0 || num > 99) {
      toast.error("Enter a valid number (00-99)");
      return;
    }
    try {
      await settleDraw.mutateAsync({
        drawId: activeDraw.id,
        winningNumber: BigInt(num),
      });
      toast.success(
        `Draw settled! Winning number: ${num.toString().padStart(2, "0")}`,
      );
      setWinnerNumber("");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to settle draw");
    }
  };

  const handleApprove = async (id: bigint) => {
    try {
      await approveTransaction.mutateAsync(id);
      toast.success("Transaction approved!");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to approve");
    }
  };

  const handleReject = async (id: bigint) => {
    try {
      await rejectTransaction.mutateAsync(id);
      toast.success("Transaction rejected");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reject");
    }
  };

  const statusBadge = (status: Variant_pending_approved_rejected) => {
    if (status === Variant_pending_approved_rejected.approved)
      return (
        <Badge className="bg-neon/20 text-neon border-neon/30 border text-xs">
          Approved
        </Badge>
      );
    if (status === Variant_pending_approved_rejected.rejected)
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 border text-xs">
          Rejected
        </Badge>
      );
    return (
      <Badge className="bg-gold/20 text-gold border-gold/30 border text-xs">
        Pending
      </Badge>
    );
  };

  const QUICK_LINKS = [
    { label: "Manage Draws", icon: <Play className="w-4 h-4" />, tab: "draws" },
    {
      label: "Transactions",
      icon: <CreditCard className="w-4 h-4" />,
      tab: "transactions",
    },
    { label: "Users", icon: <Users className="w-4 h-4" />, tab: "users" },
    {
      label: "All Bets",
      icon: <ListOrdered className="w-4 h-4" />,
      tab: "bets",
    },
  ];

  const pendingCount = pendingRequests?.length ?? 0;

  const STATS = [
    {
      label: "Total Users",
      value: allUsers?.length ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: "text-neon",
      bg: "bg-neon/10",
    },
    {
      label: "Total Bets",
      value: allBets?.length ?? 0,
      icon: <ListOrdered className="w-5 h-5" />,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: <Activity className="w-5 h-5" />,
      color: pendingCount > 0 ? "text-gold" : "text-muted-foreground",
      bg: pendingCount > 0 ? "bg-gold/10" : "bg-muted/10",
    },
    {
      label: "Total Transactions",
      value: allTransactions?.length ?? 0,
      icon: <CreditCard className="w-5 h-5" />,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest leading-tight">
            Admin Panel
          </h2>
          <p className="text-xs text-muted-foreground tracking-wide">
            Manage draws, transactions, and users
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map((stat) => (
          <Card key={stat.label} className="bg-card-deep border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}
              >
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {QUICK_LINKS.map((item) => (
          <button
            key={item.tab}
            type="button"
            data-ocid={`admin.${item.tab}.link`}
            onClick={() => setActiveAdminTab(item.tab)}
            className="flex items-center gap-2 p-3 rounded-xl bg-card-mid border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-neon/30 transition-colors cursor-pointer"
          >
            <span className="text-neon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <Tabs
        value={activeAdminTab}
        onValueChange={setActiveAdminTab}
        className="space-y-4"
      >
        <TabsList className="bg-card-mid border border-border">
          <TabsTrigger
            data-ocid="admin.draws.tab"
            value="draws"
            className="data-[state=active]:bg-neon data-[state=active]:text-black font-semibold"
          >
            Draws
          </TabsTrigger>
          <TabsTrigger
            data-ocid="admin.transactions.tab"
            value="transactions"
            className="data-[state=active]:bg-neon data-[state=active]:text-black font-semibold"
          >
            Transactions
            {pendingCount > 0 && (
              <span className="ml-1.5 bg-gold text-black text-xs font-bold rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            data-ocid="admin.users.tab"
            value="users"
            className="data-[state=active]:bg-neon data-[state=active]:text-black font-semibold"
          >
            Users
          </TabsTrigger>
          <TabsTrigger
            data-ocid="admin.bets.tab"
            value="bets"
            className="data-[state=active]:bg-neon data-[state=active]:text-black font-semibold"
          >
            All Bets
          </TabsTrigger>
        </TabsList>

        {/* DRAWS TAB */}
        <TabsContent value="draws" className="space-y-6">
          <Card className="bg-card-deep border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold uppercase tracking-wide">
                Draw Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {!activeDraw || activeDraw.status.__kind__ === "settled" ? (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {activeDraw?.status.__kind__ === "settled"
                        ? "Last draw settled."
                        : "No active draw. Start a new one."}
                    </p>
                  </div>
                  <Button
                    data-ocid="admin.start_draw.primary_button"
                    onClick={handleStartDraw}
                    disabled={startDraw.isPending}
                    className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full neon-glow"
                  >
                    {startDraw.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start New Draw
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-card-mid border border-neon/20">
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        Draw #{activeDraw.id.toString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Status:{" "}
                        <span
                          className={
                            activeDraw.status.__kind__ === "open"
                              ? "text-neon"
                              : "text-gold"
                          }
                        >
                          {activeDraw.status.__kind__.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    {activeDraw.status.__kind__ === "open" && (
                      <Button
                        data-ocid="admin.close_draw.secondary_button"
                        onClick={handleCloseDraw}
                        disabled={closeDraw.isPending}
                        variant="outline"
                        className="border-gold text-gold hover:bg-gold/10 font-bold rounded-full"
                      >
                        {closeDraw.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Square className="w-4 h-4 mr-2" />
                            Close Draw
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {(activeDraw.status.__kind__ === "open" ||
                    activeDraw.status.__kind__ === "closed") && (
                    <div className="flex gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <p className="text-xs text-muted-foreground font-semibold uppercase">
                          Winning Number (00–99)
                        </p>
                        <Input
                          data-ocid="admin.winner_number.input"
                          type="number"
                          min="0"
                          max="99"
                          placeholder="Enter winning number"
                          value={winnerNumber}
                          onChange={(e) => setWinnerNumber(e.target.value)}
                          className="bg-card-mid border-border focus:border-neon text-foreground"
                        />
                      </div>
                      <Button
                        data-ocid="admin.settle_draw.primary_button"
                        onClick={handleSettle}
                        disabled={settleDraw.isPending || !winnerNumber}
                        className="bg-gold text-black hover:bg-gold/90 font-bold rounded-full gold-glow"
                      >
                        {settleDraw.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Settling...
                          </>
                        ) : (
                          <>
                            <Trophy className="w-4 h-4 mr-2" />
                            Set Winner & Settle
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Draw History */}
          <Card className="bg-card-deep border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold uppercase tracking-wide">
                Draw History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!drawHistory || drawHistory.length === 0 ? (
                <div
                  data-ocid="admin.draws.empty_state"
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No draws yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-xs">
                        ID
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Status
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Winner
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Bets
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drawHistory.map((draw, idx) => {
                      const betCount = allBets
                        ? allBets.filter((b) => b.drawId === draw.id).length
                        : 0;
                      return (
                        <TableRow
                          key={draw.id.toString()}
                          data-ocid={`admin.draws.item.${idx + 1}`}
                          className="border-border"
                        >
                          <TableCell className="font-mono text-xs">
                            #{draw.id.toString()}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`text-xs border ${
                                draw.status.__kind__ === "settled"
                                  ? "bg-neon/20 text-neon border-neon/30"
                                  : draw.status.__kind__ === "open"
                                    ? "bg-gold/20 text-gold border-gold/30"
                                    : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              {draw.status.__kind__}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-neon font-bold text-sm">
                            {draw.status.__kind__ === "settled"
                              ? draw.status.settled.toString().padStart(2, "0")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold bg-card-mid border border-border rounded-full px-2 py-0.5">
                              {betCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(
                              Number(draw.createdAt) / 1_000_000,
                            ).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRANSACTIONS TAB */}
        <TabsContent value="transactions" className="space-y-6">
          <Card className="bg-card-deep border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold uppercase tracking-wide">
                Pending Requests
                {pendingCount > 0 && (
                  <span className="ml-2 bg-gold text-black text-xs font-bold rounded-full px-2 py-0.5">
                    {pendingCount}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!pendingRequests || pendingRequests.length === 0 ? (
                <div
                  data-ocid="admin.pending.empty_state"
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No pending requests
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-xs">
                        Type
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Amount
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        UPI Ref/ID
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Date
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingRequests.map((tx, idx) => {
                      const type = tx.transactionType.__kind__;
                      const amount =
                        type === "deposit"
                          ? tx.transactionType.deposit.amount
                          : type === "withdrawal"
                            ? tx.transactionType.withdrawal.amount
                            : null;
                      const ref =
                        type === "deposit"
                          ? tx.transactionType.deposit.upiRef
                          : type === "withdrawal"
                            ? tx.transactionType.withdrawal.upiId
                            : "-";
                      return (
                        <TableRow
                          key={tx.transactionId.toString()}
                          data-ocid={`admin.pending.item.${idx + 1}`}
                          className="border-border"
                        >
                          <TableCell>
                            <Badge
                              className={`text-xs border ${
                                type === "deposit"
                                  ? "bg-neon/20 text-neon border-neon/30"
                                  : "bg-gold/20 text-gold border-gold/30"
                              }`}
                            >
                              {type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₹{amount?.toString() ?? "-"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {ref}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(
                              Number(tx.timestamp) / 1_000_000,
                            ).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                data-ocid={`admin.pending.approve.${idx + 1}`}
                                size="sm"
                                onClick={() => handleApprove(tx.transactionId)}
                                disabled={approveTransaction.isPending}
                                className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full text-xs px-3 h-7"
                              >
                                Approve
                              </Button>
                              <Button
                                data-ocid={`admin.pending.reject.${idx + 1}`}
                                size="sm"
                                onClick={() => handleReject(tx.transactionId)}
                                disabled={rejectTransaction.isPending}
                                variant="outline"
                                className="border-destructive text-destructive hover:bg-destructive/10 rounded-full text-xs px-3 h-7"
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card-deep border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold uppercase tracking-wide">
                All Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!allTransactions || allTransactions.length === 0 ? (
                <div
                  data-ocid="admin.transactions.empty_state"
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No transactions
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-xs">
                        ID
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Type
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Amount
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Status
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTransactions.map((tx, idx) => {
                      const type = tx.transactionType.__kind__;
                      const amount =
                        type === "deposit"
                          ? tx.transactionType.deposit.amount
                          : type === "withdrawal"
                            ? tx.transactionType.withdrawal.amount
                            : null;
                      return (
                        <TableRow
                          key={tx.transactionId.toString()}
                          data-ocid={`admin.transactions.item.${idx + 1}`}
                          className="border-border"
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{tx.transactionId.toString()}
                          </TableCell>
                          <TableCell className="capitalize text-sm">
                            {type}
                          </TableCell>
                          <TableCell>
                            {amount !== null ? `₹${amount.toString()}` : "-"}
                          </TableCell>
                          <TableCell>{statusBadge(tx.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(
                              Number(tx.timestamp) / 1_000_000,
                            ).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users">
          <Card className="bg-card-deep border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold uppercase tracking-wide">
                All Users
                {allUsers && allUsers.length > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal text-sm">
                    ({allUsers.length} total)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!allUsers || allUsers.length === 0 ? (
                <div
                  data-ocid="admin.users.empty_state"
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No users yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-xs">
                        #
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        User
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Balance
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allUsers.map((user, userIdx) => (
                      <TableRow
                        key={user.wallet.toString() + String(userIdx)}
                        data-ocid={`admin.users.item.${userIdx + 1}`}
                        className="border-border"
                      >
                        <TableCell className="text-xs text-muted-foreground font-mono w-12">
                          {userIdx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-neon/20 flex items-center justify-center text-xs font-bold text-neon">
                              {userIdx + 1}
                            </div>
                            <span className="text-sm font-semibold">
                              User #{userIdx + 1}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-gold font-bold">
                            ₹{user.wallet.toString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALL BETS TAB */}
        <TabsContent value="bets">
          <Card className="bg-card-deep border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold uppercase tracking-wide">
                All Bets
                {allBets && allBets.length > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal text-sm">
                    ({allBets.length} total)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!allBets || allBets.length === 0 ? (
                <div
                  data-ocid="admin.bets.empty_state"
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No bets yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground text-xs">
                        Bet ID
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Draw ID
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Number
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Amount
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Date
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allBets.map((bet, idx) => (
                      <TableRow
                        key={bet.betId.toString()}
                        data-ocid={`admin.bets.item.${idx + 1}`}
                        className="border-border"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{bet.betId.toString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{bet.drawId.toString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-neon font-bold">
                            {bet.number.toString().padStart(2, "0")}
                          </span>
                        </TableCell>
                        <TableCell className="text-gold font-semibold">
                          ₹{bet.amount.toString()}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(
                            Number(bet.timestamp) / 1_000_000,
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
