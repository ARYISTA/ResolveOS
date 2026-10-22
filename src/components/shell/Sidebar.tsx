"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  FileText,
  ClipboardList,
  BookOpen,
  ScrollText,
  FlaskConical,
  GitCompare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Domains", icon: LayoutDashboard },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer", label: "Customer", icon: User },
  { href: "/cases", label: "Cases", icon: FileText },
  { href: "/reviews", label: "Reviews", icon: ClipboardList },
  { href: "/policies", label: "Policies", icon: BookOpen },
  { href: "/audit", label: "Audit log", icon: ScrollText },
  { href: "/security-lab", label: "Security lab", icon: FlaskConical },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? 64 : 248,
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        transition: "width 200ms ease-out",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Product name */}
      <div
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: collapsed ? "0 16px" : "0 20px",
          borderBottom: "1px solid var(--border)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--text)",
              whiteSpace: "nowrap",
            }}
          >
            ResolvOS
          </span>
        )}
        {collapsed && (
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 18,
              fontWeight: 500,
              color: "var(--accent)",
            }}
          >
            R
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href as string);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: collapsed ? "10px 12px" : "10px 12px",
                borderRadius: 8,
                background: active ? "var(--accent-soft)" : "transparent",
                color: active ? "var(--text)" : "var(--text-muted)",
                textDecoration: "none",
                fontSize: 14,
                fontWeight: active ? 500 : 400,
                marginBottom: 2,
                transition: "background 150ms ease-out, color 150ms ease-out",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
              className={cn("sidebar-link")}
            >
              <Icon size={18} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{
          margin: "8px",
          padding: "8px",
          borderRadius: 8,
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
}
