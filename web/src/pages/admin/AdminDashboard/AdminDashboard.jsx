import React from 'react';
import {
  Building2,
  ShieldCheck,
  UserCog,
  Users,
  UserPlus,
  Activity,
  Clock3,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  BadgeCheck,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';

const stats = [
  {
    label: 'Active Companies',
    value: '18',
    change: '+3 this month',
    icon: Building2,
    tone: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  {
    label: 'Pending Invites',
    value: '42',
    change: '11 expire this week',
    icon: UserPlus,
    tone: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  {
    label: 'Active Sessions',
    value: '126',
    change: '94% session health',
    icon: Activity,
    tone: 'text-violet-600 bg-violet-50 border-violet-100',
  },
  {
    label: 'Privileged Accounts',
    value: '27',
    change: '4 need review',
    icon: ShieldCheck,
    tone: 'text-amber-600 bg-amber-50 border-amber-100',
  },
];

const companies = [
  { name: 'InnerG Corporation', domain: 'innerg.com', members: 64, mentors: 11, invites: 7, status: 'Healthy' },
  { name: 'NovaTech', domain: 'novatech.vn', members: 38, mentors: 6, invites: 12, status: 'Growing' },
  { name: 'BrightOps', domain: 'brightops.io', members: 24, mentors: 4, invites: 5, status: 'Healthy' },
  { name: 'Atlas Retail', domain: 'atlasretail.com', members: 15, mentors: 2, invites: 18, status: 'Needs review' },
];

const auditItems = [
  {
    title: 'Company onboarding completed',
    meta: 'NovaTech workspace provisioned with HR owner assigned',
    time: '12 minutes ago',
    icon: BadgeCheck,
  },
  {
    title: 'Bulk invite batch processed',
    meta: '18 invitations issued across 3 departments',
    time: '45 minutes ago',
    icon: UserPlus,
  },
  {
    title: 'Refresh token anomaly resolved',
    meta: '2 stale sessions revoked after inactivity threshold',
    time: '2 hours ago',
    icon: KeyRound,
  },
  {
    title: 'Workspace access escalated',
    meta: 'Mentor role promoted for product enablement group',
    time: 'Today, 08:15',
    icon: UserCog,
  },
];

const roleBreakdown = [
  { role: 'Mentee', count: 96, width: '68%' },
  { role: 'Mentor', count: 28, width: '20%' },
  { role: 'HR', count: 16, width: '11%' },
  { role: 'SystemAdmin', count: 4, width: '3%' },
];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">System Administration</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Monitor tenant growth, authentication health, and privileged access from one operational surface.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{user?.email || 'systemadmin@innerg.com'}</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]">Environment</p>
            <p className="mt-1 text-sm font-semibold">Development</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className={`rounded-lg border p-3 ${stat.tone}`}>
                  <Icon className="size-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                  Live <ArrowUpRight className="size-3.5" />
                </span>
              </div>
              <div className="mt-5">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-500">{stat.change}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Company Overview</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tenant Snapshot</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="grid grid-cols-[2fr_1.4fr_0.9fr_0.9fr_0.9fr_1.1fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
              <span>Company</span>
              <span>Domain</span>
              <span>Members</span>
              <span>Mentors</span>
              <span>Invites</span>
              <span>Status</span>
            </div>

            {companies.map((company) => (
              <div
                key={company.name}
                className="grid grid-cols-[2fr_1.4fr_0.9fr_0.9fr_0.9fr_1.1fr] gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-slate-900">{company.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Invite-based workspace</p>
                </div>
                <div className="text-slate-600">{company.domain}</div>
                <div className="font-semibold text-slate-800">{company.members}</div>
                <div className="font-semibold text-slate-800">{company.mentors}</div>
                <div className="font-semibold text-slate-800">{company.invites}</div>
                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      company.status === 'Needs review'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {company.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Authentication Health</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Security</span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <HealthRow
                icon={CheckCircle2}
                title="Refresh token rotation"
                subtitle="All active sessions using rotating refresh tokens"
                value="Healthy"
                tone="text-emerald-700 bg-emerald-50"
              />
              <HealthRow
                icon={Clock3}
                title="Pending invites aging"
                subtitle="11 invites approaching expiry within 7 days"
                value="Watch"
                tone="text-amber-700 bg-amber-50"
              />
              <HealthRow
                icon={ShieldCheck}
                title="Tenant isolation"
                subtitle="Company-scoped claims enforced on authenticated flows"
                value="Enforced"
                tone="text-blue-700 bg-blue-50"
              />
              <HealthRow
                icon={AlertTriangle}
                title="Privileged account review"
                subtitle="4 accounts have not rotated credentials this cycle"
                value="Action"
                tone="text-rose-700 bg-rose-50"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent Admin Activity</h2>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Audit Feed</span>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            {auditItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={`${item.title}-${item.time}`} className="flex gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600">
                    <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <span className="text-xs font-medium text-slate-400">{item.time}</span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{item.meta}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Role Distribution</h2>
              <Users className="size-4.5 text-slate-400" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-4">
                {roleBreakdown.map((item) => (
                  <div key={item.role}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">{item.role}</span>
                      <span className="font-semibold text-slate-900">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-slate-900" style={{ width: item.width }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Next Actions</h2>
              <ShieldCheck className="size-4.5 text-slate-400" />
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="rounded-lg bg-slate-50 px-4 py-3">
                  Review expiring invite batches for `Atlas Retail`
                </li>
                <li className="rounded-lg bg-slate-50 px-4 py-3">
                  Confirm HR owner assignment for newly provisioned tenants
                </li>
                <li className="rounded-lg bg-slate-50 px-4 py-3">
                  Rotate credentials for inactive privileged accounts
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HealthRow({ icon: Icon, title, subtitle, value, tone }) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-slate-200 p-4">
      <div className="rounded-lg bg-slate-50 p-3 text-slate-600">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold text-slate-900">{title}</p>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{value}</span>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}
