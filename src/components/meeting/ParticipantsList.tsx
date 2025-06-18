
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Download, Clock, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  joinTime: Date;
  isPresent: boolean;
  rollNumber?: string;
}

interface ParticipantsListProps {
  participants: Participant[];
  meetingStartTime: Date;
  meetingDuration: number; // in minutes
  isHost: boolean;
  minimumAttendanceMinutes?: number;
}

const ParticipantsList = ({ participants, meetingStartTime, meetingDuration, isHost, minimumAttendanceMinutes = 30 }: ParticipantsListProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  const calculateAttendanceStatus = (participant: Participant) => {
    const now = new Date();
    const participantDuration = Math.floor((now.getTime() - participant.joinTime.getTime()) / 1000 / 60);
    
    // STRICT: Must attend for AT LEAST the minimum required minutes
    if (participantDuration >= minimumAttendanceMinutes) {
      return "present";
    } else {
      return "absent";
    }
  };

  const calculateAttendancePercentage = (participant: Participant) => {
    const now = new Date();
    const participantDuration = Math.floor((now.getTime() - participant.joinTime.getTime()) / 1000 / 60);
    return Math.min(Math.round((participantDuration / minimumAttendanceMinutes) * 100), 100);
  };

  const downloadAttendanceExcel = () => {
    if (!isHost) {
      toast({
        title: "Access Denied",
        description: "Only the meeting host can download attendance reports.",
        variant: "destructive",
      });
      return;
    }

    const attendanceData = participants.map(participant => {
      const duration = Math.floor((new Date().getTime() - participant.joinTime.getTime()) / 1000 / 60);
      const percentage = calculateAttendancePercentage(participant);
      const status = calculateAttendanceStatus(participant);
      
      return {
        'Name': participant.name,
        'Roll Number': participant.rollNumber || 'N/A',
        'Join Time': participant.joinTime.toLocaleString(),
        'Duration (minutes)': duration,
        'Required (minutes)': minimumAttendanceMinutes,
        'Attendance %': `${percentage}%`,
        'Status': status.toUpperCase()
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(attendanceData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
    
    const fileName = `attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast({
      title: "Attendance Downloaded",
      description: "Attendance report has been downloaded as Excel file.",
    });
  };

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        className="fixed top-4 right-4 z-50"
        size="sm"
      >
        <Users className="h-4 w-4 mr-2" />
        Participants ({participants.length})
      </Button>
    );
  }

  return (
    <Card className="fixed top-4 right-4 w-80 max-h-96 z-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants ({participants.length})
          </span>
          <div className="flex gap-2">
            {isHost && (
              <Button size="sm" onClick={downloadAttendanceExcel} title="Download Attendance Excel (Host Only)">
                <Download className="h-4 w-4" />
              </Button>
            )}
            <button
              onClick={() => setIsVisible(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-yellow-50 p-2 rounded-lg mb-3 border border-yellow-200">
          <div className="text-xs font-bold text-yellow-800">
            STRICT ATTENDANCE: {minimumAttendanceMinutes} minutes required
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {participants.map((participant) => {
              const status = calculateAttendanceStatus(participant);
              const percentage = calculateAttendancePercentage(participant);
              const duration = Math.floor((new Date().getTime() - participant.joinTime.getTime()) / 1000 / 60);
              const remaining = Math.max(0, minimumAttendanceMinutes - duration);
              
              return (
                <div key={participant.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{participant.name}</div>
                    {participant.rollNumber && (
                      <div className="text-xs text-muted-foreground">Roll: {participant.rollNumber}</div>
                    )}
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {duration}/{minimumAttendanceMinutes} min ({percentage}%)
                    </div>
                    {status === "absent" && (
                      <div className="text-xs font-bold text-red-600">
                        Need {remaining} more minutes
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={status === "present" ? "default" : "destructive"}
                      className="text-xs font-bold"
                    >
                      {status === "present" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {status === "absent" && <XCircle className="h-3 w-3 mr-1" />}
                      {status.toUpperCase()}
                    </Badge>
                    <div className="flex gap-1">
                      <div className={`w-2 h-2 rounded-full ${participant.isVideoOn ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div className={`w-2 h-2 rounded-full ${participant.isAudioOn ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ParticipantsList;
