import React from "react";
import { Navbar } from "../ui/navbar";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}