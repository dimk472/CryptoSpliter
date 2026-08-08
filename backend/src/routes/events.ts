import { Router } from "express";
import { supabase } from "../config/supabase";

const router = Router();

type ParticipantInput = {
  address?: unknown;
  name?: unknown;
  amount?: unknown;
};

type SplitInput = ParticipantInput & {
  id?: unknown;
};

router.get("/", async (req, res) => {
  try {
    const wallet = String(req.query.wallet ?? "")
      .trim()
      .toLowerCase();

    if (!wallet) {
      return res.status(400).json({ error: "Missing wallet query parameter" });
    }

    const { data: creatorEventsData, error: creatorEventsError } =
      await supabase
        .from("events")
        .select(
          "id, off_chain_id, title, category, total_amount, creator_wallet, created_at, chain_id, currency",
        )
        .ilike("creator_wallet", wallet)
        .order("created_at", { ascending: false });

    if (creatorEventsError) {
      console.error("CREATOR EVENTS FETCH ERROR:", creatorEventsError);
      return res.status(500).json({
        error: "Failed to fetch events",
        details: creatorEventsError.message,
      });
    }

    const { data: myDebtsData, error: myDebtsError } = await supabase
      .from("debts")
      .select("event_id")
      .ilike("debtor_wallet", wallet);

    if (myDebtsError) {
      console.error("MY DEBTS FETCH ERROR:", myDebtsError);
      return res.status(500).json({
        error: "Failed to fetch events",
        details: myDebtsError.message,
      });
    }

    const creatorEvents = creatorEventsData ?? [];
    const debtorEventIds = Array.from(
      new Set((myDebtsData ?? []).map((debt) => debt.event_id)),
    );

    const creatorEventIdSet = new Set(creatorEvents.map((event) => event.id));

    const missingDebtorEventIds = debtorEventIds.filter(
      (eventId) => !creatorEventIdSet.has(eventId),
    );

    let debtorEvents: typeof creatorEvents = [];

    if (missingDebtorEventIds.length > 0) {
      const { data: debtorEventsData, error: debtorEventsError } =
        await supabase
          .from("events")
          .select(
            "id, off_chain_id, title, category, total_amount, creator_wallet, created_at, chain_id, currency",
          )
          .in("id", missingDebtorEventIds)
          .order("created_at", { ascending: false });

      if (debtorEventsError) {
        console.error("DEBTOR EVENTS FETCH ERROR:", debtorEventsError);
        return res.status(500).json({
          error: "Failed to fetch events",
          details: debtorEventsError.message,
        });
      }

      debtorEvents = debtorEventsData ?? [];
    }

    const events = [...creatorEvents, ...debtorEvents].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    if (events.length === 0) {
      return res.json([]);
    }

    const eventIds = events.map((event) => event.id);

    const { data: debtsData, error: debtsError } = await supabase
      .from("debts")
      .select("event_id, debtor_wallet, name, amount, paid")
      .in("event_id", eventIds);

    if (debtsError) {
      console.error("DEBTS FETCH ERROR:", debtsError);
      return res.status(500).json({
        error: "Failed to fetch debts",
        details: debtsError.message,
      });
    }

    const debts = debtsData ?? [];
    const debtsByEvent = new Map<string, typeof debts>();

    for (const debt of debts) {
      const list = debtsByEvent.get(debt.event_id) ?? [];
      list.push(debt);
      debtsByEvent.set(debt.event_id, list);
    }

    const response = events.map((event) => {
      const ownerWallet = event.creator_wallet.toLowerCase();

      const participants = (debtsByEvent.get(event.id) ?? []).map(
        (debt, i) => ({
          name:
            debt.name ||
            (debt.debtor_wallet.toLowerCase() === ownerWallet
              ? "Owner"
              : `Participant ${i + 1}`),
          address: debt.debtor_wallet,
          amount: Number(debt.amount),
          paid: Boolean(debt.paid),
          is_owner: debt.debtor_wallet.toLowerCase() === ownerWallet,
        }),
      );

      return {
        ...event,
        role:
          event.creator_wallet.toLowerCase() === wallet ? "creator" : "debtor",
        total_amount: String(event.total_amount),
        participants,
      };
    });

    return res.json(response);
  } catch (err) {
    console.error("EVENTS GET FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      title,
      category,
      total_amount,
      creator_wallet,
      off_chain_id,
      chain_id,
      currency,
      participants = [],
      splits = [],
    } = req.body;

    const normalizedCreatorWallet = String(creator_wallet).toLowerCase();
    const splitInputs = Array.isArray(splits) ? (splits as SplitInput[]) : [];
    const participantInputs = Array.isArray(participants)
      ? (participants as ParticipantInput[])
      : [];
    const sourceInputs =
      splitInputs.length > 0 ? splitInputs : participantInputs;

    if (!title || !total_amount || !normalizedCreatorWallet) {
      return res.status(400).json({ error: "Missing fields" });
    }

    if (sourceInputs.length === 0) {
      return res.status(400).json({ error: "Invalid participants" });
    }

    const mappedParticipants = sourceInputs
      .map((p) => ({
        address: String(p?.address ?? "")
          .trim()
          .toLowerCase(),
        name: String(p?.name ?? "").trim(),
        amount: Number(p?.amount ?? 0),
      }))
      .filter((item) => item.address.startsWith("0x"));

    const uniqueParticipants = mappedParticipants.filter(
      (item, index, self) =>
        self.findIndex((p) => p.address === item.address) === index,
    );

    const expectedTotal = Number(total_amount);
    const splitTotal = uniqueParticipants.reduce(
      (sum, participant) => sum + participant.amount,
      0,
    );

    if (
      !Number.isFinite(expectedTotal) ||
      expectedTotal <= 0 ||
      uniqueParticipants.some((participant) => participant.amount < 0) ||
      Math.abs(splitTotal - expectedTotal) > 0.01
    ) {
      return res.status(400).json({
        error: "Invalid participant split amounts",
        details: `Expected total ${expectedTotal}, received ${splitTotal}`,
      });
    }

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert([
        {
          title,
          category,
          total_amount,
          creator_wallet: normalizedCreatorWallet,
          off_chain_id: off_chain_id ?? null,
          chain_id: chain_id ?? null,
          currency: currency ?? null,
        },
      ])
      .select()
      .single();

    if (eventError || !event) {
      console.error("EVENT INSERT ERROR:", eventError);
      return res.status(500).json({
        error: "Event insert failed",
        details: eventError?.message,
      });
    }

    const finalDebts = uniqueParticipants.map((participant) => ({
      event_id: event.id,
      debtor_wallet: participant.address,
      creditor_wallet: normalizedCreatorWallet,
      name:
        participant.name ||
        (participant.address === normalizedCreatorWallet
          ? "Owner"
          : "Participant"),
      amount: participant.amount,
      paid: participant.address === normalizedCreatorWallet,
    }));

    const { error: debtsError } = await supabase
      .from("debts")
      .insert(finalDebts);

    if (debtsError) {
      console.error("DEBTS ERROR:", debtsError);
      return res.status(500).json({
        error: "Debts insert failed",
        details: debtsError.message,
      });
    }

    return res.json({
      success: true,
      event,
      debts: finalDebts,
    });
  } catch (err) {
    console.error("FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

router.post("/:eventId/pay", async (req, res) => {
  try {
    const offChainId = String(req.params.eventId ?? "").trim();
    const debtorWallet = String(req.body?.debtor_wallet ?? "")
      .trim()
      .toLowerCase();

    if (!offChainId || !debtorWallet) {
      return res
        .status(400)
        .json({ error: "Missing eventId or debtor_wallet" });
    }

    const { data: eventRow, error: eventLookupError } = await supabase
      .from("events")
      .select("id")
      .eq("off_chain_id", offChainId)
      .single();

    if (eventLookupError || !eventRow) {
      console.error("EVENT LOOKUP ERROR:", eventLookupError);
      return res.status(404).json({
        error: "Event not found for given off_chain_id",
      });
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from("debts")
      .update({ paid: true })
      .eq("event_id", eventRow.id)
      .ilike("debtor_wallet", debtorWallet)
      .eq("paid", false)
      .select("event_id, debtor_wallet, name, paid");

    if (updateError) {
      console.error("PAYMENT UPDATE ERROR:", updateError);
      return res.status(500).json({
        error: "Failed to mark payment",
        details: updateError.message,
      });
    }

    if (!updatedRows || updatedRows.length === 0) {
      return res.status(404).json({
        error: "No unpaid debt found for this wallet in this event",
      });
    }

    return res.json({
      success: true,
      updated: updatedRows,
    });
  } catch (err) {
    console.error("PAYMENT FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

export default router;


