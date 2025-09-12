"use client";

import { Button } from "@/components/ui/button";
import { StarIcon, StarOffIcon } from "lucide-react";
import { forwardRef, useState } from "react";
import { toast } from "sonner";
import { toggleStarMark } from "../actions";

interface MarkedToggleButtonProps
  extends React.ComponentPropsWithoutRef<typeof Button> {
  markedForRevision: boolean | undefined;
  id: string;
}

const MarkedToggleButton = forwardRef<
  HTMLButtonElement,
  MarkedToggleButtonProps
>(function MarkedToggleButton(
  { markedForRevision, id, onClick, className, children, ...props },
  ref
) {
  const [isMarked, setIsMarked] = useState(markedForRevision);

  const handleToggle = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    onClick?.(e);
    setIsMarked((prev) => !prev);

    try {
      await toggleStarMark(id, !isMarked);

      if (!isMarked) {
        toast.success("Added to favorites successfully!");
      } else {
        toast.error("Removed from favorites successfully!");
      }
    } catch (error) {
      console.error("Error toggling mark:", error);
      toast.error("Failed to toggle mark");
      setIsMarked((prev) => !prev);
    }
  };

  return (
    <Button
      ref={ref}
      variant="ghost"
      onClick={handleToggle}
      className={`flex items-center justify-start w-full px-2 py-1.5 text-sm rounded-md cursor-pointer ${className}`}
      {...props}
    >
      {isMarked ? (
        <StarIcon size={16} className="text-red-500 mr-2" />
      ) : (
        <StarOffIcon size={16} className="text-gray-500 mr-2" />
      )}
      {children || (isMarked ? "Unmark as Favorite" : "Mark as Favorite")}
    </Button>
  );
});

export default MarkedToggleButton;
