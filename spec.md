# Teer Betting

## Current State
Backend has all required methods (addBalance, deductBalance, getUserByUserId, rejectTransactionWithReason, isCallerAdmin etc.) but `isCallerAdmin` was missing from main.mo, causing the Admin tab to never appear in the frontend.

## Requested Changes (Diff)

### Add
- `isCallerAdmin` query function to backend

### Modify
- Nothing in frontend needed

### Remove
- Nothing

## Implementation Plan
1. Add `isCallerAdmin` public query function to main.mo that returns `AccessControl.isAdmin(accessControlState, caller)`
