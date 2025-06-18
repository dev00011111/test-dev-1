
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, User, Mail, Calendar, Shield, Edit3, Sparkles, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    navigate('/auth');
    return null;
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
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:bg-white/60 transition-all duration-200 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Profile Settings
              </h1>
            </div>
            
            <Button
              variant="outline"
              onClick={signOut}
              className="text-red-600 border-red-200 hover:bg-red-50 rounded-xl transition-all duration-200"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12 max-w-4xl">
        {/* Profile Card */}
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-2xl mb-8 rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-6 sm:pb-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32 ring-4 ring-white/50 shadow-xl">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-2xl sm:text-3xl">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                  <Crown className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <div className="space-y-2 text-center">
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {getUserDisplayName()}
                </CardTitle>
                <p className="text-base sm:text-lg text-gray-600 bg-white/50 px-4 py-2 rounded-full">
                  {user.email}
                </p>
              </div>
              
              <Button
                variant="outline"
                size="lg"
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 bg-white/80 hover:bg-white transition-all duration-200 rounded-xl border-2 border-blue-200 hover:border-blue-300"
              >
                <Edit3 className="h-4 w-4" />
                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 sm:p-8">
            {isEditing ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-base font-semibold text-gray-700">
                    Display Name
                  </Label>
                  <Input
                    id="name"
                    defaultValue={getUserDisplayName()}
                    className="h-12 sm:h-14 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-all duration-200"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="email" className="text-base font-semibold text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    value={user.email || ''}
                    disabled
                    className="h-12 sm:h-14 text-base bg-gray-50 border-2 border-gray-200 rounded-xl"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-base font-semibold"
                    onClick={() => setIsEditing(false)}
                  >
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="flex items-center gap-4 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-700 mb-1">Display Name</p>
                    <p className="text-base font-semibold text-blue-900">{getUserDisplayName()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 sm:p-6 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl border border-green-200">
                  <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-700 mb-1">Email Address</p>
                    <p className="text-base font-semibold text-green-900">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 sm:p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-purple-700 mb-1">Member Since</p>
                    <p className="text-base font-semibold text-purple-900">{formatDate(user.created_at)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 sm:p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-700 mb-1">Account Status</p>
                    <p className="text-base font-semibold text-emerald-900 flex items-center gap-2">
                      Verified
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Settings */}
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-4">
            <Button 
              variant="outline" 
              className="w-full justify-start h-14 text-base border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl transition-all duration-200"
              onClick={() => navigate('/change-password')}
            >
              <Shield className="h-5 w-5 mr-3 text-blue-600" />
              Change Password
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start h-14 text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl transition-all duration-200"
              onClick={signOut}
            >
              <ArrowLeft className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
