import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Clock, FileText } from 'lucide-react';
import { useAccessLogs } from '@/hooks/useMedicalRecords';
import { format, formatDistanceToNow } from 'date-fns';

interface Props {
  patientId?: string;
}

export default function AccessLogViewer({ patientId }: Props) {
  const { data: logs, isLoading } = useAccessLogs(patientId);

  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-blue-500/10 text-blue-500';
      case 'emergency': return 'bg-red-500/10 text-red-500';
      case 'summary': return 'bg-green-500/10 text-green-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading access logs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Access Log
        </CardTitle>
        <CardDescription>See who has accessed your medical records</CardDescription>
      </CardHeader>
      <CardContent>
        {!logs?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No one has accessed your records yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-lg border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{log.accessor_name || 'Unknown'}</span>
                    <Badge variant="outline" className={getAccessTypeColor(log.access_type)}>
                      {log.access_type}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(log.accessed_at), { addSuffix: true })}
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {log.resource_type}
                  </div>
                  <span className="text-xs">
                    {format(new Date(log.accessed_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
