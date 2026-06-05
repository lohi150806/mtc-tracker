import { useEffect, useState } from 'react';

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export default function WelcomeBanner() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const greeting = greetingForHour(now.getHours());
  const formatted = now.toLocaleString();

  return (
    <section className="rounded-xl bg-gradient-to-r from-[#041826]/40 to-transparent p-4 text-white shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-cyan-200">{greeting}, Lohith</div>
          <div className="mt-1 text-lg font-bold">Welcome back to MTC Analytics</div>
        </div>
        <div className="text-right text-sm text-cyan-100">Last Updated: {formatted}</div>
      </div>
    </section>
  );
}
