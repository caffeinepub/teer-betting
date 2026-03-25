import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Hash, Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerBets } from "../hooks/useQueries";

export default function MyBetsPage() {
  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: bets, isLoading } = useCallerBets();

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Hash className="w-16 h-16 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Login to view your bets</p>
        <Button
          data-ocid="bets.login.primary_button"
          onClick={login}
          className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full px-8"
        >
          Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold uppercase tracking-widest">
          My Bets
        </h2>
        {bets && bets.length > 0 && (
          <Badge className="bg-neon/20 text-neon border-neon/30 border">
            {bets.length} bets
          </Badge>
        )}
      </div>

      <Card className="bg-card-deep border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold uppercase tracking-wide">
            Bet History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              data-ocid="bets.loading_state"
              className="flex items-center justify-center py-12"
            >
              <Loader2 className="w-8 h-8 animate-spin text-neon" />
            </div>
          ) : !bets || bets.length === 0 ? (
            <div
              data-ocid="bets.empty_state"
              className="text-center py-12 text-muted-foreground"
            >
              <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No bets placed yet</p>
              <p className="text-sm mt-1">
                Place your first bet on the Home tab!
              </p>
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
                {bets.map((bet, idx) => (
                  <TableRow
                    key={bet.betId.toString()}
                    data-ocid={`bets.item.${idx + 1}`}
                    className="border-border"
                  >
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      #{bet.betId.toString()}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      #{bet.drawId.toString()}
                    </TableCell>
                    <TableCell>
                      <span className="text-neon font-bold text-sm">
                        {bet.number.toString().padStart(2, "0")}
                      </span>
                    </TableCell>
                    <TableCell className="text-gold font-semibold">
                      ₹{bet.amount.toString()}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(
                        Number(bet.timestamp) / 1_000_000,
                      ).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
