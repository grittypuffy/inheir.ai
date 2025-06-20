'use client';
import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHeaderCell,
  Avatar,
  Tooltip,
  Text,
  Menu,
  MenuTrigger,
  Button,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Textarea,
} from '@fluentui/react-components';
import {
  Checkmark24Regular,
  Dismiss24Regular,
  Mail24Regular,
  MoreHorizontal24Regular,
} from '@fluentui/react-icons';

import {
  useRouter
} from 'next/navigation';

type Report = {
  id: string;
  full_name?: string;
  address: string;
  email?: string;
  report: string;
  verdict: 'Pending' | 'Verified' | 'Not Verified';
  reason?: string;
  user_id: string;
};

type ReportApiResponse = {
  message: string;
  data: Report[];
};

type ActionType = 'verify' | 'unverify';

export default function ReportDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionType, setActionType] = useState<ActionType | null>(null);
  const [reason, setReason] = useState('');
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [expandedReasons, setExpandedReasons] = useState<Record<string, boolean>>({});

  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetch('/api/v1/report/all', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch reports');
        return res.json();
      })
      .then((json: ReportApiResponse) => setReports(json.data))
      .catch((err) => {
        router.push('/')
      });
  }, []);

  const openDialog = (report: Report, action: ActionType) => {
    setSelectedReport(report);
    setActionType(action);
    setReason(report.reason || '');
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedReport(null);
    setActionType(null);
    setReason('');
  };

  const submitReason = async () => {
    if (!selectedReport || !actionType) return;
    try {
      const res = await fetch(`/api/v1/report/${selectedReport.id}/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Failed to update report');
      }
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? {
                ...r,
                verdict: actionType === 'verify' ? 'Verified' : 'Not Verified',
                reason,
              }
            : r
        )
      );
      closeDialog();

      // Show success modal:
      setSuccessMessage(
        actionType === 'verify'
          ? 'Successfully marked as Verified.'
          : 'Successfully marked as Not Verified.'
      );
      setSuccessModalOpen(true);

      // Auto close success modal after 3 seconds
      setTimeout(() => setSuccessModalOpen(false), 3000);
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="flex justify-center p-6">
      <main className="w-full max-w-11/12">
        <h1 className="text-2xl font-semibold mb-4">Report Dashboard</h1>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="text-xl mb-4 font-semibold">
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Address</TableHeaderCell>
                <TableHeaderCell className="w-[28%]">Report</TableHeaderCell>
                <TableHeaderCell>Verdict</TableHeaderCell>
                <TableHeaderCell className="w-[28%]">Reason</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>{/* Actions */}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar
                        name={r.full_name || 'Anonymous'}
                        initials={r.full_name?.[0]?.toUpperCase() || '🕵️'}
                      />
                      <span className="text-sm text-gray-900">{r.full_name || 'Anonymous'}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <a
                      href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(r.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-sky-800 hover:underline"
                    >
                      {r.address}
                    </a>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm text-gray-800 whitespace-pre-line">
                      <div className={expandedReports[r.id] ? '' : 'line-clamp-2'}>
                        {r.report || '—'}
                      </div>
                      {r.report && r.report.length > 20 && (
                        <button
                          onClick={() =>
                            setExpandedReports((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                          }
                          className="text-blue-600 hover:underline text-xs mt-1"
                        >
                          {expandedReports[r.id] ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-semibold rounded-full
                      ${
                        r.verdict === 'Verified'
                          ? 'bg-green-100 text-green-800'
                          : r.verdict === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : r.verdict === 'Not Verified'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {r.verdict}
                    </span>
                  </TableCell>


                  <TableCell>
                    <div className="text-sm text-gray-800 whitespace-pre-line">
                      <div className={expandedReasons[r.id] ? '' : 'line-clamp-2'}>
                        {r.reason || '—'}
                      </div>
                      {r.reason && r.reason.length > 20 && (
                        <button
                          onClick={() =>
                            setExpandedReasons((prev) => ({ ...prev, [r.id]: !prev[r.id] }))
                          }
                          className="text-blue-600 hover:underline text-xs mt-1"
                        >
                          {expandedReasons[r.id] ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  </TableCell>


                  <TableCell>
                    {r.email ? (
                      <div className="flex items-center gap-2 text-sm text-gray-800">
                        <Tooltip content={r.email} relationship="label">
                          <a
                            href={`mailto:${r.email}`}
                            aria-label={`Email ${r.full_name || 'user'}`}
                            className="flex items-center"
                          >
                            <Mail24Regular />
                          </a>
                        </Tooltip>
                        <span>{r.email}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Menu>
                      <MenuTrigger disableButtonEnhancement>
                        <Button
                          appearance="transparent"
                          icon={<MoreHorizontal24Regular />}
                          aria-label="More actions"
                          className="ml-auto"
                          disabled={r.verdict !== 'Pending'}
                        />
                      </MenuTrigger>
                      {r.verdict === 'Pending' && (
                        <MenuPopover>
                          <MenuList>
                            <MenuItem
                              icon={<Checkmark24Regular className="text-green-600" />}
                              onClick={() => openDialog(r, 'verify')}
                            >
                              Verify
                            </MenuItem>
                            <MenuItem
                              icon={<Dismiss24Regular className="text-red-600" />}
                              onClick={() => openDialog(r, 'unverify')}
                            >
                              Unverify
                            </MenuItem>
                          </MenuList>
                        </MenuPopover>
                      )}
                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Reason dialog */}
        <Dialog open={dialogOpen} onOpenChange={(_, data) => setDialogOpen(data.open)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>
                {actionType === 'verify'
                  ? 'Verify Report'
                  : actionType === 'unverify'
                    ? 'Unverify Report'
                    : ''}
              </DialogTitle>
              <DialogContent>
                <Textarea
                  placeholder="Enter reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  resize="vertical"
                  aria-label="Reason for verification status"
                  autoFocus
                  required
                  className="w-full"
                />
              </DialogContent>
              <DialogActions>
                <Button appearance="secondary" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={submitReason}
                  disabled={reason.trim().length === 0}
                >
                  Submit
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        {/* Success Confirmation Dialog */}
        <Dialog open={successModalOpen} onOpenChange={(_, data) => setSuccessModalOpen(data.open)}>
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Success</DialogTitle>
              <DialogContent>
                <Text>{successMessage}</Text>
              </DialogContent>
              <DialogActions>
                <Button appearance="primary" onClick={() => setSuccessModalOpen(false)}>
                  Close
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </main>
    </div>
  );
}
