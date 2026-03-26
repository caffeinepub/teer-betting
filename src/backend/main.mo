import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  type DrawId = Nat;
  type TransactionId = Nat;
  type BetId = Nat;

  // ── New types ────────────────────────────────────────────────────────────────

  type UserProfile = {
    user : Principal;
    userId : Nat;
    wallet : Nat;
  };

  type Draw = {
    id : DrawId;
    status : {
      #open;
      #closed;
      #settled : Nat;
    };
    createdAt : Time.Time;
  };

  type Bet = {
    betId : BetId;
    drawId : DrawId;
    player : Principal;
    number : Nat;
    amount : Nat;
    timestamp : Time.Time;
  };

  type Transaction = {
    transactionId : TransactionId;
    user : Principal;
    transactionType : {
      #deposit : { upiRef : Text; amount : Nat };
      #withdrawal : { upiId : Text; amount : Nat };
      #bet : { betId : BetId; amount : Nat };
      #payout : { betId : BetId; amount : Nat };
    };
    status : { #pending; #approved; #rejected };
    rejectionReason : ?Text;
    timestamp : Time.Time;
  };

  // ── Legacy types (for migrating old stable data) ─────────────────────────────

  type UserProfileLegacy = {
    user : Principal;
    wallet : Nat;
  };

  type TransactionLegacy = {
    transactionId : TransactionId;
    user : Principal;
    transactionType : {
      #deposit : { upiRef : Text; amount : Nat };
      #withdrawal : { upiId : Text; amount : Nat };
      #bet : { betId : BetId };
      #payout : { betId : BetId };
    };
    status : { #pending; #approved; #rejected };
    timestamp : Time.Time;
  };

  // ── Stable storage ────────────────────────────────────────────────────────────
  //
  // Keep OLD variable names with legacy types so Motoko can load the previous
  // stable data into them during upgrade.  New data lives in the v2 maps.

  // Receives old data on the migration upgrade; never written to afterwards.
  let transactionMap = Map.empty<TransactionId, TransactionLegacy>();
  let userProfiles = Map.empty<Principal, UserProfileLegacy>();

  // Unchanged schema — persisted as before.
  let drawMap = Map.empty<DrawId, Draw>();
  let betMap = Map.empty<BetId, Bet>();

  // New stable maps for the updated schemas.
  let txMap = Map.empty<TransactionId, Transaction>();
  let profileMap = Map.empty<Principal, UserProfile>();

  // Counters — stable so they survive upgrades (previously they were non-stable
  // and reset to 0 on every upgrade; we derive safe initial values in postupgrade).
  stable var nextDrawId : Nat = 0;
  stable var nextTransactionId : Nat = 0;
  stable var nextBetId : Nat = 0;
  stable var nextUserId : Nat = 1;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Migration ─────────────────────────────────────────────────────────────────

  system func postupgrade() {
    // ---- Transactions ----------------------------------------------------------
    // If txMap is still empty but transactionMap has legacy data, migrate once.
    if (txMap.values().toArray().size() == 0 and transactionMap.values().toArray().size() > 0) {
      for (v in transactionMap.values()) {
        let newType = switch (v.transactionType) {
          case (#deposit(d)) { #deposit(d) };
          case (#withdrawal(w)) { #withdrawal(w) };
          case (#bet({ betId })) { #bet({ betId; amount = 0 }) };
          case (#payout({ betId })) { #payout({ betId; amount = 0 }) };
        };
        txMap.add(v.transactionId, {
          transactionId = v.transactionId;
          user = v.user;
          transactionType = newType;
          status = v.status;
          rejectionReason = null;
          timestamp = v.timestamp;
        });
      };
    };

    // ---- User profiles ---------------------------------------------------------
    if (profileMap.values().toArray().size() == 0 and userProfiles.values().toArray().size() > 0) {
      var migId : Nat = 1;
      for (v in userProfiles.values()) {
        profileMap.add(v.user, { user = v.user; userId = migId; wallet = v.wallet });
        migId += 1;
      };
      nextUserId := migId;
    };

    // ---- Derive counters if they were reset to 0 (old code never persisted them)
    if (nextTransactionId == 0) {
      var maxId : Nat = 0;
      for (t in txMap.values()) {
        if (t.transactionId + 1 > maxId) { maxId := t.transactionId + 1 };
      };
      nextTransactionId := maxId;
    };
    if (nextDrawId == 0) {
      var maxId : Nat = 0;
      for (d in drawMap.values()) {
        if (d.id + 1 > maxId) { maxId := d.id + 1 };
      };
      nextDrawId := maxId;
    };
    if (nextBetId == 0) {
      var maxId : Nat = 0;
      for (b in betMap.values()) {
        if (b.betId + 1 > maxId) { maxId := b.betId + 1 };
      };
      nextBetId := maxId;
    };
  };

  // ── Public types ─────────────────────────────────────────────────────────────

  public type UserProfilePublic = {
    userId : Nat;
    wallet : Nat;
  };

  public type UserProfileAdmin = {
    user : Principal;
    userId : Nat;
    wallet : Nat;
  };

  func toPublicProfile(profile : UserProfile) : UserProfilePublic {
    { userId = profile.userId; wallet = profile.wallet };
  };

  func toAdminProfile(profile : UserProfile) : UserProfileAdmin {
    { user = profile.user; userId = profile.userId; wallet = profile.wallet };
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────

  func ensureProfile(user : Principal) : UserProfile {
    switch (profileMap.get(user)) {
      case (?profile) { profile };
      case (null) {
        let newProfile = { user; userId = nextUserId; wallet = 0 : Nat };
        nextUserId += 1;
        profileMap.add(user, newProfile);
        newProfile;
      };
    };
  };

  // ── Query: caller profile ─────────────────────────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfilePublic {
    profileMap.get(caller).map(toPublicProfile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfilePublic {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profileMap.get(user).map(toPublicProfile);
  };

  public shared ({ caller }) func saveCallerUserProfile(_ : UserProfilePublic) : async () {
    if (caller.isAnonymous()) { return };
    ignore ensureProfile(caller);
  };


  public query ({ caller }) func getAllUserProfiles() : async [UserProfileAdmin] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all user profiles");
    };
    profileMap.values().toArray().map(toAdminProfile);
  };

  public query ({ caller }) func getUserByUserId(userId : Nat) : async ?UserProfileAdmin {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can search users by ID");
    };
    let found = profileMap.values().toArray().find(func(p : UserProfile) : Bool { p.userId == userId });
    found.map(toAdminProfile);
  };

  public query ({ caller }) func getBalance(user : Principal) : async Nat {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    switch (profileMap.get(user)) {
      case (null) { 0 };
      case (?profile) { profile.wallet };
    };
  };

  // ── Admin: deduct balance ─────────────────────────────────────────────────────

  public shared ({ caller }) func deductBalance(user : Principal, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can deduct balance");
    };
    if (amount == 0) { Runtime.trap("Amount must be greater than zero") };
    let profile = ensureProfile(user);
    if (profile.wallet < amount) { Runtime.trap("Insufficient balance to deduct") };
    profileMap.add(user, { profile with wallet = profile.wallet - amount });
    let transaction = {
      transactionId = nextTransactionId;
      user;
      transactionType = #withdrawal({ upiId = "admin-deduction"; amount });
      status = #approved;
      rejectionReason = null;
      timestamp = Time.now();
    };
    txMap.add(transaction.transactionId, transaction);
    nextTransactionId += 1;
  };


  // ── Admin: add balance ───────────────────────────────────────────────────────

  public shared ({ caller }) func addBalance(user : Principal, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add balance");
    };
    if (amount == 0) { Runtime.trap("Amount must be greater than zero") };
    let profile = ensureProfile(user);
    profileMap.add(user, { profile with wallet = profile.wallet + amount });
    let transaction = {
      transactionId = nextTransactionId;
      user;
      transactionType = #deposit({ upiRef = "admin-credit"; amount });
      status = #approved;
      rejectionReason = null;
      timestamp = Time.now();
    };
    txMap.add(transaction.transactionId, transaction);
    nextTransactionId += 1;
  };
  // ── Deposits / withdrawals ────────────────────────────────────────────────────

  public shared ({ caller }) func createDepositRequest(amount : Nat, upiRef : Text) : async TransactionId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (amount == 0) { Runtime.trap("Deposit amount must be greater than zero") };
    ignore ensureProfile(caller);
    let transaction = {
      transactionId = nextTransactionId;
      user = caller;
      transactionType = #deposit({ upiRef; amount });
      status = #pending;
      rejectionReason = null;
      timestamp = Time.now();
    };
    txMap.add(transaction.transactionId, transaction);
    nextTransactionId += 1;
    transaction.transactionId;
  };

  public shared ({ caller }) func createWithdrawalRequest(amount : Nat, upiId : Text) : async TransactionId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (amount == 0) { Runtime.trap("Withdrawal amount must be greater than zero") };
    let profile = ensureProfile(caller);
    if (profile.wallet < amount) { Runtime.trap("Insufficient balance") };
    let transaction = {
      transactionId = nextTransactionId;
      user = caller;
      transactionType = #withdrawal({ upiId; amount });
      status = #pending;
      rejectionReason = null;
      timestamp = Time.now();
    };
    txMap.add(transaction.transactionId, transaction);
    nextTransactionId += 1;
    transaction.transactionId;
  };

  func updateTransactionStatus(transactionId : TransactionId, newStatus : { #approved; #rejected }, reason : ?Text) : Transaction {
    let transaction = switch (txMap.get(transactionId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?t) { t };
    };
    let updated = { transaction with status = newStatus; rejectionReason = reason };
    txMap.add(transactionId, updated);
    updated;
  };

  public shared ({ caller }) func approveTransaction(transactionId : TransactionId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let updatedTx = updateTransactionStatus(transactionId, #approved, null);
    switch (updatedTx.transactionType) {
      case (#deposit({ amount; upiRef = _ })) {
        let profile = ensureProfile(updatedTx.user);
        profileMap.add(updatedTx.user, { profile with wallet = profile.wallet + amount });
      };
      case (#withdrawal({ amount; upiId = _ })) {
        let profile = ensureProfile(updatedTx.user);
        if (profile.wallet >= amount) {
          profileMap.add(updatedTx.user, { profile with wallet = profile.wallet - amount });
        };
      };
      case (_) {};
    };
  };

  public shared ({ caller }) func rejectTransaction(transactionId : TransactionId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    ignore updateTransactionStatus(transactionId, #rejected, null);
  };

  public shared ({ caller }) func rejectTransactionWithReason(transactionId : TransactionId, reason : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    ignore updateTransactionStatus(transactionId, #rejected, ?reason);
  };

  // ── Draws ─────────────────────────────────────────────────────────────────────

  public shared ({ caller }) func startDraw() : async DrawId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let id = nextDrawId;
    drawMap.add(id, { id; status = #open; createdAt = Time.now() });
    nextDrawId += 1;
    id;
  };

  public shared ({ caller }) func closeDraw(drawId : DrawId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    let draw = switch (drawMap.get(drawId)) {
      case (null) { Runtime.trap("Draw not found") };
      case (?d) { d };
    };
    if (draw.status != #open) { Runtime.trap("Draw is not open") };
    drawMap.add(drawId, { draw with status = #closed });
  };

  public shared ({ caller }) func settleDraw(drawId : DrawId, winningNumber : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    if (winningNumber > 99) { Runtime.trap("Winning number must be between 0 and 99") };
    let draw = switch (drawMap.get(drawId)) {
      case (null) { Runtime.trap("Draw not found") };
      case (?d) { d };
    };
    if (draw.status != #closed) { Runtime.trap("Draw is not closed") };
    drawMap.add(drawId, { draw with status = #settled(winningNumber) });
    let winners = betMap.values().toArray().filter(
      func(bet : Bet) : Bool { bet.drawId == drawId and bet.number == winningNumber }
    );
    for (bet in winners.values()) {
      let profile = switch (profileMap.get(bet.player)) {
        case (null) { continue };
        case (?p) { p };
      };
      let payout = bet.amount * 80;
      profileMap.add(bet.player, { profile with wallet = profile.wallet + payout });
      txMap.add(nextTransactionId, {
        transactionId = nextTransactionId;
        user = bet.player;
        transactionType = #payout({ betId = bet.betId; amount = payout });
        status = #approved;
        rejectionReason = null;
        timestamp = Time.now();
      });
      nextTransactionId += 1;
    };
  };

  // ── Bets ──────────────────────────────────────────────────────────────────────

  public shared ({ caller }) func placeBet(drawId : DrawId, number : Nat, amount : Nat) : async BetId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    if (number > 99) { Runtime.trap("Bet number must be between 0 and 99") };
    if (amount == 0) { Runtime.trap("Bet amount must be greater than zero") };
    let draw = switch (drawMap.get(drawId)) {
      case (null) { Runtime.trap("Draw not found") };
      case (?d) { d };
    };
    if (draw.status != #open) { Runtime.trap("Draw is not open for betting") };
    let profile = switch (profileMap.get(caller)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?p) { p };
    };
    if (profile.wallet < amount) { Runtime.trap("Insufficient balance") };
    profileMap.add(caller, { profile with wallet = profile.wallet - amount });
    let betId = nextBetId;
    betMap.add(betId, { betId; drawId; player = caller; number; amount; timestamp = Time.now() });
    txMap.add(nextTransactionId, {
      transactionId = nextTransactionId;
      user = caller;
      transactionType = #bet({ betId; amount });
      status = #approved;
      rejectionReason = null;
      timestamp = Time.now();
    });
    nextTransactionId += 1;
    nextBetId += 1;
    betId;
  };

  // ── Queries ───────────────────────────────────────────────────────────────────

  public query ({ caller }) func getActiveDraw() : async ?Draw {
    drawMap.values().toArray().find(func(d : Draw) : Bool { d.status == #open });
  };

  public query ({ caller }) func getCallerBets() : async [Bet] {
    betMap.values().toArray().filter(func(bet : Bet) : Bool { bet.player == caller });
  };

  public query ({ caller }) func getAllBets() : async [Bet] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    betMap.values().toArray();
  };

  public query ({ caller }) func getDrawHistory() : async [Draw] {
    drawMap.values().toArray().sort(func(a : Draw, b : Draw) : Order.Order { Nat.compare(a.id, b.id) });
  };

  public query ({ caller }) func getCallerTransactions() : async [Transaction] {
    txMap.values().toArray().filter(func(t : Transaction) : Bool { t.user == caller });
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    txMap.values().toArray();
  };

  public query ({ caller }) func getPendingRequests() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized");
    };
    txMap.values().toArray().filter(
      func(t : Transaction) : Bool {
        switch (t.transactionType) {
          case (#bet(_)) { false };
          case (#payout(_)) { false };
          case (_) { t.status == #pending };
        };
      }
    );
  };
};
