import { SidebarProvider } from "@/components/ui/sidebar";
import { getAllPlaygroundsForUser } from "@/modules/dashboard/actions";
import { DashboardSidebar } from "@/modules/dashboard/components/dashboard-sidebar";

const technologyIconMap = {
  REACT: "Zap",
  VUE: "Compass",
  ANGULAR: "Terminal",
  NEXT: "Lightbulb",
  EXPRESS: "Database",
  HONO: "FlameIcon",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const playgrounds = await getAllPlaygroundsForUser();

  const formattedPlaygrounds = playgrounds.map((playground) => ({
    ...playground,
    icon: technologyIconMap[playground.template] ?? "Code2",
    starred: false,
  }));

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <DashboardSidebar playgrounds={formattedPlaygrounds} />
        <main className="flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
