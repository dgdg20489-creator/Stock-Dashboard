import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: ReactNode;
  userId: number;
}

export function Layout({ children, userId }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex gap-5">
        <Sidebar userId={userId} />
        <main className="flex-1 min-w-0 pb-20 md:pb-5">
          {children}
        </main>
      </div>
    </div>
  );
}
