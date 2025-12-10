"use client";

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "홈" },
    { href: "/stats", label: "통계" },
    { href: "/bookmarks", label: "북마크" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 max-w-7xl mx-auto">
        {/* 로고 */}
        <Link href="/" className="text-2xl font-bold flex-shrink-0">
          My Trip
        </Link>

        {/* 네비게이션 링크 (데스크톱) */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 검색창 */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="관광지 검색..."
              className="pl-10 w-full min-w-[300px] md:min-w-[500px]"
              disabled
              aria-label="관광지 검색"
            />
          </div>
        </div>

        {/* 로그인 버튼 */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" size="sm">
                로그인
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>

      {/* 모바일 네비게이션 (햄버거 메뉴는 Phase 2에서 구현) */}
      <nav className="md:hidden border-t bg-background">
        <div className="container flex items-center justify-around gap-4 px-4 py-2 max-w-7xl mx-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
