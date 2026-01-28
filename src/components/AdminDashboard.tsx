import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './ui/use-toast';
import Papa from 'papaparse';

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
  payment_status?: string;
}

export interface EventRegistrationRow {
  id: string;
  event_id: string;
  event_display_name?: string | null;
  event_variant?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  college?: string | null;
  amount_inr: number;
  unit: string;
  payment_status: string;
  payment_confirmed_at?: string | null;
  payment_reference?: string | null;
  created_at: string;
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
  const [eventRegs, setEventRegs] = useState<EventRegistrationRow[]>([]);
  const [eventRegsLoading, setEventRegsLoading] = useState(false);
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

  // Paid sheet import state
  const [selectedCsv, setSelectedCsv] = useState<File | null>(null);
  const [importRows, setImportRows] = useState<Array<{ name: string; email: string; phone: string; college: string; utr: string }>>([]);
  const [importParseError, setImportParseError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Retry state
  const [lastFailedRegistrationIds, setLastFailedRegistrationIds] = useState<string[]>([]);

  // Summary statistics
  const totalTickets = tickets.length;
  const sentTickets = tickets.filter(t => t.ticket_email_sent).length;
  const notSentTickets = tickets.filter(t => !t.ticket_email_sent).length;
  const paidTickets = tickets.filter(t => t.payment_status === 'paid').length;
  const paidNotSentTickets = tickets.filter(t => t.payment_status === 'paid' && !t.ticket_email_sent).length;
  const unpaidTickets = tickets.filter(t => (t.payment_status ?? 'unpaid') !== 'paid').length;
  const totalEventRegs = eventRegs.length;
  const paidEventRegs = eventRegs.filter(r => r.payment_status === 'paid' || r.payment_status === 'free').length;
  const unpaidEventRegs = eventRegs.filter(r => r.payment_status === 'unpaid').length;

  // Fetch tickets from Supabase
  // Add a small delay to ensure auth is fully established before fetching
  useEffect(() => {
    // Small delay to avoid race condition with admin verification
    const timer = setTimeout(() => {
      fetchTickets();
      fetchEventRegistrations();
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
        .select('id, name, email, phone, college, ticket_type, price, is_rit_student, created_at, ticket_email_sent, payment_status')
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

  const fetchEventRegistrations = async () => {
    try {
      setEventRegsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('event_registrations')
        .select('id,event_id,event_display_name,event_variant,name,email,phone,college,amount_inr,unit,payment_status,payment_confirmed_at,payment_reference,created_at')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase event_registrations fetch error:', fetchError);
        return;
      }

      setEventRegs((data as any[]) || []);
    } finally {
      setEventRegsLoading(false);
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

  const pickField = (row: Record<string, unknown>, candidates: string[]) => {
    const lowerMap = new Map<string, string>();
    for (const k of Object.keys(row)) lowerMap.set(k.toLowerCase().trim(), k);
    for (const c of candidates) {
      const realKey = lowerMap.get(c.toLowerCase().trim());
      if (realKey) {
        const v = row[realKey];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
      }
    }
    return '';
  };

  const mapParsedRow = (row: Record<string, unknown>) => {
    const name = pickField(row, ['name', 'full name', 'student name']);
    const email = pickField(row, ['email', 'email id', 'mail', 'e-mail']);
    const phone = pickField(row, ['phone', 'mobile', 'mobile number', 'contact', 'contact number']);
    const college = pickField(row, ['college', 'college name', 'institution', 'institution name']);
    const utr = pickField(row, ['utr', 'utr no', 'utr number', 'transaction id', 'txn id', 'reference', 'reference id']);
    return { name, email, phone, college, utr };
  };

  const handleCsvSelected = async (file: File | null) => {
    setSelectedCsv(file);
    setImportSummary(null);
    setImportParseError(null);
    setImportRows([]);

    if (!file) return;

    try {
      const text = await file.text();
      const parsed = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (parsed.errors && parsed.errors.length > 0) {
        setImportParseError(parsed.errors[0].message || 'Failed to parse CSV');
        return;
      }

      type MappedRow = { name: string; email: string; phone: string; college: string; utr: string };

      const mapped = (parsed.data ?? []).map(mapParsedRow);
      const cleaned: MappedRow[] = mapped
        .filter((r): r is MappedRow => Boolean(r.name || r.email || r.phone || r.college || r.utr))
        .map((r): MappedRow => ({
          name: r.name.trim(),
          email: r.email.trim().toLowerCase(),
          phone: r.phone.replace(/\D/g, ''),
          college: r.college.trim(),
          utr: r.utr.trim(),
        }));

      if (cleaned.length === 0) {
        setImportParseError('No data rows found in CSV');
        return;
      }

      setImportRows(cleaned);
    } catch (e) {
      setImportParseError(e instanceof Error ? e.message : 'Failed to read CSV file');
    }
  };

  const handleImportPaidSheet = async () => {
    if (!adminEmail) {
      setError('Admin email context missing. Please refresh.');
      return;
    }
    if (!selectedCsv || importRows.length === 0) {
      setError('Please select a CSV and ensure it has rows to import.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportSummary(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('import_paid_sheet', {
        body: {
          rows: importRows,
          source_filename: selectedCsv.name,
          notes: `Imported from AdminDashboard by ${adminEmail}`,
        }
      });

      if (invokeError) throw invokeError;

      setImportSummary(data);
      toast({
        title: 'Paid sheet imported',
        description: `Batch ${data?.batch_id || ''} — imported: ${data?.created_or_updated || 0}, duplicates: ${data?.already_imported_utr || 0}`,
      });

      await fetchTickets();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to import paid sheet';
      setError(msg);
      toast({ title: 'Import failed', description: msg, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleRetryLastFailed = async () => {
    if (lastFailedRegistrationIds.length === 0) {
      toast({
        title: 'Nothing to retry',
        description: 'No failed registrations captured from the last send attempt.',
      });
      return;
    }

    setPreviewedTickets(new Set(lastFailedRegistrationIds));
    toast({
      title: 'Retry loaded',
      description: `Loaded ${lastFailedRegistrationIds.length} failed registrations into preview. Click “Send tickets” to retry.`,
    });
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
      .filter(t => t.payment_status === 'paid' && !t.ticket_email_sent)
      .slice(0, batchCount)
      .map(t => t.id);

    if (selected.length === 0) {
      setError('No eligible tickets found (must be paid + not sent) in current view.');
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
          registration_ids: registrationIds
        }
      });

      console.log("Edge function response:", data);

      if (invokeError) throw invokeError;

      const result = data;
      let msg = `Ticket issuance started. Issued: ${result.issued_count}`;
      if (result.skipped_count > 0) msg += `, Skipped: ${result.skipped_count}`;
      if (result.failed && result.failed.length > 0) msg += `, Failed: ${result.failed.length}`;
      
      setSuccessMessage(msg);
      setLastFailedRegistrationIds(Array.isArray(result.failed) ? result.failed.map((f: any) => f.registration_id).filter(Boolean) : []);
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Total Registrations</h3>
          <p className="text-3xl font-bold text-white">{totalTickets}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Paid</h3>
          <p className="text-3xl font-bold text-blue-400">{paidTickets}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Paid (Not Sent)</h3>
          <p className="text-3xl font-bold text-yellow-500">{paidNotSentTickets}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Tickets Sent</h3>
          <p className="text-3xl font-bold text-green-500">{sentTickets}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Unpaid</h3>
          <p className="text-3xl font-bold text-gray-300">{unpaidTickets}</p>
        </div>
      </div>

      {/* Event Registrations Summary */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-white">Event Registrations</h3>
            <p className="text-sm text-gray-400">
              Total: {totalEventRegs} • Paid/Free: {paidEventRegs} • Unpaid: {unpaidEventRegs}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchEventRegistrations}
            disabled={eventRegsLoading || isSending || isImporting}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800/60 disabled:text-gray-500 rounded text-white text-sm transition-colors"
          >
            {eventRegsLoading ? 'Refreshing…' : 'Refresh events'}
          </button>
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

      {/* Paid Sheet Import */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Paid Sheet Import (Bank/College CSV)</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              CSV file (must include Name, Email, Phone, College, UTR)
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={isImporting || isSending}
              onChange={(e) => handleCsvSelected(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-800 file:text-white hover:file:bg-gray-700"
            />
            <div className="mt-2 text-xs text-gray-400">
              {selectedCsv ? (
                <>
                  Selected: <span className="text-gray-200">{selectedCsv.name}</span> — Parsed rows:{' '}
                  <span className="text-gray-200">{importRows.length}</span>
                </>
              ) : (
                <>No CSV selected.</>
              )}
            </div>
            {importParseError && (
              <div className="mt-2 text-sm text-red-400">
                CSV parse error: {importParseError}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleImportPaidSheet}
            disabled={isImporting || isSending || !selectedCsv || importRows.length === 0}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
          >
            {isImporting ? 'Importing…' : 'Import paid sheet'}
          </button>
        </div>

        {importSummary && (
          <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500 rounded">
            <div className="text-purple-200 font-semibold mb-2">
              Import summary (batch {importSummary.batch_id})
            </div>
            <div className="text-sm text-gray-200 space-y-1">
              <div>Rows: {importSummary.total_rows}</div>
              <div>Created/Updated: {importSummary.created_or_updated}</div>
              <div>Already imported (UTR): {importSummary.already_imported_utr}</div>
              <div>Duplicate UTR in file: {importSummary.duplicate_utr_in_file}</div>
              <div>Invalid rows: {importSummary.invalid_rows}</div>
            </div>
            {Array.isArray(importSummary.errors) && importSummary.errors.length > 0 && (
              <div className="mt-3 text-sm text-red-200">
                <div className="font-semibold mb-1">First errors:</div>
                <ul className="list-disc ml-5 space-y-1">
                  {importSummary.errors.slice(0, 10).map((e: any) => (
                    <li key={`${e.row_number}-${e.reason}`}>
                      Row {e.row_number}: {e.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Batch Control Section */}
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Batch Controls</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="batch-count" className="block text-sm font-medium text-gray-300 mb-2">
              Number of tickets to send (paid + not sent)
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
            onClick={handleRetryLastFailed}
            disabled={isSending || lastFailedRegistrationIds.length === 0}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed rounded text-white font-medium transition-colors"
          >
            Retry last failed ({lastFailedRegistrationIds.length})
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
              {tickets
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
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Ticket Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
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
                            ticket.payment_status === 'paid'
                              ? 'bg-blue-900/30 text-blue-300'
                              : 'bg-gray-800 text-gray-300'
                          }`}
                        >
                          {ticket.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                        </span>
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

      {/* Event Registrations Table */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="px-6 py-3 bg-gray-800 border-b border-gray-700 text-sm text-gray-200">
          Event Registrations
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Registered At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {eventRegs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                    No event registrations yet.
                  </td>
                </tr>
              ) : (
                eventRegs.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-200">
                      <div className="font-medium text-white">{r.event_display_name || r.event_id}</div>
                      <div className="text-xs text-gray-400">{r.event_id}{r.event_variant ? ` • ${r.event_variant}` : ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {r.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {r.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                      ₹{r.amount_inr} <span className="text-xs text-gray-400">({r.unit})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                          r.payment_status === 'paid' || r.payment_status === 'free'
                            ? 'bg-blue-900/30 text-blue-300'
                            : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {r.payment_status === 'paid' ? 'Paid' : r.payment_status === 'free' ? 'Free' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {eventRegs.length > 0 && (
          <div className="px-6 py-3 bg-gray-800 border-t border-gray-700 text-sm text-gray-400">
            Showing {eventRegs.length} event registration{eventRegs.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
