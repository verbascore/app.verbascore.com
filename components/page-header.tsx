"use client";

import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  accessory,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  accessory?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </div>

        {accessory}
      </div>

      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
