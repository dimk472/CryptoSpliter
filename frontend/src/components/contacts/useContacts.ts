import { useCallback, useEffect, useState } from "react";

export type Contact = {
  id: string;
  name: string;
  address: string;
  photo: string; // base64 data URL, or '' if none was set
};

const API_URL = (
  import.meta.env.VITE_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/**
 * Resizes/compresses an uploaded image file into a small base64 data URL,
 * so profile photos stay cheap to send/store (keep them well under any
 * request body size limit your API/proxy enforces).
 */
export function compressImageToDataUrl(
  file: File,
  maxSize = 160,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode the image file."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas is not supported in this browser."));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Manages a per-wallet address book, backed by the /contacts API.
 * `ownerAddress` is the currently connected wallet — every contact belongs
 * to it, and the backend enforces that on every read/write.
 */
export function useContacts(ownerAddress: string) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!ownerAddress) {
      setContacts([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/contacts?wallet=${encodeURIComponent(ownerAddress)}`,
      );
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [ownerAddress]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveContact = useCallback(
    async (contact: Omit<Contact, "id"> & { id?: string }) => {
      if (!ownerAddress) return;

      try {
        const isUpdate = Boolean(contact.id);
        const url = isUpdate
          ? `${API_URL}/contacts/${contact.id}`
          : `${API_URL}/contacts`;
        const response = await fetch(url, {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner_wallet: ownerAddress,
            name: contact.name,
            address: contact.address,
            photo: contact.photo || null,
          }),
        });

        if (!response.ok) throw new Error(await response.text());
        await refresh();
      } catch (err) {
        console.error("Failed to save contact:", err);
        alert(err instanceof Error ? err.message : "Failed to save contact.");
      }
    },
    [ownerAddress, refresh],
  );

  const deleteContact = useCallback(
    async (id: string) => {
      if (!ownerAddress) return;

      try {
        const response = await fetch(
          `${API_URL}/contacts/${id}?wallet=${encodeURIComponent(ownerAddress)}`,
          { method: "DELETE" },
        );
        if (!response.ok && response.status !== 404)
          throw new Error(await response.text());
        await refresh();
      } catch (err) {
        console.error("Failed to delete contact:", err);
        alert(err instanceof Error ? err.message : "Failed to delete contact.");
      }
    },
    [ownerAddress, refresh],
  );

  const findByAddress = useCallback(
    (address: string) => {
      return contacts.find(
        (c) => c.address.toLowerCase() === address.toLowerCase(),
      );
    },
    [contacts],
  );

  return {
    contacts,
    isLoading,
    saveContact,
    deleteContact,
    findByAddress,
    refresh,
  };
}
