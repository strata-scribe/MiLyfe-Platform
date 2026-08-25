'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, MessageCircle, UserPlus, Check, X, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Props {
  userId: string;
  connections: any[];
  pendingRequests: any[];
  recentMessages: any[];
}

export function ConnectView({ userId, connections, pendingRequests, recentMessages }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, neighborhood')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .neq('id', userId)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  }

  async function sendRequest(toUserId: string) {
    const supabase = createClient();
    const { error } = await supabase.from('connections').insert({
      requester_id: userId,
      addressee_id: toUserId,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Connection request sent!');
      setSearchResults(prev => prev.filter(p => p.id !== toUserId));
    }
  }

  async function respondToRequest(connectionId: string, accept: boolean) {
    const supabase = createClient();
    if (accept) {
      await supabase.from('connections').update({ status: 'accepted' }).eq('id', connectionId);
      toast.success('Connection accepted!');
    } else {
      await supabase.from('connections').delete().eq('id', connectionId);
      toast.info('Request declined');
    }
  }

  // Derive unique conversations from messages
  const conversationEntries: [string, any][] = [];
  const seen = new Set<string>();
  for (const msg of recentMessages) {
    const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!seen.has(otherId)) {
      seen.add(otherId);
      conversationEntries.push([otherId, msg]);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Connect</h1>
        <p className="page-subtitle">Your people, your conversations</p>
      </div>

      <Tabs defaultValue="connections">
        <TabsList className="w-full">
          <TabsTrigger value="connections" className="flex-1">
            Connections {connections.length > 0 && <Badge variant="secondary" className="ml-1">{connections.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex-1">
            Messages
          </TabsTrigger>
          <TabsTrigger value="find" className="flex-1">
            Find People
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections">
          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <Card className="mb-4 border-mly-200 dark:border-mly-800">
              <CardHeader>
                <CardTitle className="text-sm">
                  Pending Requests
                  <Badge variant="mly" className="ml-2">{pendingRequests.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {pendingRequests.map((req) => (
                    <li key={req.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={req.requester?.display_name || 'U'} src={req.requester?.avatar_url} size="sm" />
                        <div>
                          <p className="text-sm font-medium">{req.requester?.display_name}</p>
                          <p className="text-xs text-gray-500">@{req.requester?.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="default" onClick={() => respondToRequest(req.id, true)} aria-label="Accept">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => respondToRequest(req.id, false)} aria-label="Decline">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Connections list */}
          {connections.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No connections yet"
              description="Find people in your neighborhood and send a connection request."
            />
          ) : (
            <div className="space-y-2">
              {connections.map((conn) => {
                const other = conn.requester_id === userId ? conn.addressee : conn.requester;
                return (
                  <div key={conn.id} className="card flex items-center gap-3">
                    <Avatar name={other?.display_name || 'U'} src={other?.avatar_url} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-harbor-800 dark:text-white truncate">
                        {other?.display_name}
                      </p>
                      <p className="text-xs text-gray-500">@{other?.username}</p>
                    </div>
                    <Link href={`/connect/${other?.id}`}>
                      <Button size="sm" variant="ghost" aria-label={`Message ${other?.display_name}`}>
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </Link>
                    {other?.neighborhood && (
                      <Badge variant="secondary" className="text-xs">{other.neighborhood}</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="messages">
          {conversationEntries.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title="No messages yet"
              description="Connect with someone to start a conversation."
            />
          ) : (
            <div className="space-y-2">
              {conversationEntries.map(([otherId, msg]) => (
                <Link key={otherId} href={`/connect/${otherId}`} className="card flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-harbor-900 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-harbor-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                    {(msg.sender_id === userId ? 'You' : '?').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-harbor-800 dark:text-white">{msg.body}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!msg.read && msg.receiver_id === userId && (
                    <div className="h-2 w-2 rounded-full bg-teal-500" aria-label="Unread" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="find">
          <div className="space-y-4">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or username..."
                aria-label="Search for people"
              />
              <Button type="submit" disabled={searching}>
                <Search className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((person) => (
                  <div key={person.id} className="card flex items-center gap-3">
                    <Avatar name={person.display_name || 'U'} src={person.avatar_url} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{person.display_name}</p>
                      <p className="text-xs text-gray-500">@{person.username}</p>
                    </div>
                    <Button size="sm" onClick={() => sendRequest(person.id)}>
                      <UserPlus className="h-3 w-3 mr-1" aria-hidden="true" />
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !searching && (
              <p className="text-center text-sm text-gray-500 py-8">No people found</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
