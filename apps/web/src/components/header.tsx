import { Link, type LinkProps } from "@tanstack/react-router";

export default function Header() {
  const links: { to: LinkProps["to"]; label: string }[] = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/convex-showcase", label: "Convex Features" },
  ];

  const adminLinks: { to: LinkProps["to"]; label: string }[] = [
    { to: "/admin/carriers", label: "Carriers" },
    { to: "/admin/terminals", label: "Terminals" },
    { to: "/admin/gates", label: "Gates" },
    { to: "/admin/trucks", label: "Trucks" },
  ];

  return (
    <div>
      <div className="flex flex-row items-center justify-between px-2 py-1">
        <nav className="flex gap-4 text-lg">
          {links.map(({ to, label }) => {
            return (
              <Link key={String(to)} to={to}>
                {label}
              </Link>
            );
          })}
          <span className="text-muted-foreground">|</span>
          {adminLinks.map(({ to, label }) => {
            return (
              <Link key={String(to)} to={to} className="text-sm">
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2"></div>
      </div>
      <hr />
    </div>
  );
}
