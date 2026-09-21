import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type KamaloSelectOption = {
  value: string;
  label: string;
};

export function KamaloSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  contentClassName,
  testId,
  ariaLabel,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: KamaloSelectOption[];
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  testId?: string;
  ariaLabel?: string;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn('kamalo-select-trigger h-10 w-full rounded-xl text-[11px] font-semibold', className)}
        aria-label={ariaLabel}
        data-testid={testId}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={cn('kamalo-select-content min-w-[var(--radix-select-trigger-width)]', contentClassName)}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="kamalo-select-item">
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}