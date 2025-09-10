import { getAllPlaygroundsForUser } from "@/modules/dashboard/actions";
import AddNewButton from "@/modules/dashboard/components/add-new-button";
import AddRepo from "@/modules/dashboard/components/add-repo";
import EmptyState from "@/modules/dashboard/components/empty-state";
import ProjectTable from "@/modules/dashboard/components/project-table";

async function Page() {
  const playgrounds = await getAllPlaygroundsForUser();

  return (
    <div className="flex flex-col justify-start items-center min-h-screen mx-auto max-w-7xl px-4 py-10">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-6 w-full">
        <AddNewButton />
        <AddRepo />
      </div>

      <div className="mt-10 flex flex-col justify-center items-center w-full">
        {playgrounds.length === 0 ? (
          <EmptyState />
        ) : (
          <ProjectTable
            projects={playgrounds ?? []}
            onDelete={(id: string) => Promise.resolve()}
            onEdit={(
              id: string,
              data: { title: string; description: string }
            ) => Promise.resolve()}
            onDuplicate={(id: string) => Promise.resolve()}
            onMarkAsFavorite={(id: string) => Promise.resolve()}
          />
        )}
      </div>
    </div>
  );
}

export default Page;
