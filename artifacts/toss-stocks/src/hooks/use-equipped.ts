import { useState, useEffect } from "react";

export interface EquippedItems {
  hat?: string;
  top?: string;
  bottom?: string;
  scarf?: string;
}

function storageKey() {
  const uid = localStorage.getItem("toss_userId") ?? "guest";
  return `wonkwang_equipped_${uid}`;
}

function load(): EquippedItems {
  try {
    const raw = localStorage.getItem(storageKey());
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function useEquipped() {
  const [equipped, setEquipped] = useState<EquippedItems>(load);

  useEffect(() => {
    localStorage.setItem(storageKey(), JSON.stringify(equipped));
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
