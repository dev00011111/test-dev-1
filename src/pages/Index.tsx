
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Video, Users, ArrowRight, Bot, Zap, Shield, User, LogOut, Sparkles, Star, Clock, Globe } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CreateMeetingDialog from "@/components/meeting/CreateMeetingDialog";

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [meetingId, setMeetingId] = useState("");

  const handleJoinMeeting = () => {
    if (!meetingId.trim()) return;
    navigate(`/meeting/${meetingId.toUpperCase()}`);
  };

  const getUserDisplayName = () => {
    if (!user) return "";
    return user.user_metadata?.name || 
           user.user_metadata?.full_name || 
           user.email?.split('@')[0] || 
           "User";
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                SmartMeet
              </h1>
              <p className="text-xl sm:text-2xl text-white/80 max-w-2xl mx-auto">
                Experience the future of video conferencing with AI-powered intelligence
              </p>
            </div>
            
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-full shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-2000"></div>
      </div>

      {/* Header */}
      <div className="relative z-20 sticky top-0 bg-white/70 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  SmartMeet
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">AI-Powered Meetings</p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 sm:h-12 sm:w-12 rounded-full hover:bg-white/60 transition-all duration-200">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white/50">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold text-sm">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 bg-white/95 backdrop-blur-md border-white/30" align="end">
                <DropdownMenuItem className="flex items-center gap-3 p-4 focus:bg-blue-50">
                  <User className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-blue-50 transition-colors"
                >
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-gray-700">View Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={signOut}
                  className="flex items-center gap-3 p-3 cursor-pointer text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm sm:text-base font-medium mb-6 sm:mb-8 shadow-lg">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            Next-Generation Video Conferencing
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              AI-Powered Smart
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
              Meeting Experience
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 mb-8 sm:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
            Transform your meetings with intelligent video conferencing, automatic attendance tracking,
            <br className="hidden sm:block" /> 
            smart participant management, and seamless AI-powered collaboration.
          </p>
        </div>

        {/* Main Actions */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-16 sm:mb-24">
          {/* Create Meeting Card */}
          <Card className="group bg-white/70 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:bg-white/80">
            <CardHeader className="text-center pb-6 p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl group-hover:shadow-blue-500/25 transition-all duration-300 group-hover:scale-110">
                <Users className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Create Smart Meeting
              </CardTitle>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Launch an AI-powered meeting room with intelligent attendance tracking and smart insights
              </p>
            </CardHeader>
            <CardContent className="p-6 sm:p-8">
              <CreateMeetingDialog />
            </CardContent>
          </Card>

          {/* Join Meeting Card */}
          <Card className="group bg-white/70 backdrop-blur-xl border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-2 hover:bg-white/80">
            <CardHeader className="text-center pb-6 p-6 sm:p-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-3xl flex items-center justify-center mb-4 sm:mb-6 shadow-xl group-hover:shadow-green-500/25 transition-all duration-300 group-hover:scale-110">
                <Video className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                Join Meeting
              </CardTitle>
              <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                Enter a meeting ID to connect to an existing smart meeting room instantly
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-6 sm:p-8">
              <div className="space-y-3">
                <Label htmlFor="meetingId" className="text-base font-semibold text-gray-700">
                  Meeting ID
                </Label>
                <Input
                  id="meetingId"
                  value={meetingId}
                  onChange={(e) => setMeetingId(e.target.value.toUpperCase())}
                  placeholder="Enter meeting ID (e.g., ABC123)"
                  className="h-12 sm:h-14 text-base border-2 border-gray-200 focus:border-green-500 transition-all duration-200 rounded-xl"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinMeeting()}
                />
              </div>
              
              <Button 
                onClick={handleJoinMeeting}
                className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 transition-all duration-300 shadow-xl hover:shadow-green-500/25 rounded-xl transform hover:scale-105"
                disabled={!meetingId.trim()}
              >
                <ArrowRight className="mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                Join Meeting
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Feature highlights */}
        <div className="max-w-6xl mx-auto mb-16 sm:mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="group flex flex-col items-center gap-4 p-6 sm:p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/30 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Bot className="h-8 w-8 sm:h-9 sm:w-9 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">AI-Powered Intelligence</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Smart attendance tracking, participant insights, and intelligent meeting analytics
                </p>
              </div>
            </div>
            
            <div className="group flex flex-col items-center gap-4 p-6 sm:p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/30 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 sm:h-9 sm:w-9 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">Lightning Fast Setup</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  Join meetings instantly with seamless connectivity and zero configuration needed
                </p>
              </div>
            </div>
            
            <div className="group flex flex-col items-center gap-4 p-6 sm:p-8 bg-white/60 backdrop-blur-xl rounded-3xl border border-white/30 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 sm:h-9 sm:w-9 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg sm:text-xl mb-2">Enterprise Security</h3>
                <p className="text-base text-gray-600 leading-relaxed">
                  End-to-end encryption with enterprise-grade security and privacy protection
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Features */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
              Why Choose 
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> SmartMeet</span>?
            </h2>
            <p className="text-gray-600 text-lg sm:text-xl max-w-3xl mx-auto">
              Built for modern education and professional environments with cutting-edge AI technology
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="group text-center p-6 sm:p-8 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-base sm:text-lg">Smart Attendance</h3>
              <p className="text-sm sm:text-base text-gray-600">Automatic tracking with customizable duration requirements</p>
            </div>
            
            <div className="group text-center p-6 sm:p-8 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Video className="h-7 w-7 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-base sm:text-lg">HD Video Quality</h3>
              <p className="text-sm sm:text-base text-gray-600">Crystal clear video and audio for professional meetings</p>
            </div>
            
            <div className="group text-center p-6 sm:p-8 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-base sm:text-lg">AI Insights</h3>
              <p className="text-sm sm:text-base text-gray-600">Intelligent meeting analytics and participant insights</p>
            </div>
            
            <div className="group text-center p-6 sm:p-8 bg-white/60 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-3 text-base sm:text-lg">Global Access</h3>
              <p className="text-sm sm:text-base text-gray-600">Connect from anywhere with reliable global infrastructure</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-4xl mx-auto mt-16 sm:mt-20 p-8 sm:p-12 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl text-white text-center shadow-2xl">
          <h3 className="text-2xl sm:text-3xl font-bold mb-8">Trusted by Thousands</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Meetings Hosted</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
