"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

function Accordion({ className, ...props }) {
  return (
    <div data-slot="accordion" className={cn("space-y-2", className)} {...props} />
  );
}

function AccordionItem({ className, ...props }) {
  return (
    <details
      data-slot="accordion-item"
      className={cn(
        "group rounded-xl border border-border bg-background p-4 open:shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function AccordionTrigger({ className, children, ...props }) {
  return (
    <summary
      data-slot="accordion-trigger"
      className={cn(
        "flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground outline-none",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" />
    </summary>
  );
}

function AccordionContent({ className, ...props }) {
  return (
    <div
      data-slot="accordion-content"
      className={cn("mt-3 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
