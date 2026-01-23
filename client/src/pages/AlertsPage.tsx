import { useNotifications } from '../providers/NotificationsProvider';
import type { Notification } from '../lib/types';
import { useState } from 'react';

const tabs = ['All', 'Unread', 'Matches', 'Messages'] as const;

function filterByTab(tab: (typeof tabs)[number], notifications: Notification[]) {
  switch (tab) {
    case 'Unread':
      return notifications.filter((n) => !n.read);
    case 'Matches':
      return notifications.filter((n) => n.type === 'MATCH_FOUND');
    case 'Messages':
      return notifications.filter((n) => n.type === 'MESSAGE');
    default:
      return notifications;
  }
}

export function AlertsPage() {
  const { notifications } = useNotifications();
  const [tab, setTab] = useState<(typeof tabs)[number]>('All');

  const filtered = filterByTab(tab, notifications);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-3 pb-20 md:pb-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900">Alerts</h1>
          <p className="text-xs text-slate-500">Matches, messages, and status updates.</p>
        </div>
        <div className="inline-flex rounded-full bg-white px-1 py-1 text-xs shadow-soft ring-1 ring-slate-200">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors ' +
                (tab === t ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')
              }
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
            No alerts in this tab yet.
          </div>
        )}
        {filtered.map((n) => (
          <div
            key={n._id}
            className="flex items-start gap-3 rounded-2xl bg-white px-3.5 py-3 text-xs shadow-soft ring-1 ring-slate-100"
          >
            <div
              className={
                'mt-0.5 h-6 w-6 shrink-0 rounded-full text-white flex items-center justify-center text-[10px] ' +
                (n.type === 'MATCH_FOUND'
                  ? 'bg-teal-500'
                  : n.type === 'MESSAGE'
                  ? 'bg-sky-500'
                  : 'bg-slate-400')
              }
            >
              {n.type === 'MATCH_FOUND' ? 'M' : n.type === 'MESSAGE' ? 'C' : '•'}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-slate-900">{n.title}</p>
                {!n.read && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                    New
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600">{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
