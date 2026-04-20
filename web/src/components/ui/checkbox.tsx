"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const [checked, setChecked] = React.useState(props.checked || props.defaultChecked || false)

    React.useEffect(() => {
      if (props.checked !== undefined) {
        setChecked(props.checked)
      }
    }, [props.checked])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const isChecked = e.target.checked
      if (props.checked === undefined) {
        setChecked(isChecked)
      }
      onCheckedChange?.(isChecked)
    }

    return (
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          ref={ref}
          className={cn(
            "peer size-4 shrink-0 rounded-sm border border-zinc-800 bg-zinc-950 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 appearance-none transition-all cursor-pointer checked:bg-white checked:border-white",
            className
          )}
          onChange={handleChange}
          checked={checked}
          {...props}
        />
        <Check
          className={cn(
            "absolute size-3 text-black pointer-events-none opacity-0 transition-opacity peer-checked:opacity-100",
            "stroke-[4px]"
          )}
        />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
