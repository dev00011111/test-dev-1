
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateMeetingDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [minimumAttendance, setMinimumAttendance] = useState("30");
  const navigate = useNavigate();

  const generateMeetingId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setMeetingId(id);
  };

  const handleCreateMeeting = () => {
    if (!meetingId.trim()) return;
    
    // Store the minimum attendance in localStorage so it can be used when creating the meeting
    localStorage.setItem(`meeting_${meetingId}_min_attendance`, minimumAttendance);
    
    navigate(`/meeting/${meetingId}`);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Meeting
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-6 w-6 text-blue-600" />
            Create AI-Powered Meeting
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="meetingId" className="text-sm font-medium">Meeting ID</Label>
            <div className="flex gap-2">
              <Input
                id="meetingId"
                value={meetingId}
                onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                placeholder="Enter or generate ID"
                className="flex-1"
              />
              <Button variant="outline" onClick={generateMeetingId}>
                Generate
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Minimum Attendance Duration
            </Label>
            <Select value={minimumAttendance} onValueChange={setMinimumAttendance}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 minutes (Instant attendance)</SelectItem>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
                <SelectItem value="120">120 minutes</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Students must attend for at least this duration to be marked present
            </p>
          </div>
          
          <Button 
            onClick={handleCreateMeeting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!meetingId.trim()}
          >
            Create Meeting
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateMeetingDialog;
