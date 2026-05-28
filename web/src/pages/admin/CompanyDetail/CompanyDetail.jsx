import React, { useEffect, useState } from 'react';
import { ArrowLeft, Building2, CalendarClock, Clock3, Loader2, Mail, ShieldCheck, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import adminService from '../../../services/adminService';

export default function CompanyDetail() {
  const { companyId } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDetail = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await adminService.getCompanyDetail(companyId);
        setDetail(data);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
          err?.response?.data?.title ||
          err?.message ||
          'Unable to load company detail.',
        );
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      loadDetail();
    }
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm font-medium">Loading company detail...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>;
  }

  if (!detail?.company) {
    return <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">Company not found.</div>;
  }

  const { company, pendingInvites = [], keyMembers = [], recentActivity = [] } = detail;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10"
        >
          <ArrowLeft className="size-4" />
          Back to admin
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-6 text-white shadow-lg shadow-slate-900/10">
        <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Company Detail</p>
            <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
            <p className="text-sm text-slate-200">
              {company.domain} · {company.timezone} · {company.language}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Subscription</p>
            <p className="mt-1 text-sm font-semibold text-white">{company.subscriptionPlanName || 'Unassigned'}</p>
            <p className="mt-1 text-xs text-slate-300">{company.subscriptionStatus || 'No active subscription'}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Members" value={company.memberCount} />
        <StatCard icon={ShieldCheck} label="HR" value={company.hrCount} />
        <StatCard icon={Building2} label="Mentors" value={company.mentorCount} />
        <StatCard icon={Clock3} label="Pending Invites" value={company.pendingInviteCount} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <SectionHeader title="Workspace Snapshot" />
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <dl className="grid gap-4 md:grid-cols-2">
              <DetailRow label="Domain" value={company.domain} />
              <DetailRow label="Status" value={formatCompanyLifecycle(company)} />
              <DetailRow label="Timezone" value={company.timezone} />
              <DetailRow label="Language" value={company.language} />
              <DetailRow label="Created" value={formatDate(company.createdAt)} />
              <DetailRow label="Subscription Ends" value={company.subscriptionEndsAt ? formatDate(company.subscriptionEndsAt) : 'n/a'} />
            </dl>
            {company.logoUrl ? (
              <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-slate-700">Logo</p>
                <img src={company.logoUrl} alt={company.name} className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Pending Invites" />
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {pendingInvites.length === 0 ? (
              <EmptyState label="No pending invites." />
            ) : (
              pendingInvites.map((invite) => (
                <div key={invite.id} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                  <p className="font-semibold text-slate-900">{invite.fullName || invite.email}</p>
                  <p className="mt-1 text-sm text-slate-500">{invite.email}</p>
                  <p className="mt-1 text-xs text-slate-400">{invite.rolesCsv} · expires {formatDate(invite.expiresAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <SectionHeader title="Key Members" />
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {keyMembers.length === 0 ? (
              <EmptyState label="No members found." />
            ) : (
              keyMembers.map((member) => (
                <div key={member.userId} className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0">
                  <div>
                    <p className="font-semibold text-slate-900">{member.fullName}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Mail className="size-3.5" />
                      <span>{member.email}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">{member.role}</p>
                    <p className="mt-1 text-xs text-slate-400">{member.lastLoginAt ? `Last login ${formatDateTime(member.lastLoginAt)}` : 'No login yet'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Recent Activity" />
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {recentActivity.length === 0 ? (
              <EmptyState label="No recent activity." />
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                  <p className="font-semibold text-slate-900">{item.action} {item.entityType}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.userName || 'System'} · {formatDateTime(item.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title }) {
  return <h2 className="text-lg font-bold text-slate-900">{title}</h2>;
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md">
      <div className="w-fit rounded-xl border border-primary/15 bg-primary/10 p-3 text-primary">
        <Icon className="size-5" />
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    </article>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl bg-primary/5 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function EmptyState({ label }) {
  return <div className="px-5 py-8 text-sm text-slate-500">{label}</div>;
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCompanyLifecycle(company) {
  if (company?.deletedAt) {
    return 'Deleted';
  }

  if (company?.isActive) {
    return 'Active';
  }

  const hasMembers = (company?.memberCount || 0) > 0;
  const hasPendingInvites = (company?.pendingInviteCount || 0) > 0;
  return !hasMembers && hasPendingInvites ? 'Pending onboarding' : 'Inactive';
}
