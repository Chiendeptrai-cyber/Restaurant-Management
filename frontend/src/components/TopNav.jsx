import { NavLink } from 'react-router-dom';

function TopNav({ cartCount }) {
  const activeClass = 'rounded-2xl px-3 py-2 transition bg-slate-900 text-white shadow-lg ring-1 ring-slate-200 font-semibold';
  const inactiveClass = 'rounded-2xl px-3 py-2 transition text-slate-700 hover:text-slate-900 hover:bg-slate-100';

  return (
    <nav className="flex items-center gap-4 text-sm font-medium">
      <NavLink to="/" end className={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
        Sản phẩm
      </NavLink>
      <NavLink to="/cart" className={({ isActive }) => (isActive ? activeClass : inactiveClass)}>
        Giỏ hàng ({cartCount})
      </NavLink>
    </nav>
  );
}

export default TopNav;
