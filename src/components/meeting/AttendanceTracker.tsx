
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
  joinTime: Date;
  isPresent: boolean;
}

interface AttendanceTrackerProps {
  participants: Participant[];
  meetingStartTime: Date;
  minimumAttendanceMinutes?: number;
}

const AttendanceTracker = ({ participants, meetingStartTime, minimumAttendanceMinutes = 30 }: AttendanceTrackerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);

  useEffect(() => {
    const updateDuration = () => {
      const now = new Date();
      const duration = Math.floor((now.getTime() - meetingStartTime.getTime()) / 1000 / 60);
      setMeetingDuration(duration);
    };

    updateDuration();
    const interval = setInterval(updateDuration, 60000);

    return () => clearInterval(interval);
  }, [meetingStartTime]);

  const calculateAttendanceStatus = (participant: Participant) => {
    const now = new Date();
    const participantDuration = Math.floor((now.getTime() - participant.joinTime.getTime()) / 1000 / 60);
    
    console.log(`AttendanceTracker - ${participant.name}: attended ${participantDuration} minutes, required ${minimumAttendanceMinutes} minutes`);
    
    // STRICT: Must attend for AT LEAST the minimum required minutes
    // No rounding, no partial credit - must complete the FULL duration
    if (participantDuration >= minimumAttendanceMinutes) {
      return "present";
    } else {
      return "absent";
    }
  };

  const getRemainingTime = (participant: Participant) => {
    const now = new Date();
    const participantDuration = Math.floor((now.getTime() - participant.joinTime.getTime()) / 1000 / 60);
    return Math.max(0, minimumAttendanceMinutes - participantDuration);
  };

  const getProgressPercentage = (participant: Participant) => {
    const now = new Date();
    const participantDuration = Math.floor((now.getTime() - participant.joinTime.getTime()) / 1000 / 60);
    return Math.min((participantDuration / minimumAttendanceMinutes) * 100, 100);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg z-40"
      >
        <Clock className="h-4 w-4 mr-2 inline" />
        Attendance Tracker ({minimumAttendanceMinutes}min required)
      </button>
    );
  }

  return (
    <Card className="absolute top-4 left-4 w-80 z-40 bg-white/95 backdrop-blur-md border border-white/20 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Attendance Tracker
          </span>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="text-sm text-red-800 font-bold">
            STRICT ATTENDANCE POLICY
          </div>
          <div className="text-xs text-red-700 mt-1">
            Must attend for FULL {minimumAttendanceMinutes} minutes to be marked present
          </div>
          <div className="text-xs text-red-600 mt-1">
            Meeting Duration: {meetingDuration} minutes
          </div>
        </div>
        
        {participants.map((participant) => {
          const status = calculateAttendanceStatus(participant);
          const duration = Math.floor((new Date().getTime() - participant.joinTime.getTime()) / 1000 / 60);
          const progress = getProgressPercentage(participant);
          const remaining = getRemainingTime(participant);
          
          return (
            <div key={participant.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="font-medium text-sm text-gray-900">{participant.name}</div>
                  <div className="text-xs text-gray-500">Attended: {duration} minutes</div>
                </div>
                <div className="flex items-center gap-1">
                  {status === "present" && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {status === "absent" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  <span className={`text-xs font-bold uppercase ${
                    status === "present" ? "text-green-600" : "text-red-600"
                  }`}>
                    {status}
                  </span>
                </div>
              </div>
              
              {/* Strict Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    status === "present" ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="text-xs text-gray-600 font-medium">
                {status === "present" ? 
                  `✅ ATTENDANCE COMPLETED (${duration}/${minimumAttendanceMinutes} min)` : 
                  `❌ ${remaining} minutes remaining for attendance`
                }
              </div>
              
              {status === "absent" && (
                <div className="text-xs text-red-600 font-bold mt-1">
                  MUST STAY {remaining} MORE MINUTES
                </div>
              )}
            </div>
          );
        })}
        
        <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="font-bold">Present: Completed FULL {minimumAttendanceMinutes} minutes</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-bold">Absent: Less than {minimumAttendanceMinutes} minutes attended</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceTracker;
