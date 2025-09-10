import Image from "next/image";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Image
        src="/empty-state.svg"
        alt="No projects"
        className="mb-4"
        width={192}
        height={192}
      />
      <h2 className="text-xl font-semibold text-gray-500">No projects found</h2>
      <p className="text-gray-400">Create a new project to get started!</p>
    </div>
  );
}

export default EmptyState;
