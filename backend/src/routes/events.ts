import { Router } from "express";
import { supabase } from "../config/supabase";

const router = Router();

type ParticipantInput = {
  address?: unknown;
  name?: unknown;
  amount?: unknown; // ✅ Προσθήκη του amount στον τύπο εισόδου
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

    // ✅ Σωστό De-duplication με βάση το address
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

// ==========================================================================
// CONTACTS ROUTES
// ==========================================================================
// Separate router so it can be mounted at its own base path, e.g.:
//
//   import eventsRouter, { contactsRouter } from "./events"; // this file
//   app.use("/events", eventsRouter);
//   app.use("/contacts", contactsRouter);
//
// Table (Supabase / Postgres):
//
//   create table contacts (
//     id uuid primary key default gen_random_uuid(),
//     owner_wallet varchar(42) not null,
//     name varchar(100) not null,
//     address varchar(42) not null,
//     photo text,
//     created_at timestamp default now(),
//     updated_at timestamp default now(),
//     unique (owner_wallet, address)
//   );
//
//   create index idx_contacts_owner_wallet on contacts (owner_wallet);

export const contactsRouter = Router();

function isValidWallet(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim().toLowerCase().startsWith("0x")
  );
}

// GET /contacts?wallet=0x...
contactsRouter.get("/", async (req, res) => {
  try {
    const ownerWallet = String(req.query.wallet ?? "")
      .trim()
      .toLowerCase();

    if (!ownerWallet) {
      return res.status(400).json({ error: "Missing wallet query parameter" });
    }

    const { data, error } = await supabase
      .from("contacts")
      .select("id, name, address, photo")
      .ilike("owner_wallet", ownerWallet)
      .order("name", { ascending: true });

    if (error) {
      console.error("CONTACTS FETCH ERROR:", error);
      return res.status(500).json({
        error: "Failed to fetch contacts",
        details: error.message,
      });
    }

    return res.json(data ?? []);
  } catch (err) {
    console.error("CONTACTS GET FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// POST /contacts
// body: { owner_wallet, name, address, photo? }
contactsRouter.post("/", async (req, res) => {
  try {
    const { owner_wallet, name, address, photo } = req.body ?? {};

    const normalizedOwnerWallet = String(owner_wallet ?? "")
      .trim()
      .toLowerCase();
    const normalizedAddress = String(address ?? "")
      .trim()
      .toLowerCase();
    const trimmedName = String(name ?? "").trim();

    if (!isValidWallet(normalizedOwnerWallet)) {
      return res
        .status(400)
        .json({ error: "A valid owner_wallet is required" });
    }
    if (!trimmedName) {
      return res.status(400).json({ error: "A name is required" });
    }
    if (!isValidWallet(normalizedAddress)) {
      return res
        .status(400)
        .json({ error: "A valid contact address is required" });
    }

    // ✅ upsert με βάση (owner_wallet, address): αν υπάρχει ήδη η επαφή, ενημερώνεται
    const { data, error } = await supabase
      .from("contacts")
      .upsert(
        [
          {
            owner_wallet: normalizedOwnerWallet,
            name: trimmedName,
            address: normalizedAddress,
            photo: photo ?? null,
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "owner_wallet,address" },
      )
      .select("id, name, address, photo")
      .single();

    if (error || !data) {
      console.error("CONTACT UPSERT ERROR:", error);
      return res.status(500).json({
        error: "Failed to save contact",
        details: error?.message,
      });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("CONTACTS POST FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// PUT /contacts/:id
// body: { owner_wallet, name, address, photo? }
contactsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { owner_wallet, name, address, photo } = req.body ?? {};

    const normalizedOwnerWallet = String(owner_wallet ?? "")
      .trim()
      .toLowerCase();
    const normalizedAddress = String(address ?? "")
      .trim()
      .toLowerCase();
    const trimmedName = String(name ?? "").trim();

    if (!isValidWallet(normalizedOwnerWallet)) {
      return res
        .status(400)
        .json({ error: "A valid owner_wallet is required" });
    }
    if (!trimmedName) {
      return res.status(400).json({ error: "A name is required" });
    }
    if (!isValidWallet(normalizedAddress)) {
      return res
        .status(400)
        .json({ error: "A valid contact address is required" });
    }

    const { data, error } = await supabase
      .from("contacts")
      .update({
        name: trimmedName,
        address: normalizedAddress,
        photo: photo ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .ilike("owner_wallet", normalizedOwnerWallet)
      .select("id, name, address, photo")
      .maybeSingle();

    if (error) {
      console.error("CONTACT UPDATE ERROR:", error);
      return res.status(500).json({
        error: "Failed to update contact",
        details: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({ error: "Contact not found" });
    }

    return res.json(data);
  } catch (err) {
    console.error("CONTACTS PUT FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// DELETE /contacts/:id?wallet=0x...
contactsRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const ownerWallet = String(req.query.wallet ?? "")
      .trim()
      .toLowerCase();

    if (!isValidWallet(ownerWallet)) {
      return res
        .status(400)
        .json({ error: "A valid wallet query parameter is required" });
    }

    const { data, error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", id)
      .ilike("owner_wallet", ownerWallet)
      .select("id");

    if (error) {
      console.error("CONTACT DELETE ERROR:", error);
      return res.status(500).json({
        error: "Failed to delete contact",
        details: error.message,
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "Contact not found" });
    }

    return res.status(204).send();
  } catch (err) {
    console.error("CONTACTS DELETE FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});
