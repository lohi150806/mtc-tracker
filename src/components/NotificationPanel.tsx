export default function NotificationPanel() {
  const notifications = [
    { id: 1, text: 'Daily ridership report ready' },
    { id: 2, text: 'Reimbursement submission due in 3 days' },
  ];

  return (
    <aside className="w-80 rounded-xl bg-[#0B1220] p-4 shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-semibold text-[#E2E8F0]">Notifications</div>
        <div className="text-xs text-[#94A3B8]">2</div>
      </div>
      <ul className="space-y-2 text-sm">
        {notifications.map((n) => (
          <li key={n.id} className="rounded-md bg-[#0F172A] p-2 text-[#E2E8F0]">{n.text}</li>
        ))}
      </ul>
    </aside>
  );
}
