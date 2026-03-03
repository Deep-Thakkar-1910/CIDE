"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Languages, RoomType } from "@/generated/prisma/enums";

interface Props {
  open: boolean;
  onClose: () => void;
  currentLanguage: string;
  currentType: string;
  onApply: (filters: { language: string; type: string }) => void;
}

export function RoomFilterDialog({
  open,
  onClose,
  currentLanguage,
  currentType,
  onApply,
}: Props) {
  const [language, setLanguage] = useState(currentLanguage);
  const [types, setTypes] = useState<string[]>(
    currentType ? [currentType] : [],
  );

  const handleApply = () => {
    let normalizedType = "";

    if (types.length === 1) {
      normalizedType = types[0];
    }

    onApply({
      language,
      type: normalizedType,
    });

    onClose();
  };

  const handleClear = () => {
    setLanguage("");
    setTypes([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Filter Rooms</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Language */}
          <div>
            <label className="text-sm font-medium">Language</label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="All languages" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Languages).map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Type */}
          <div>
            <label className="text-sm font-medium">Room Type</label>
            <ToggleGroup
              type="multiple"
              value={types}
              onValueChange={setTypes}
              className="mt-2"
            >
              <ToggleGroupItem
                className="border-border border"
                value={RoomType.SINGLE}
              >
                Single
              </ToggleGroupItem>
              <ToggleGroupItem
                className="border-border border"
                value={RoomType.MULTI}
              >
                Multi
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
