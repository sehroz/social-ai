import Link from 'next/link';
import type { ContentRequest } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CalendarDays, Target, Users } from 'lucide-react';

interface ContentRequestCardProps {
  request: ContentRequest;
}

export function ContentRequestCard({ request }: ContentRequestCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg mb-1">{request.campaignName}</CardTitle>
          <Badge variant={request.status === 'Pending' ? 'destructive' : request.status === 'Scheduled' ? 'default' : 'secondary'} className="capitalize">
            {request.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center text-xs text-muted-foreground">
          <Users className="mr-1 h-3 w-3" /> Client ID: {request.clientId}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {request.initialTopicIdea && (
          <p className="text-sm mb-2 line-clamp-2">
            <strong className="font-medium">Topic Idea:</strong> {request.initialTopicIdea}
          </p>
        )}
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-4 w-4" />
            Due: {new Date(request.dueDate).toLocaleDateString()}
          </div>
          <div className="flex items-center">
            <Target className="mr-2 h-4 w-4" />
            Platform: {request.platform}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm" className="w-full">
          <Link href={`/requests/${request.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
