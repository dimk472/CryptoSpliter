// routes/contacts.ts

import { Router } from "express";
import { supabase } from "../config/supabase";

export const contactsRouter = Router();

// GET /contacts?wallet=0x...
contactsRouter.get("/", async (req, res) => {
  try {
    const ownerWallet = String(req.query.wallet ?? "")
      .trim()
      .toLowerCase();

    if (!ownerWallet) {
      return res.status(400).json({ error: "Missing wallet query parameter" });
    }

    // Fetch contacts
    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .select("id, owner_wallet, name, photo, created_at, updated_at")
      .ilike("owner_wallet", ownerWallet)
      .order("name", { ascending: true });

    if (contactsError) {
      console.error("CONTACTS FETCH ERROR:", contactsError);
      return res.status(500).json({
        error: "Failed to fetch contacts",
        details: contactsError.message,
      });
    }

    if (!contacts || contacts.length === 0) {
      return res.json([]);
    }

    // Fetch addresses for all contacts
    const contactIds = contacts.map((c) => c.id);
    const { data: addresses, error: addressesError } = await supabase
      .from("contact_addresses")
      .select("*")
      .in("contact_id", contactIds)
      .order("is_primary", { ascending: false });

    if (addressesError) {
      console.error("ADDRESSES FETCH ERROR:", addressesError);
      return res.status(500).json({
        error: "Failed to fetch contact addresses",
        details: addressesError.message,
      });
    }

    // Group addresses by contact
    const addressesByContact = new Map<string, typeof addresses>();
    for (const addr of addresses || []) {
      const list = addressesByContact.get(addr.contact_id) || [];
      list.push(addr);
      addressesByContact.set(addr.contact_id, list);
    }

    const response = contacts.map((contact) => ({
      ...contact,
      addresses: addressesByContact.get(contact.id) || [],
    }));

    return res.json(response);
  } catch (err) {
    console.error("CONTACTS GET FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// POST /contacts
contactsRouter.post("/", async (req, res) => {
  try {
    const { owner_wallet, name, photo, addresses } = req.body ?? {};

    const normalizedOwnerWallet = String(owner_wallet ?? "")
      .trim()
      .toLowerCase();
    const trimmedName = String(name ?? "").trim();

    if (!normalizedOwnerWallet.startsWith("0x")) {
      return res
        .status(400)
        .json({ error: "A valid owner_wallet is required" });
    }
    if (!trimmedName) {
      return res.status(400).json({ error: "A name is required" });
    }
    if (!Array.isArray(addresses) || addresses.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one address is required" });
    }

    // Insert contact
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert([
        {
          owner_wallet: normalizedOwnerWallet,
          name: trimmedName,
          photo: photo || null,
        },
      ])
      .select("id")
      .single();

    if (contactError || !contact) {
      console.error("CONTACT INSERT ERROR:", contactError);
      return res.status(500).json({
        error: "Failed to create contact",
        details: contactError?.message,
      });
    }

    // Insert addresses
    const addressRows = addresses.map((addr: any) => ({
      contact_id: contact.id,
      address: String(addr.address || "")
        .trim()
        .toLowerCase(),
      chain_id: Number(addr.chain_id) || 1,
      chain_name: String(addr.chain_name || "Ethereum").trim(),
      label: addr.label || null,
      is_primary: Boolean(addr.is_primary),
    }));

    const { error: addrError } = await supabase
      .from("contact_addresses")
      .insert(addressRows);

    if (addrError) {
      console.error("ADDRESS INSERT ERROR:", addrError);
      // Cleanup: delete the contact if addresses failed
      await supabase.from("contacts").delete().eq("id", contact.id);
      return res.status(500).json({
        error: "Failed to save contact addresses",
        details: addrError.message,
      });
    }

    return res.status(201).json({ id: contact.id, ...req.body });
  } catch (err) {
    console.error("CONTACTS POST FATAL ERROR:", err);
    return res.status(500).json({
      error: "Server crashed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
});

// PUT /contacts/:id
contactsRouter.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { owner_wallet, name, photo, addresses } = req.body ?? {};

    const normalizedOwnerWallet = String(owner_wallet ?? "")
      .trim()
      .toLowerCase();
    const trimmedName = String(name ?? "").trim();

    if (!normalizedOwnerWallet.startsWith("0x")) {
      return res
        .status(400)
        .json({ error: "A valid owner_wallet is required" });
    }
    if (!trimmedName) {
      return res.status(400).json({ error: "A name is required" });
    }

    // Update contact
    const { error: updateError } = await supabase
      .from("contacts")
      .update({
        name: trimmedName,
        photo: photo || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .ilike("owner_wallet", normalizedOwnerWallet);

    if (updateError) {
      console.error("CONTACT UPDATE ERROR:", updateError);
      return res.status(500).json({
        error: "Failed to update contact",
        details: updateError.message,
      });
    }

    // Replace addresses: delete old, insert new
    if (Array.isArray(addresses)) {
      await supabase.from("contact_addresses").delete().eq("contact_id", id);

      const addressRows = addresses.map((addr: any) => ({
        contact_id: id,
        address: String(addr.address || "")
          .trim()
          .toLowerCase(),
        chain_id: Number(addr.chain_id) || 1,
        chain_name: String(addr.chain_name || "Ethereum").trim(),
        label: addr.label || null,
        is_primary: Boolean(addr.is_primary),
      }));

      const { error: addrError } = await supabase
        .from("contact_addresses")
        .insert(addressRows);

      if (addrError) {
        console.error("ADDRESS UPDATE ERROR:", addrError);
        return res.status(500).json({
          error: "Failed to update addresses",
          details: addrError.message,
        });
      }
    }

    return res.json({ success: true });
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

    if (!ownerWallet.startsWith("0x")) {
      return res
        .status(400)
        .json({ error: "A valid wallet query parameter is required" });
    }

    // Addresses will be cascade-deleted
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
