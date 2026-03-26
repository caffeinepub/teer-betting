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
import { Textarea } from "@/components/ui/textarea";
import {
  Activity,
  BadgeDollarSign,
  CreditCard,
  ListOrdered,
  Loader2,
  Play,
  Search,
  Square,
  Trophy,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfileAdmin } from "../backend.d";
import { Variant_pending_approved_rejected } from "../backend.d";
import {
  useActiveDraw,
  useAddBalance,
  useAllBets,
  useAllTransactions,
  useAllUserProfiles,
  useApproveTransaction,
  useCloseDraw,
  useDeductBalance,
  useDrawHistory,
  useGetUserByUserId,
  usePendingRequests,
  useRejectTransactionWithReason,
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
  const rejectWithReason = useRejectTransactionWithReason();
  const deductBalance = useDeductBalance();
  const addBalance = useAddBalance();
  const getUserById = useGetUserByUserId();

  const [winnerNumber, setWinnerNumber] = useState("");
  const [activeAdminTab, setActiveAdminTab] = useState("draws");

  // Reject with reason state
  const [showRejectForm, setShowRejectForm] = useState<Record<string, boolean>>(
    {},
  );
  const [rejectReasonMap, setRejectReasonMap] = useState<
    Record<string, string>
  >({});

  // Deduct balance state
  const [showDeductForm, setShowDeductForm] = useState<Record<string, boolean>>(
    {},
  );
  const [deductMap, setDeductMap] = useState<Record<string, string>>({});

  // Add balance state
  const [showAddForm, setShowAddForm] = useState<Record<string, boolean>>({});
  const [addMap, setAddMap] = useState<Record<string, string>>({});

  // User search state
  const [userSearchId, setUserSearchId] = useState("");
  const [searchedUser, setSearchedUser] = useState<
    UserProfileAdmin | null | undefined
  >(undefined);

  // Draw history settle state
  const [settleHistoryMap, setSettleHistoryMap] = useState<
    Record<string, string>
  >({});

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

  const handleSettleHistory = async (drawIdStr: string) => {
    const numStr = settleHistoryMap[drawIdStr] ?? "";
    const num = Number.parseInt(numStr);
    if (Number.isNaN(num) || num < 0 || num > 99) {
      toast.error("Enter a valid number (00-99)");
      return;
    }
    try {
      await settleDraw.mutateAsync({
        drawId: BigInt(drawIdStr),
        winningNumber: BigInt(num),
      });
      toast.success(
        `Draw #${drawIdStr} settled! Winning: ${num.toString().padStart(2, "0")}`,
      );
      setSettleHistoryMap((prev) => ({ ...prev, [drawIdStr]: "" }));
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

  const handleRejectWithReason = async (id: bigint, idStr: string) => {
    const reason = rejectReasonMap[idStr] ?? "";
    try {
      await rejectWithReason.mutateAsync({ transactionId: id, reason });
      toast.success("Transaction rejected");
      setShowRejectForm((prev) => ({ ...prev, [idStr]: false }));
      setRejectReasonMap((prev) => ({ ...prev, [idStr]: "" }));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to reject");
    }
  };

  const handleDeductBalance = async (
    principalStr: string,
    userPrincipal: any,
  ) => {
    const amountStr = deductMap[principalStr] ?? "";
    const amount = Number.parseInt(amountStr);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount to deduct");
      return;
    }
    try {
      await deductBalance.mutateAsync({
        user: userPrincipal,
        amount: BigInt(amount),
      });
      toast.success(`Deducted ₹${amount} from user`);
      setShowDeductForm((prev) => ({ ...prev, [principalStr]: false }));
      setDeductMap((prev) => ({ ...prev, [principalStr]: "" }));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to deduct balance");
    }
  };

  const handleAddBalance = async (principalStr: string, userPrincipal: any) => {
    const amountStr = addMap[principalStr] ?? "";
    const amount = Number.parseInt(amountStr);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount to add");
      return;
    }
    try {
      await addBalance.mutateAsync({
        user: userPrincipal,
        amount: BigInt(amount),
      });
      toast.success(`Added ₹${amount} to user`);
      setShowAddForm((prev) => ({ ...prev, [principalStr]: false }));
      setAddMap((prev) => ({ ...prev, [principalStr]: "" }));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to add balance");
    }
  };

  const handleSearchUser = async () => {
    const idNum = Number.parseInt(userSearchId);
    if (Number.isNaN(idNum) || idNum <= 0) {
      toast.error("Enter a valid user ID");
      return;
    }
    try {
      const result = await getUserById.mutateAsync(BigInt(idNum));
      setSearchedUser(result);
      if (!result) toast.info("No user found with that ID");
    } catch (e: any) {
      toast.error(e?.message ?? "Search failed");
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

  const pendingCount = (pendingRequests as any[])?.length ?? 0;
  const totalBetAmount =
    allBets?.reduce((sum, bet) => sum + Number(bet.amount), 0) ?? 0;
  const usersArr: UserProfileAdmin[] = (allUsers as any) ?? [];

  const STATS = [
    {
      label: "Total Users",
      value: usersArr.length,
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
      value: (allTransactions as any[])?.length ?? 0,
      icon: <CreditCard className="w-5 h-5" />,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Total Bet Amount",
      value: `₹${totalBetAmount.toLocaleString()}`,
      icon: <BadgeDollarSign className="w-5 h-5" />,
      color: "text-gold",
      bg: "bg-gold/10",
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                      <TableHead className="text-muted-foreground text-xs">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drawHistory.map((draw, idx) => {
                      const betCount = allBets
                        ? allBets.filter((b) => b.drawId === draw.id).length
                        : 0;
                      const drawIdStr = draw.id.toString();
                      return (
                        <TableRow
                          key={drawIdStr}
                          data-ocid={`admin.draws.item.${idx + 1}`}
                          className="border-border"
                        >
                          <TableCell className="font-mono text-xs">
                            #{drawIdStr}
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
                          <TableCell>
                            {draw.status.__kind__ === "closed" && (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="99"
                                  placeholder="00-99"
                                  value={settleHistoryMap[drawIdStr] ?? ""}
                                  onChange={(e) =>
                                    setSettleHistoryMap((prev) => ({
                                      ...prev,
                                      [drawIdStr]: e.target.value,
                                    }))
                                  }
                                  className="w-20 bg-card-mid border-border focus:border-gold text-foreground text-xs h-7 px-2"
                                />
                                <Button
                                  data-ocid={`admin.draws.declare.${idx + 1}`}
                                  size="sm"
                                  onClick={() => handleSettleHistory(drawIdStr)}
                                  disabled={settleDraw.isPending}
                                  className="bg-gold text-black hover:bg-gold/90 font-bold rounded-full text-xs px-3 h-7"
                                >
                                  <Trophy className="w-3 h-3 mr-1" />
                                  Declare
                                </Button>
                              </div>
                            )}
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
              {!(pendingRequests as any[])?.length ? (
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
                    {(pendingRequests as any[]).map((tx: any, idx: number) => {
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
                      const txIdStr = tx.transactionId.toString();
                      return (
                        <TableRow
                          key={txIdStr}
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
                            <div className="flex flex-col gap-2">
                              <div className="flex gap-2">
                                <Button
                                  data-ocid={`admin.pending.approve.${idx + 1}`}
                                  size="sm"
                                  onClick={() =>
                                    handleApprove(tx.transactionId)
                                  }
                                  disabled={approveTransaction.isPending}
                                  className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full text-xs px-3 h-7"
                                >
                                  Approve
                                </Button>
                                <Button
                                  data-ocid={`admin.pending.reject.${idx + 1}`}
                                  size="sm"
                                  onClick={() =>
                                    setShowRejectForm((prev) => ({
                                      ...prev,
                                      [txIdStr]: !prev[txIdStr],
                                    }))
                                  }
                                  variant="outline"
                                  className="border-destructive text-destructive hover:bg-destructive/10 rounded-full text-xs px-3 h-7"
                                >
                                  Reject
                                </Button>
                              </div>
                              {showRejectForm[txIdStr] && (
                                <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-card-mid border border-destructive/30">
                                  <Textarea
                                    data-ocid={`admin.pending.reject_reason.${idx + 1}`}
                                    placeholder="Reason for rejection (optional)"
                                    value={rejectReasonMap[txIdStr] ?? ""}
                                    onChange={(e) =>
                                      setRejectReasonMap((prev) => ({
                                        ...prev,
                                        [txIdStr]: e.target.value,
                                      }))
                                    }
                                    rows={2}
                                    className="text-xs bg-card-deep border-border resize-none"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      data-ocid={`admin.pending.confirm_reject.${idx + 1}`}
                                      size="sm"
                                      onClick={() =>
                                        handleRejectWithReason(
                                          tx.transactionId,
                                          txIdStr,
                                        )
                                      }
                                      disabled={rejectWithReason.isPending}
                                      className="bg-destructive text-white hover:bg-destructive/90 font-bold rounded-full text-xs px-3 h-7"
                                    >
                                      {rejectWithReason.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        "Confirm Reject"
                                      )}
                                    </Button>
                                    <Button
                                      data-ocid={`admin.pending.cancel_reject.${idx + 1}`}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setShowRejectForm((prev) => ({
                                          ...prev,
                                          [txIdStr]: false,
                                        }))
                                      }
                                      className="text-xs h-7"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
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
              {!(allTransactions as any[])?.length ? (
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
                    {(allTransactions as any[]).map((tx: any, idx: number) => {
                      const type = tx.transactionType.__kind__;
                      const amount =
                        type === "deposit"
                          ? tx.transactionType.deposit.amount
                          : type === "withdrawal"
                            ? tx.transactionType.withdrawal.amount
                            : type === "bet"
                              ? (tx.transactionType.bet.amount ?? null)
                              : type === "payout"
                                ? (tx.transactionType.payout.amount ?? null)
                                : null;
                      const isRejected =
                        tx.status ===
                        Variant_pending_approved_rejected.rejected;
                      const rejectionReason =
                        isRejected && tx.rejectionReason
                          ? tx.rejectionReason
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
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              {statusBadge(tx.status)}
                              {rejectionReason && (
                                <p className="text-xs text-destructive italic">
                                  {rejectionReason}
                                </p>
                              )}
                            </div>
                          </TableCell>
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
                {usersArr.length > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal text-sm">
                    ({usersArr.length} total)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search by User ID */}
              <div className="flex gap-2 items-end p-3 rounded-xl bg-card-mid border border-border">
                <div className="flex-1 space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase">
                    Search by User ID
                  </p>
                  <Input
                    data-ocid="admin.users.search_input"
                    type="number"
                    placeholder="Enter User ID number"
                    value={userSearchId}
                    onChange={(e) => setUserSearchId(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
                    className="bg-card-deep border-border focus:border-neon text-foreground"
                  />
                </div>
                <Button
                  data-ocid="admin.users.search.primary_button"
                  onClick={handleSearchUser}
                  disabled={getUserById.isPending}
                  className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full"
                >
                  {getUserById.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Search result */}
              {searchedUser !== undefined && (
                <div
                  data-ocid="admin.users.search.success_state"
                  className={`p-4 rounded-xl border ${
                    searchedUser
                      ? "bg-neon/5 border-neon/30"
                      : "bg-destructive/5 border-destructive/30"
                  }`}
                >
                  {searchedUser ? (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground uppercase">
                          Found User
                        </p>
                        <p className="font-mono font-bold text-neon text-lg">
                          #
                          {(searchedUser as any).userId
                            .toString()
                            .padStart(4, "0")}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          {(searchedUser as any).user.toString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="font-bold text-gold text-lg">
                          ₹{(searchedUser as any).wallet.toString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-destructive font-semibold">
                      No user found with that ID
                    </p>
                  )}
                </div>
              )}

              {usersArr.length === 0 ? (
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
                        User ID
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        User
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Balance
                      </TableHead>
                      <TableHead className="text-muted-foreground text-xs">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersArr.map((userItem: any, userIdx: number) => {
                      const principalStr = userItem.user.toString();
                      return (
                        <TableRow
                          key={principalStr}
                          data-ocid={`admin.users.item.${userIdx + 1}`}
                          className="border-border"
                        >
                          <TableCell>
                            <span className="font-mono font-bold text-neon text-sm">
                              #{userItem.userId.toString().padStart(4, "0")}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-neon/20 flex items-center justify-center text-xs font-bold text-neon">
                                {userIdx + 1}
                              </div>
                              <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">
                                {principalStr.substring(0, 12)}...
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-gold font-bold">
                              ₹{userItem.wallet.toString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Button
                                data-ocid={`admin.users.deduct.${userIdx + 1}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setShowDeductForm((prev) => ({
                                    ...prev,
                                    [principalStr]: !prev[principalStr],
                                  }))
                                }
                                className="border-destructive text-destructive hover:bg-destructive/10 rounded-full text-xs px-3 h-7"
                              >
                                Deduct Balance
                              </Button>
                              {showDeductForm[principalStr] && (
                                <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-card-mid border border-destructive/30">
                                  <Input
                                    data-ocid={`admin.users.deduct_amount.${userIdx + 1}`}
                                    type="number"
                                    min="1"
                                    placeholder="Amount to deduct"
                                    value={deductMap[principalStr] ?? ""}
                                    onChange={(e) =>
                                      setDeductMap((prev) => ({
                                        ...prev,
                                        [principalStr]: e.target.value,
                                      }))
                                    }
                                    className="text-xs bg-card-deep border-border h-7 px-2"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      data-ocid={`admin.users.confirm_deduct.${userIdx + 1}`}
                                      size="sm"
                                      onClick={() =>
                                        handleDeductBalance(
                                          principalStr,
                                          userItem.user,
                                        )
                                      }
                                      disabled={deductBalance.isPending}
                                      className="bg-destructive text-white hover:bg-destructive/90 font-bold rounded-full text-xs px-3 h-7"
                                    >
                                      {deductBalance.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        "Confirm"
                                      )}
                                    </Button>
                                    <Button
                                      data-ocid={`admin.users.cancel_deduct.${userIdx + 1}`}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setShowDeductForm((prev) => ({
                                          ...prev,
                                          [principalStr]: false,
                                        }))
                                      }
                                      className="text-xs h-7"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                            {/* Add Balance */}
                            <div className="flex flex-col gap-1.5">
                              <Button
                                data-ocid={`admin.users.add.${userIdx + 1}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setShowAddForm((prev) => ({
                                    ...prev,
                                    [principalStr]: !prev[principalStr],
                                  }))
                                }
                                className="border-neon text-neon hover:bg-neon/10 rounded-full text-xs px-3 h-7"
                              >
                                Add Balance
                              </Button>
                              {showAddForm[principalStr] && (
                                <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-card-mid border border-neon/30">
                                  <Input
                                    data-ocid={`admin.users.add_amount.${userIdx + 1}`}
                                    type="number"
                                    min="1"
                                    placeholder="Amount to add"
                                    value={addMap[principalStr] ?? ""}
                                    onChange={(e) =>
                                      setAddMap((prev) => ({
                                        ...prev,
                                        [principalStr]: e.target.value,
                                      }))
                                    }
                                    className="text-xs bg-card-deep border-border h-7 px-2"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      data-ocid={`admin.users.confirm_add.${userIdx + 1}`}
                                      size="sm"
                                      onClick={() =>
                                        handleAddBalance(
                                          principalStr,
                                          userItem.user,
                                        )
                                      }
                                      disabled={addBalance.isPending}
                                      className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full text-xs px-3 h-7"
                                    >
                                      {addBalance.isPending ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : (
                                        "Confirm"
                                      )}
                                    </Button>
                                    <Button
                                      data-ocid={`admin.users.cancel_add.${userIdx + 1}`}
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        setShowAddForm((prev) => ({
                                          ...prev,
                                          [principalStr]: false,
                                        }))
                                      }
                                      className="text-xs h-7"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
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
        </TabsContent>

        {/* ALL BETS TAB */}
        <TabsContent value="bets">
          <Card className="bg-card-deep border-border">
            <CardHeader>
              <CardTitle className="text-base font-bold uppercase tracking-wide">
                All Bets
                {allBets && allBets.length > 0 && (
                  <span className="ml-2 text-muted-foreground font-normal text-sm">
                    ({allBets.length} total · ₹{totalBetAmount.toLocaleString()}{" "}
                    total)
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
