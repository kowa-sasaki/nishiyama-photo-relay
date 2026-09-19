import { NavLink } from 'react-router-dom'
import './BottomNav.css'

const NAV_ITEMS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'ホーム', end: true },
  { to: '/spots', label: '定点' },
  { to: '/post', label: '＋投稿' },
  { to: '/share', label: '概要' },
]

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="メインナビゲーション">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end ?? false}
          className={({ isActive }) =>
            `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
