export default function ExecutiveView() {
  return (
    <section className="rounded-lg border border-[#1E293B] bg-[#0B1220] p-6 shadow-panel">
      <h2 className="text-xl font-bold text-[#E2E8F0]">Executive Dashboard (MD)</h2>
      <p className="mt-2 text-sm text-[#94A3B8]">High-level KPIs and one-click executive insights.</p>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-[#0F172A] p-4 text-[#E2E8F0]">Total Revenue</div>
        <div className="rounded-lg bg-[#0F172A] p-4 text-[#E2E8F0]">Profit Margin</div>
        <div className="rounded-lg bg-[#0F172A] p-4 text-[#E2E8F0]">Top Risk Routes</div>
      </div>
    </section>
  );
}
