import { useState, useEffect } from "react";

const STORAGE_KEY = "wonkwang_equipped";

export interface EquippedItems {
  hat?: string;
  top?: string;
  bottom?: string;
  scarf?: string;
}

function load(): EquippedItems {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function useEquipped() {
  const [equipped, setEquipped] = useState<EquippedItems>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(equipped));
  }, [equipped]);

  const equip = (slot: keyof EquippedItems, itemId: string) => {
    setEquipped((prev) => ({
      ...prev,
      [slot]: prev[slot] === itemId ? undefined : itemId,
    }));
  };

  const unequip = (slot: keyof EquippedItems) => {
    setEquipped((prev) => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  return { equipped, equip, unequip };
}
