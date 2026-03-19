export function DeviceHandoffCard() {
  return (
    <aside className="rounded-3xl border bg-card/90 p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Session policy
      </p>
      <h3 className="mt-2 text-lg font-semibold">Device handoff</h3>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        <li>Only one active seller session can be handled at a time.</li>
        <li>Web and mobile can both see the same session state in real time.</li>
        <li>
          Switching the handler moves the active control surface without creating
          a new call.
        </li>
      </ul>
    </aside>
  );
}
