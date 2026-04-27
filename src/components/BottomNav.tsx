'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: '首页', icon: '🏠' },
  { href: '/eup-clock', label: 'Eup钟', icon: '⏰' },
  { href: '/water', label: '喝水', icon: '💧' },
  { href: '/stats', label: '统计', icon: '📊' },
  { href: '/settings', label: '设置', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#2a3a5c] bg-[#1a1a2e]">
      <div className="mx-auto flex max-w-md items-center justify-around px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-3 px-4 text-[10px] transition-colors ${
                isActive ? 'text-[#f5a623]' : 'text-[#8892a4] hover:text-[#f0f0f0]'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
