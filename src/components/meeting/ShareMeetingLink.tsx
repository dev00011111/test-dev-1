
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Share2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ShareMeetingLinkProps {
  meetingId: string;
}

const ShareMeetingLink = ({ meetingId }: ShareMeetingLinkProps) => {
  const { toast } = useToast();
  const [linkCopied, setLinkCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  
  // Direct meeting link that automatically joins
  const meetingUrl = `${window.location.origin}/meeting/${meetingId}`;

  const copyToClipboard = async (text: string, type: 'link' | 'id') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'link') {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
        toast({
          title: "Link copied!",
          description: "Meeting link has been copied to clipboard",
        });
      } else {
        setIdCopied(true);
        setTimeout(() => setIdCopied(false), 2000);
        toast({
          title: "Meeting ID copied!",
          description: "Meeting ID has been copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Please copy the text manually",
        variant: "destructive",
      });
    }
  };

  const shareLink = async () => {
    // Enhanced native sharing with better options
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join SmartMeet Video Conference',
          text: `Join our video meeting: ${meetingId}`,
          url: meetingUrl,
        });
        console.log('Successfully shared via native share API');
        toast({
          title: "Shared successfully!",
          description: "Meeting link has been shared",
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.log('Native share failed:', error);
          // Fallback to copy if sharing fails (but not if user cancels)
          copyToClipboard(meetingUrl, 'link');
        }
      }
    } else {
      console.log('Native share not supported, copying link');
      // Fallback to copy if sharing is not supported
      copyToClipboard(meetingUrl, 'link');
    }
  };

  return (
    <Card className="w-full max-w-md border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Share2 className="h-5 w-5 text-blue-600" />
          Share Meeting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="meetingUrl" className="text-sm font-medium">Direct Meeting Link</Label>
          <div className="flex gap-2">
            <Input
              id="meetingUrl"
              value={meetingUrl}
              readOnly
              className="font-mono text-xs sm:text-sm bg-gray-50 border-gray-200"
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => copyToClipboard(meetingUrl, 'link')}
              className="shrink-0"
            >
              {linkCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-500">Click this link to join directly - no manual ID entry needed!</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="meetingId" className="text-sm font-medium">Meeting ID (Alternative)</Label>
          <div className="flex gap-2">
            <Input
              id="meetingId"
              value={meetingId}
              readOnly
              className="font-mono text-sm bg-gray-50 border-gray-200"
            />
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => copyToClipboard(meetingId, 'id')}
              className="shrink-0"
            >
              {idCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={shareLink} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Meeting Link
        </Button>
        
        <div className="text-xs text-gray-500 text-center">
          {navigator.share ? 
            "Share via WhatsApp, Instagram, Messages, Email, or copy link" : 
            "Copy and share this direct link - recipients can join with one click!"
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default ShareMeetingLink;
