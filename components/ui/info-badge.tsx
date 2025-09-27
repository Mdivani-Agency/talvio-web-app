import { InfoIcon } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

export const InfoBadge = ({ info, className }: { info: string, className?: string }) => {
  return (
    <Tooltip>
      <TooltipTrigger className={className}>
        <InfoIcon className="size-3 text-foreground/50 size-4" />
      </TooltipTrigger>
      <TooltipContent variant="default" className="text-sm max-w-sm line-clamp-4 overflow-hidden">{info}</TooltipContent>
    </Tooltip>
  );
};
