import { motion } from "motion/react";
import React from "react";

interface NumberGridProps {
  selected: number[];
  onToggle: (n: number) => void;
  onToggleRow?: (rowDigit: number) => void;
  onToggleCol?: (colDigit: number) => void;
  disabled?: boolean;
}

const COL_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const ROW_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function NumberGrid({
  selected,
  onToggle,
  onToggleRow,
  onToggleCol,
  disabled,
}: NumberGridProps) {
  return (
    <div
      className="grid"
      style={{ gridTemplateColumns: "auto repeat(10, 1fr)", gap: "0.375rem" }}
    >
      {/* Corner cell */}
      <div />
      {/* Column headers 0-9 */}
      {COL_DIGITS.map((c) => (
        <button
          key={`col-header-${c}`}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onToggleCol?.(c)}
          className="aspect-square rounded-lg text-xs font-bold bg-card-mid border border-neon/30 text-neon hover:bg-neon/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {c}
        </button>
      ))}

      {/* Rows */}
      {ROW_DIGITS.map((r) => (
        <React.Fragment key={`row-${r}`}>
          {/* Row header */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onToggleRow?.(r)}
            className="aspect-square rounded-lg text-xs font-bold bg-card-mid border border-neon/30 text-neon hover:bg-neon/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {r}
          </button>
          {/* 10 numbers in this row */}
          {COL_DIGITS.map((c) => {
            const num = r * 10 + c;
            const isSelected = selected.includes(num);
            const label = num.toString().padStart(2, "0");
            return (
              <motion.button
                key={`num-${num}`}
                whileTap={{ scale: 0.88 }}
                data-ocid={`grid.number.${label}.button`}
                onClick={() => !disabled && onToggle(num)}
                disabled={disabled}
                className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-neon text-black neon-glow"
                    : "bg-card-mid border border-border text-muted-foreground hover:border-neon/50 hover:text-foreground"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {label}
              </motion.button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
