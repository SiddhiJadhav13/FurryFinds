"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-muted transition-colors data-checked:bg-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-background shadow transition-transform data-checked:translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
