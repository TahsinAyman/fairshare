export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* TODO: Sidebar component goes here */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
