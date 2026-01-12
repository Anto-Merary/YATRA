import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/use-toast';

// Type definition for registration/ticket record
export interface Ticket {
  id: string;
  name: string;
  email: string;
  phone?: string;
  college: string;
  ticket_type?: string;
  price?: string;
  is_rit_student?: boolean;
  created_at: string;
  ticket_email_sent: boolean;
}

// Filter options
type TicketStatusFilter = 'not_sent' | 'sent' | 'all';

// Sort order options
type SortOrder = 'asc' | 'desc';

interface AdminDashboardProps {
  adminEmail?: string;
}

export function AdminDashboard({ adminEmail }: AdminDashboardProps) {
  const { toast } = useToast();
  // Data state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and sort state
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>('not_sent');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc'); // Newest first by default

  // Batch control state
  const [batchCount, setBatchCount] = useState<number>(100);
  const [previewedTickets, setPreviewedTickets] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Summary statistics
  const totalTickets = tickets.length;
  const sentTickets = tickets.filter(t => t.ticket_email_sent).length;
  const notSentTickets = tickets.filter(t => !t.ticket_email_sent).length;

  // Fetch tickets from Supabase
  // Add a small delay to ensure auth is fully established before fetching
  useEffect(() => {
    // Small delay to avoid race condition with admin verification
    const timer = setTimeout(() => {
      fetchTickets();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Apply filters and sorting when data or filters change
  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickets, statusFilter, sortOrder]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all registrations from Supabase
      // Note: We fetch all and filter client-side for simplicity
      // For large datasets, consider server-side filtering
      const { data, error: fetchError } = await supabase
        .from('registrations')
        .select('id, name, email, phone, college, ticket_type, price, is_rit_student, created_at, ticket_email_sent')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Fetched registrations:', data?.length || 0, 'records');
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...tickets];

    // Apply status filter
    if (statusFilter === 'sent') {
      filtered = filtered.filter(t => t.ticket_email_sent === true);
    } else if (statusFilter === 'not_sent') {
      filtered = filtered.filter(t => t.ticket_email_sent === false);
    }
    // 'all' - no filtering needed

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });

    setFilteredTickets(filtered);
    // Clear preview when filters change
    setPreviewedTickets(new Set());
    setSuccessMessage(null);
  };

  // Preview recipients - UI only, no backend updates
  const handlePreviewRecipients = () => {
    if (batchCount <= 0) {
      setError('Please enter a valid number greater than 0');
      return;
    }

    // Select first N tickets from filtered dataset
    // ONLY select tickets that haven't been sent yet, regardless of current filter
    const selected = filteredTickets
      .filter(t => !t.ticket_email_sent)
      .slice(0, batchCount)
      .map(t => t.id);

    if (selected.length === 0) {
      setError('No eligible (un-sent) tickets found in current view.');
      return;
    }

    setPreviewedTickets(new Set(selected));
    setError(null);
    setSuccessMessage(null);
  };

  const handleSendTickets = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    console.log("Send Tickets clicked");

    if (previewedTickets.size === 0) {
      toast({
        title: "Error",
        description: "No tickets selected for sending.",
        variant: "destructive",
      });
      return;
    }
    
    if (!adminEmail) {
      setError('Admin email context missing. Please refresh.');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const registrationIds = Array.from(previewedTickets);
      
      console.log("Invoking edge function with IDs:", registrationIds);
      
      const { data, error: invokeError } = await supabase.functions.invoke('issue_tickets_batch', {
        body: {
          registration_ids: registrationIds,
          issued_by_admin_email: adminEmail
        }
      });

      console.log("Edge function response:", data);

      if (invokeError) throw invokeError;

      const result = data;
      let msg = `Ticket issuance started. Issued: ${result.issued_count}`;
      if (result.skipped_count > 0) msg += `, Skipped: ${result.skipped_count}`;
      if (result.failed && result.failed.length > 0) msg += `, Failed: ${result.failed.length}`;
      
      setSuccessMessage(msg);
      toast({
        title: "Ticket issuance started",
        description: msg,
      });
      
      // Refresh data to reflect status changes
      await fetchTickets(); 
      setPreviewedTickets(new Set());

    } catch (err) {
      console.error('Failed to issue tickets:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to invoke ticket issuance service';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Registrations</h3>
          <p className="text-3xl font-bold text-white">{totalTickets}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Tickets Sent</h3>
          <p className="text-3xl font-bold text-green-500">{sentTickets}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Tickets Not Sent</h3>
          <p className="text-3xl font-bold text-yellow-500">{notSentTickets}</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-300 mb-2">
              Ticket Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatusFilter)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending}
            >
              <option value="not_sent">Not Sent (default)</option>
              <option value="sent">Sent</option>
              <option value="all">All</option>
            </select>
          </div>
          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-300 mb-2">
              Sort Order
            </label>
            <select
              id="sort-order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Batch Control Section */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Batch Controls</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="batch-count" className="block text-sm font-medium text-gray-300 mb-2">
              Number of tickets to send
            </label>
            <input
              id="batch-count"
              type="number"
              min="1"
              value={batchCount}
              onChange={(e) => setBatchCount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSending}
            />
          </div>
          <button
            onClick={handlePreviewRecipients}
            disabled={isSending}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
          >
            Preview recipients
          </button>
          <button
            type="button"
            onClick={handleSendTickets}
            disabled={previewedTickets.size === 0 || isSending}
            className={`px-6 py-2 rounded font-medium transition-colors flex items-center gap-2
              ${previewedTickets.size > 0 && !isSending
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`
            }
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              'Send tickets'
            )}
          </button>
        </div>
        
        {/* Preview Summary Area */}
        {previewedTickets.size > 0 && (
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500 rounded">
            <h4 className="text-blue-300 font-semibold mb-2">
              Preview: {previewedTickets.size} recipient{previewedTickets.size !== 1 ? 's' : ''} selected
            </h4>
            <div className="max-h-40 overflow-y-auto pr-2 space-y-1">
              {filteredTickets
                .filter(t => previewedTickets.has(t.id))
                .map(t => (
                  <div key={t.id} className="text-sm text-gray-300 flex justify-between">
                    <span>{t.name} ({t.email})</span>
                    <span className="text-xs text-gray-500">{t.college}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}
        
        {/* Success Message */}
        {successMessage && (
          <div className="mt-4 p-4 bg-green-900/20 border border-green-500 rounded">
            <p className="text-green-400">{successMessage}</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && !loading && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={fetchTickets}
            className="mt-2 text-sm text-red-300 hover:underline"
          >
            Try reloading data
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Registered At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ticket Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No tickets found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const isPreviewed = previewedTickets.has(ticket.id);
                  return (
                    <tr
                      key={ticket.id}
                      className={`transition-colors ${
                        isPreviewed 
                          ? 'bg-blue-900/20 border-l-4 border-l-blue-500' 
                          : 'hover:bg-gray-800/50'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {ticket.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {ticket.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {ticket.college}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                            ticket.ticket_email_sent
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-yellow-900/30 text-yellow-400'
                          }`}
                        >
                          {ticket.ticket_email_sent ? 'Sent' : 'Not Sent'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredTickets.length > 0 && (
          <div className="px-6 py-3 bg-gray-800 border-t border-gray-700 text-sm text-gray-400">
            Showing {filteredTickets.length} of {totalTickets} ticket{totalTickets !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
