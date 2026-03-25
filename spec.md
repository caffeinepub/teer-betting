# Teer Betting - Admin Panel Enhancement

## Current State
AdminPage.tsx exists with 4 tabs: Draws, Transactions, Users, All Bets. It has draw management (start/close/settle), pending transaction approval/rejection, user list, and all bets list. The panel is functional but lacks a summary dashboard and some visual polish.

## Requested Changes (Diff)

### Add
- Summary stats row at top: Total Users, Total Bets, Total Transactions, Pending Requests (highlighted if > 0)
- User principal display in the Users table (truncated)
- Timestamp with time (not just date) in tables
- Draw stats: number of bets per draw in Draw History

### Modify
- Admin panel header to feel more like a proper dashboard
- Users table to show user number, truncated principal, and wallet balance
- All Bets table to show bet result (won/lost) when draw is settled

### Remove
- Nothing

## Implementation Plan
1. Add 4 stats cards at top using existing data hooks
2. Update Users table to show principal
3. Update timestamps to show date + time
4. Polish overall layout and visual hierarchy
