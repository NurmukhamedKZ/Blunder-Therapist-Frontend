import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#ede8e0] text-[#2c1f14]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
