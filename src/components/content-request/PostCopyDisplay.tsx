"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Edit3, Send, MessageSquareText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PostCopyDisplayProps {
  copyText: string | null;
  topic?: string;
}

export function PostCopyDisplay({ copyText, topic }: PostCopyDisplayProps) {
  const { toast } = useToast();

  const handleCopyToClipboard = () => {
    if (copyText) {
      navigator.clipboard.writeText(copyText)
        .then(() => {
          toast({ title: "Copied to clipboard!" });
        })
        .catch(err => {
          toast({ title: "Failed to copy", description: err.message, variant: "destructive" });
        });
    }
  };

  if (!copyText) {
    return (
      <Card>
         <CardHeader>
          <CardTitle className="flex items-center"><MessageSquareText className="mr-2 h-5 w-5 text-primary" />Generated Post Copy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No post copy available. Generate copy for a selected topic.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center"><MessageSquareText className="mr-2 h-5 w-5 text-primary" />Generated Post Copy</CardTitle>
        {topic && <CardDescription>For topic: <span className="font-semibold text-foreground">{topic}</span></CardDescription>}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 w-full rounded-md border p-4 bg-muted/20">
          <pre className="whitespace-pre-wrap text-sm font-sans">{copyText}</pre>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" size="sm" onClick={handleCopyToClipboard} disabled={!copyText}>
          <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
        </Button>
        {/* Placeholder for future actions */}
        <Button variant="outline" size="sm" disabled>
          <Edit3 className="mr-2 h-4 w-4" /> Edit in ClickUp (soon)
        </Button>
         <Button size="sm" disabled>
          <Send className="mr-2 h-4 w-4" /> Send for Image Gen (soon)
        </Button>
      </CardFooter>
    </Card>
  );
}
