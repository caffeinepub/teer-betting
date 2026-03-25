import { motion } from "motion/react";

interface NumberGridProps {
  selected: number[];
  onToggle: (n: number) => void;
  disabled?: boolean;
}

export default function NumberGrid({
  selected,
  onToggle,
  disabled,
}: NumberGridProps) {
  return (
    <div className="grid grid-cols-10 gap-1.5">
      {Array.from({ length: 100 }, (_, i) => {
        const num = i;
        const isSelected = selected.includes(num);
        const label = num.toString().padStart(2, "0");
        return (
          <motion.button
            key={num}
            whileTap={{ scale: 0.88 }}
            data-ocid={`grid.number.${num < 10 ? `0${num}` : num}.button`}
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
    </div>
  );
}
