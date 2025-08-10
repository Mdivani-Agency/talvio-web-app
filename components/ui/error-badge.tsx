import { AlertCircleIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export const ErrorBadge = ({ error, className }: { error: string, className?: string }) => {
  return (
    <Tooltip>
      <TooltipTrigger className={className}>
        <AlertCircleIcon className="size-3 text-destructive size-4" />
      </TooltipTrigger>
      <TooltipContent variant="destructive" className="text-sm max-w-sm line-clamp-4 overflow-hidden">{error}</TooltipContent>
    </Tooltip>
  );
};
