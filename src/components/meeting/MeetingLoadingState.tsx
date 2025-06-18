
import { Loader2 } from "lucide-react";

const MeetingLoadingState = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <div className="text-lg">Loading meeting...</div>
        <div className="text-sm text-muted-foreground">
          Please wait while we connect you to the meeting
        </div>
      </div>
    </div>
  );
};

export default MeetingLoadingState;
