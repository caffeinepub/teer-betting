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

  module UserProfile {
    public func compare(p1 : UserProfile, p2 : UserProfile) : Order.Order {
      Principal.compare(p1.user, p2.user);
    };
  };

  type UserProfile = {
    user : Principal;
    wallet : Nat;
  };

  module Draw {
    public func compareById(d1 : Draw, d2 : Draw) : Order.Order {
      Nat.compare(d1.id, d2.id);
    };
  };

  type Draw = {
    id : DrawId;
    status : {
      #open;
      #closed;
      #settled : Nat; // winning number
    };
    createdAt : Time.Time;
  };

  module Bet {
    public func compare(b1 : Bet, b2 : Bet) : Order.Order {
      let drawOrder = Nat.compare(b1.drawId, b2.drawId);
      switch (drawOrder) {
        case (#equal) { Nat.compare(b1.betId, b2.betId) };
        case (order) { order };
      };
    };
  };

  type Bet = {
    betId : BetId;
    drawId : DrawId;
    player : Principal;
    number : Nat; // 0-99
    amount : Nat;
    timestamp : Time.Time;
  };

  module Transaction {
    public func compare(t1 : Transaction, t2 : Transaction) : Order.Order {
      Nat.compare(t1.transactionId, t2.transactionId);
    };
  };

  type Transaction = {
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

  var nextDrawId = 0;
  var nextTransactionId = 0;
  var nextBetId = 0;

  let userProfiles = Map.empty<Principal, UserProfile>();
  let drawMap = Map.empty<DrawId, Draw>();
  let betMap = Map.empty<BetId, Bet>();
  let transactionMap = Map.empty<TransactionId, Transaction>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfilePublic = {
    wallet : Nat;
  };

  func toPublicProfile(profile : UserProfile) : UserProfilePublic {
    { wallet = profile.wallet };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfilePublic {
    userProfiles.get(caller).map(toPublicProfile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfilePublic {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user).map(toPublicProfile);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfilePublic) : async () {
    let existingProfile = switch (caller.toText()) {
      case ("2vxsx-fae") {
        { user = caller; wallet = 0 : Nat };
      };
      case (_) {
        let ?existing = userProfiles.get(caller) else {
          Runtime.trap("Unknown user that is not anonymous");
        };
        existing;
      };
    };
    let mergedProfile = {
      existingProfile with
      wallet = profile.wallet;
    };
    userProfiles.add(caller, mergedProfile);
  };

  public query ({ caller }) func getAllUserProfiles() : async [UserProfilePublic] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all user profiles");
    };
    userProfiles.values().toArray().map(toPublicProfile);
  };

  public query ({ caller }) func getBalance(user : Principal) : async Nat {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view other users' balances");
    };
    switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile.wallet };
    };
  };

  public shared ({ caller }) func createDepositRequest(amount : Nat, upiRef : Text) : async TransactionId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create deposit requests");
    };
    if (amount == 0) {
      Runtime.trap("Deposit amount must be greater than zero");
    };
    let transaction = {
      transactionId = nextTransactionId;
      user = caller;
      transactionType = #deposit({ upiRef; amount });
      status = #pending;
      timestamp = Time.now();
    };
    transactionMap.add(transaction.transactionId, transaction);
    nextTransactionId += 1;
    transaction.transactionId;
  };

  public shared ({ caller }) func createWithdrawalRequest(amount : Nat, upiId : Text) : async TransactionId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create withdrawal requests");
    };
    if (amount == 0) {
      Runtime.trap("Withdrawal amount must be greater than zero");
    };
    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
    if (profile.wallet < amount) {
      Runtime.trap("Insufficient balance");
    };
    let transaction = {
      transactionId = nextTransactionId;
      user = caller;
      transactionType = #withdrawal({ upiId; amount });
      status = #pending;
      timestamp = Time.now();
    };
    transactionMap.add(transaction.transactionId, transaction);
    nextTransactionId += 1;
    transaction.transactionId;
  };

  func updateTransactionStatus(transactionId : TransactionId, newStatus : { #approved; #rejected }) : Transaction {
    let transaction = switch (transactionMap.get(transactionId)) {
      case (null) { Runtime.trap("Transaction not found") };
      case (?transaction) { transaction };
    };
    let updatedTransaction = {
      transaction with
      status = newStatus;
    };
    transactionMap.add(transactionId, updatedTransaction);
    updatedTransaction;
  };

  public shared ({ caller }) func approveTransaction(transactionId : TransactionId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve transactions");
    };
    ignore updateTransactionStatus(transactionId, #approved);
  };

  public shared ({ caller }) func rejectTransaction(transactionId : TransactionId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject transactions");
    };
    ignore updateTransactionStatus(transactionId, #rejected);
  };

  public shared ({ caller }) func startDraw() : async DrawId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can start draws");
    };
    let drawIdToStart = nextDrawId;
    let newDraw = {
      id = drawIdToStart;
      status = #open;
      createdAt = Time.now();
    };
    drawMap.add(drawIdToStart, newDraw);
    nextDrawId += 1;
    drawIdToStart;
  };

  public shared ({ caller }) func closeDraw(drawId : DrawId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can close draws");
    };
    let draw = switch (drawMap.get(drawId)) {
      case (null) { Runtime.trap("Draw not found") };
      case (?draw) { draw };
    };
    if (draw.status != #open) {
      Runtime.trap("Draw is not open");
    };
    let closedDraw = {
      draw with
      status = #closed;
    };
    drawMap.add(drawId, closedDraw);
  };

  public shared ({ caller }) func settleDraw(drawId : DrawId, winningNumber : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can settle draws");
    };
    if (winningNumber > 99) {
      Runtime.trap("Winning number must be between 0 and 99");
    };
    let draw = switch (drawMap.get(drawId)) {
      case (null) { Runtime.trap("Draw not found") };
      case (?draw) { draw };
    };
    if (draw.status != #closed) {
      Runtime.trap("Draw is not closed");
    };
    let settledDraw = {
      draw with
      status = #settled(winningNumber);
    };
    drawMap.add(drawId, settledDraw);
    let winningBets = betMap.values().toArray().filter(
      func(bet) {
        bet.drawId == drawId and bet.number == winningNumber
      }
    );
    for (bet in winningBets.values()) {
      let userProfile = switch (userProfiles.get(bet.player)) {
        case (null) { continue };
        case (?profile) { profile };
      };
      let newWallet = userProfile.wallet + (bet.amount * 8);
      let updatedProfile = {
        userProfile with
        wallet = newWallet;
      };
      userProfiles.add(bet.player, updatedProfile);
      let payoutTransaction = {
        transactionId = nextTransactionId;
        user = bet.player;
        transactionType = #payout({ betId = bet.betId });
        status = #approved;
        timestamp = Time.now();
      };
      transactionMap.add(nextTransactionId, payoutTransaction);
      nextTransactionId += 1;
    };
  };

  public shared ({ caller }) func placeBet(drawId : DrawId, number : Nat, amount : Nat) : async BetId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place bets");
    };
    if (number > 99) {
      Runtime.trap("Bet number must be between 0 and 99");
    };
    if (amount == 0) {
      Runtime.trap("Bet amount must be greater than zero");
    };
    let draw = switch (drawMap.get(drawId)) {
      case (null) { Runtime.trap("Draw not found") };
      case (?draw) { draw };
    };
    if (draw.status != #open) {
      Runtime.trap("Draw is not open for betting");
    };
    let userProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
    if (userProfile.wallet < amount) {
      Runtime.trap("Insufficient balance");
    };
    let updatedProfile = {
      userProfile with
      wallet = userProfile.wallet - amount;
    };
    userProfiles.add(caller, updatedProfile);

    let betId = nextBetId;
    let bet = {
      betId;
      drawId;
      player = caller;
      number;
      amount;
      timestamp = Time.now();
    };
    betMap.add(betId, bet);

    let transactionId = nextTransactionId;
    let transaction = {
      transactionId;
      user = caller;
      transactionType = #bet({ betId });
      status = #approved;
      timestamp = Time.now();
    };
    transactionMap.add(transactionId, transaction);
    nextTransactionId += 1;
    nextBetId += 1;
    betId;
  };

  public query ({ caller }) func getActiveDraw() : async ?Draw {
    drawMap.values().toArray().find(func(d) { d.status == #open });
  };

  public query ({ caller }) func getCallerBets() : async [Bet] {
    betMap.values().toArray().filter(func(bet) { bet.player == caller });
  };

  public query ({ caller }) func getAllBets() : async [Bet] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all bets");
    };
    betMap.values().toArray().sort();
  };

  public query ({ caller }) func getDrawHistory() : async [Draw] {
    drawMap.values().toArray().sort(Draw.compareById);
  };

  public query ({ caller }) func getCallerTransactions() : async [Transaction] {
    transactionMap.values().toArray().filter(func(t) { t.user == caller });
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };
    transactionMap.values().toArray().sort();
  };

  public query ({ caller }) func getPendingRequests() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view pending requests");
    };
    transactionMap.values().toArray().filter(
      func(t) {
        switch (t.transactionType) {
          case (#bet(_)) { false };
          case (#payout(_)) { false };
          case (_) { t.status == #pending };
        };
      }
    ).sort();
  };
};
