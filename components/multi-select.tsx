import React, { useEffect, useMemo, useRef, useState } from "react";
import MultiSelect from "react-native-multiple-select";
import { ThemedView } from "./themed-view";

type Sharer = { id: string | number; name: string };

type Props = {
  sharers: Sharer[];
  selectedSharers: string[];
  setSelectedSharers: React.Dispatch<React.SetStateAction<string[]>>;
};

export function MultiSharerSelect({
  sharers,
  selectedSharers,
  setSelectedSharers,
}: Props) {
  const multiSelectRef = useRef<MultiSelect | null>(null);

  const [pending, setPending] = useState<string[]>(selectedSharers);

  const sharersForSelect = useMemo(() => {
    const seen = new Map<string, Sharer>();
    for (const s of sharers) {
      const id = String(s.id);
      if (!seen.has(id)) seen.set(id, { ...s, id }); // normalize id to string too
    }
    return Array.from(seen.values()) as Array<{ id: string; name: string }>;
  }, [sharers]);

  useEffect(() => {
    setPending(selectedSharers);
  }, [selectedSharers]);

  return (
    <ThemedView style={{ marginBottom: 20, width: "80%" }}>
      <MultiSelect
        styleListContainer={{
          backgroundColor: "#323232",
        }}
        searchInputStyle={{
          backgroundColor: "#323232",
        }}
        styleDropdownMenuSubsection={{
          backgroundColor: "#323232",
          borderRadius: 3,
        }}
        ref={multiSelectRef}
        items={sharersForSelect}
        uniqueKey="id"
        displayKey="name"
        selectedItems={pending}
        onSelectedItemsChange={setPending}
        selectText="Valitse jakajat"
        searchInputPlaceholderText="Etsi..."
        submitButtonText="Valmis"
        submitButtonColor="#7092e9ff"
        selectedItemTextColor="#7092e9ff"
        selectedItemIconColor="#7092e9ff"
        tagBorderColor="#7092e9ff"
        styleInputGroup={{
          backgroundColor: "#323232",
          borderWidth: 1,
          borderColor: "grey",
        }}
        onToggleList={() => {
          setSelectedSharers(pending);
        }}
      />
    </ThemedView>
  );
}
