import { NavLink } from 'react-router-dom';
import { BookUser, Box, Code, GitMerge, LayoutDashboard } from 'lucide-react';
import UserBadge from './UserBadge.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/annuaire', label: 'Annuaire', icon: BookUser },
  { to: '/matching', label: 'Matching', icon: GitMerge },
  { to: '/api-docs', label: 'API Docs', icon: Code },
  { to: '/section-3', label: 'Section 3', icon: Box },
  { to: '/section-4', label: 'Section 4', icon: Box },
];

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-neutral-100'
  }`;

export default function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 px-5 py-5 dark:border-white/10">
        <p className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          Monday Explorer
        </p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-500">Invest Malin</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={linkClasses}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <UserBadge />
    </aside>
  );
}
