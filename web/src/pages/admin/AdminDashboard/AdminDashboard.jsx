import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BadgeDollarSign,
  BarChart3,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Cog,
  Copy,
  CreditCard,
  ExternalLink,
  Filter,
  FileClock,
  Globe2,
  Loader2,
  Mail,
  Plus,
  ShieldAlert,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import adminService from '../../../services/adminService';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'companies', label: 'Companies' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'audit', label: 'Audit' },
  { id: 'platform', label: 'Platform' },
];

const initialCompanyForm = {
  companyName: '',
  emailDomain: '',
  hrEmail: '',
  hrFullName: '',
  timezone: 'Asia/Ho_Chi_Minh',
  language: 'vi',
  allowExternalHrEmail: false,
};

const initialEditCompanyForm = {
  name: '',
  domain: '',
  logoUrl: '',
  timezone: 'Asia/Ho_Chi_Minh',
  language: 'vi',
};

function normalizeDomainInput(value) {
  const raw = (value || '').trim().toLowerCase();
  if (!raw) return '';

  try {
    if (raw.includes('://')) {
      const url = new URL(raw);
      return url.hostname.replace(/^www\./, '');
    }
  } catch {
  }

  const withoutAt = raw.replace(/^@+/, '');
  const emailIndex = withoutAt.lastIndexOf('@');
  const domainOnly = emailIndex >= 0 ? withoutAt.slice(emailIndex + 1) : withoutAt;
  return domainOnly.replace(/^www\./, '').replace(/\/+$/, '');
}

function emailBelongsToDomain(email, domain) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedDomain = normalizeDomainInput(domain);
  return Boolean(normalizedEmail && normalizedDomain && normalizedEmail.endsWith(`@${normalizedDomain}`));
}

export default function AdminDashboard() {
  const { user, createCompany } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [plans, setPlans] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [companyForm, setCompanyForm] = useState(initialCompanyForm);
  const [companySubmitting, setCompanySubmitting] = useState(false);
  const [lastHrInvite, setLastHrInvite] = useState(null);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [editCompanyId, setEditCompanyId] = useState('');
  const [editCompanyForm, setEditCompanyForm] = useState(initialEditCompanyForm);
  const [companyUpdating, setCompanyUpdating] = useState(false);
  const [subscriptionDrafts, setSubscriptionDrafts] = useState({});
  const [companySearch, setCompanySearch] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('all');

  const loadAdminData = async ({ silent = false } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const [overviewData, companiesData, planData, auditData] = await Promise.all([
        adminService.getOverview(),
        adminService.getCompanies(),
        adminService.getSubscriptionPlans(),
        adminService.getAuditLogs(180),
      ]);

      setOverview(overviewData);
      setCompanies(companiesData);
      setPlans(planData);
      setAuditLogs(auditData);
      setSubscriptionDrafts(buildSubscriptionDrafts(companiesData, planData));
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to load admin data.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const companyRows = useMemo(() => {
    const keyword = companySearch.trim().toLowerCase();

    return companies.filter((company) => {
      const lifecycle = getCompanyLifecycle(company);
      const matchesFilter = companyStatusFilter === 'all' || lifecycle === companyStatusFilter;
      const matchesKeyword =
        keyword.length === 0 ||
        company.name.toLowerCase().includes(keyword) ||
        company.domain.toLowerCase().includes(keyword);

      return matchesFilter && matchesKeyword;
    });
  }, [companies, companySearch, companyStatusFilter]);

  const stats = useMemo(() => {
    if (!overview) {
      return [];
    }

    return [
      {
        label: 'Companies',
        value: overview.totalCompanies,
        meta: `${overview.activeCompanies} active`,
        icon: Building2,
      },
      {
        label: 'Pending Invites',
        value: overview.pendingInvites,
        meta: `${overview.auditEventsLast7Days} audit events / 7d`,
        icon: Clock3,
      },
      {
        label: 'Active Sessions',
        value: overview.activeSessions,
        meta: `${overview.activeSubscriptions} active subscriptions`,
        icon: Activity,
      },
      {
        label: 'Privileged Accounts',
        value: overview.privilegedAccounts,
        meta: 'HR + System Admin',
        icon: ShieldCheck,
      },
    ];
  }, [overview]);

  const overviewAnalytics = useMemo(() => {
    const sourceCompanies = overview?.companies?.length ? overview.companies : companies;
    const totalCompanies = companies.length || overview?.totalCompanies || 0;
    const activeCompanies = companies.filter((company) => getCompanyLifecycle(company) === 'active').length || overview?.activeCompanies || 0;
    const deletedCompanies = companies.filter((company) => company.deletedAt).length;
    const pendingCompanies = companies.filter((company) => getCompanyLifecycle(company) === 'pending').length;
    const inactiveCompanies = Math.max(totalCompanies - activeCompanies - deletedCompanies - pendingCompanies, 0);
    const totalMembers = companies.reduce((sum, company) => sum + (company.memberCount || 0), 0);
    const totalMentors = companies.reduce((sum, company) => sum + (company.mentorCount || 0), 0);
    const totalPendingInvites = companies.reduce((sum, company) => sum + (company.pendingInviteCount || 0), 0);
    const avgMembersPerCompany = totalCompanies ? totalMembers / totalCompanies : 0;
    const mentorCoverage = totalMembers ? (totalMentors / totalMembers) * 100 : 0;
    const invitePressure = totalMembers ? (totalPendingInvites / totalMembers) * 100 : 0;

    const roleDistribution = (overview?.roleDistribution || []).map((item) => ({
      ...item,
      share: totalMembers ? (item.count / totalMembers) * 100 : 0,
    }));

    const topCompaniesByMembers = [...sourceCompanies]
      .sort((left, right) => (right.memberCount || 0) - (left.memberCount || 0))
      .slice(0, 5);

    const largestMemberCount = topCompaniesByMembers[0]?.memberCount || 1;

    const subscriptionBreakdown = companies.reduce((accumulator, company) => {
      const key = company.subscriptionStatus || 'Unassigned';
      accumulator[key] = (accumulator[key] || 0) + 1;
      return accumulator;
    }, {});

    const subscriptionHealth = Object.entries(subscriptionBreakdown)
      .map(([status, count]) => ({ status, count }))
      .sort((left, right) => right.count - left.count);

    const activityTrend = buildRecentDaySeries(auditLogs, 7);
    const previousActivityTrend = buildRecentDaySeries(auditLogs, 7, 7);
    const companyGrowthTrend = buildRecentMonthSeries(companies, 6);
    const hottestDomains = [...sourceCompanies]
      .filter((company) => company.domain)
      .sort((left, right) => (right.pendingInviteCount || 0) - (left.pendingInviteCount || 0))
      .slice(0, 4);
    const coverageMatrix = [...sourceCompanies]
      .sort((left, right) => (right.memberCount || 0) - (left.memberCount || 0))
      .slice(0, 5)
      .map((company) => ({
        id: company.id,
        label: company.name,
        metrics: [
          { key: 'members', label: 'Members', value: company.memberCount || 0 },
          { key: 'mentors', label: 'Mentors', value: company.mentorCount || 0 },
          { key: 'hr', label: 'HR', value: company.hrCount || 0 },
          { key: 'invites', label: 'Invites', value: company.pendingInviteCount || 0 },
          {
            key: 'billing',
            label: 'Billing',
            value: company.subscriptionStatus === 'Active' ? 4 : company.subscriptionStatus === 'Trial' ? 3 : company.subscriptionStatus ? 2 : 1,
          },
        ],
      }));

    return {
      totalCompanies,
      activeCompanies,
      inactiveCompanies,
      pendingCompanies,
      deletedCompanies,
      totalMembers,
      avgMembersPerCompany,
      mentorCoverage,
      invitePressure,
      roleDistribution,
      topCompaniesByMembers,
      largestMemberCount,
      subscriptionHealth,
      activityTrend,
      previousActivityTrend,
      companyGrowthTrend,
      hottestDomains,
      coverageMatrix,
    };
  }, [auditLogs, companies, overview]);

  const handleCompanyFormChange = (field, value) => {
    setCompanyForm((prev) => {
      const next = { ...prev, [field]: value };

      if (field === 'emailDomain') {
        next.emailDomain = normalizeDomainInput(value);
      }

      if (field === 'hrEmail' && !prev.emailDomain.trim()) {
        next.emailDomain = normalizeDomainInput(value);
      }

      return next;
    });
  };

  const handleEditCompanyFormChange = (field, value) => {
    setEditCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateCompany = async (event) => {
    event.preventDefault();
    setCompanySubmitting(true);
    setNotice('');
    setError('');
    setInviteLinkCopied(false);

    try {
      if (!companyForm.allowExternalHrEmail && !emailBelongsToDomain(companyForm.hrEmail, companyForm.emailDomain)) {
        setError(`HR email must use @${normalizeDomainInput(companyForm.emailDomain)}. Turn on "Allow external HR email" if this is a temporary onboarding address.`);
        return;
      }

      const response = await createCompany(companyForm);
      const hrInvite = response?.hrInvite || null;
      setLastHrInvite(hrInvite);
      setNotice(`Company created. HR invite is ready for ${hrInvite?.email || companyForm.hrEmail}.`);
      setCompanyForm(initialCompanyForm);
      await loadAdminData({ silent: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to create company.'));
    } finally {
      setCompanySubmitting(false);
    }
  };

  const handleCopyInviteLink = async () => {
    if (!lastHrInvite?.inviteLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(lastHrInvite.inviteLink);
      setInviteLinkCopied(true);
      window.setTimeout(() => setInviteLinkCopied(false), 1800);
    } catch {
      setError('Unable to copy invite link. Please select and copy it manually.');
    }
  };

  const handleStartEditCompany = (company) => {
    setEditCompanyId(company.id);
    setEditCompanyForm({
      name: company.name || '',
      domain: company.domain || '',
      logoUrl: company.logoUrl || '',
      timezone: company.timezone || 'Asia/Ho_Chi_Minh',
      language: company.language || 'vi',
    });
    setNotice('');
    setError('');
  };

  const handleCancelEditCompany = () => {
    setEditCompanyId('');
    setEditCompanyForm(initialEditCompanyForm);
  };

  const handleUpdateCompany = async (event) => {
    event.preventDefault();
    if (!editCompanyId) {
      return;
    }

    setCompanyUpdating(true);
    setNotice('');
    setError('');

    try {
      await adminService.updateCompany(editCompanyId, editCompanyForm);
      setNotice('Company updated.');
      setEditCompanyId('');
      setEditCompanyForm(initialEditCompanyForm);
      await loadAdminData({ silent: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to update company.'));
    } finally {
      setCompanyUpdating(false);
    }
  };

  const handleToggleCompanyStatus = async (company) => {
    setNotice('');
    setError('');

    try {
      await adminService.updateCompanyStatus(company.id, !company.isActive);
      setNotice(`${company.name} ${company.isActive ? 'deactivated' : 'activated'}.`);
      await loadAdminData({ silent: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to update company status.'));
    }
  };

  const handleDeleteCompany = async (company) => {
    if (window.confirm(`Delete company "${company.name}"? This will soft-delete the tenant and hide it from active operations.`) === false) {
      return;
    }

    setNotice('');
    setError('');

    try {
      await adminService.deleteCompany(company.id);
      setNotice(`${company.name} deleted.`);
      await loadAdminData({ silent: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to delete company.'));
    }
  };

  const handleSubscriptionDraftChange = (companyId, field, value) => {
    setSubscriptionDrafts((prev) => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        [field]: value,
      },
    }));
  };

  const handleAssignSubscription = async (companyId) => {
    const draft = subscriptionDrafts[companyId];
    if (!draft?.subscriptionPlanId) {
      setError('Select a subscription plan before applying it.');
      return;
    }

    setNotice('');
    setError('');

    try {
      await adminService.assignSubscription(companyId, {
        subscriptionPlanId: draft.subscriptionPlanId,
        status: draft.status,
        currentPeriodStart: draft.currentPeriodStart,
        currentPeriodEnd: draft.currentPeriodEnd,
        trialEndsAt: draft.trialEndsAt || null,
      });
      setNotice('Subscription updated.');
      await loadAdminData({ silent: true });
    } catch (err) {
      setError(extractErrorMessage(err, 'Unable to assign subscription.'));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="size-5 animate-spin" />
          <span className="text-sm font-medium">Loading admin workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-[#0F1F3D] via-[#12305A] to-[#0d2b50] px-6 py-6 text-white shadow-lg shadow-slate-900/10">
        <div className="absolute right-0 top-0 h-48 w-48 translate-x-10 -translate-y-10 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-40 w-40 -translate-x-10 translate-y-10 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">System Admin Module</p>
            <h1 className="text-3xl font-bold tracking-tight">Platform Control Center</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-200">
              Manage tenants, monitor subscriptions, and review platform activity across all workspaces.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Signed in</p>
              <p className="mt-1 text-sm font-semibold text-white">{user?.email || 'systemadmin@innerg.com'}</p>
            </div>
            <button
              type="button"
              onClick={() => loadAdminData({ silent: true })}
              className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary px-4 py-3 text-sm font-semibold text-deep-blue transition hover:brightness-105"
            >
              <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.id
                ? 'bg-primary text-deep-blue shadow-md shadow-primary/20'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-primary/30 hover:bg-primary/5 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-deep-blue">{notice}</div>
      ) : null}

      {activeTab === 'overview' ? (
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article key={stat.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-primary/20 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="rounded-xl border border-primary/15 bg-primary/10 p-3 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Live</span>
                  </div>
                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{stat.meta}</p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr_0.9fr]">
            <div className="space-y-4">
              <SectionHeader
                title="Company Growth"
                subtitle="New tenant creation trend across the last 6 months"
                icon={TrendingUp}
              />
              <ChartPanel
                title="Tenant Onboarding Trend"
                meta={`${overviewAnalytics.totalCompanies} total companies`}
                footer={`${overviewAnalytics.activeCompanies} active · ${overviewAnalytics.pendingCompanies} pending · ${overviewAnalytics.inactiveCompanies} inactive`}
              >
                <MiniBarChart
                  data={overviewAnalytics.companyGrowthTrend}
                  valueKey="count"
                  labelKey="label"
                  colorClassName="bg-primary"
                />
              </ChartPanel>
            </div>

            <div className="space-y-4">
              <SectionHeader
                title="Role Mix"
                subtitle="Distribution of workforce roles across the platform"
                icon={Users}
              />
              <ChartPanel
                title="Role Distribution"
                meta={`${overviewAnalytics.totalMembers} members across all tenants`}
                footer={`${formatPercent(overviewAnalytics.mentorCoverage)} mentor coverage`}
              >
                <StackedRoleBar items={overviewAnalytics.roleDistribution} />
                <div className="mt-5 space-y-3">
                  {overviewAnalytics.roleDistribution.map((item) => (
                    <RoleLegendRow key={item.role} item={item} />
                  ))}
                </div>
              </ChartPanel>
            </div>

            <div className="space-y-4">
              <SectionHeader
                title="Operational Health"
                subtitle="Membership, invite pressure, and tenant concentration"
                icon={ShieldAlert}
              />
              <div className="grid gap-4">
                <MetricPanel
                  icon={Users}
                  label="Average Team Size"
                  value={formatDecimal(overviewAnalytics.avgMembersPerCompany)}
                  note="Members per tenant"
                />
                <MetricPanel
                  icon={ShieldCheck}
                  label="Mentor Coverage"
                  value={formatPercent(overviewAnalytics.mentorCoverage)}
                  note="Mentors / members"
                />
                <MetricPanel
                  icon={Clock3}
                  label="Invite Pressure"
                  value={formatPercent(overviewAnalytics.invitePressure)}
                  note="Pending invites / members"
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div className="space-y-4">
              <SectionHeader
                title="Activity Trend"
                subtitle="Audit volume over the last 7 days"
                icon={Activity}
              />
              <ChartPanel
                title="Security and Tenant Operations"
                meta={`${auditLogs.length} recent audit events loaded`}
                footer={`${overview?.auditEventsLast7Days || 0} events in the latest 7-day window`}
              >
                <ActivityComboChart
                  data={overviewAnalytics.activityTrend}
                  compareData={overviewAnalytics.previousActivityTrend}
                  valueKey="count"
                  labelKey="label"
                />
              </ChartPanel>
            </div>

            <div className="space-y-4">
              <SectionHeader
                title="Subscription Health"
                subtitle="Status mix for tenant billing and entitlement"
                icon={BadgeDollarSign}
              />
              <ChartPanel
                title="Subscription Breakdown"
                meta={`${overview?.activeSubscriptions || 0} active subscriptions`}
                footer="Includes unassigned tenants"
              >
                <div className="space-y-3">
                  {overviewAnalytics.subscriptionHealth.map((item) => (
                    <StatusBarRow
                      key={item.status}
                      label={item.status}
                      count={item.count}
                      total={overviewAnalytics.totalCompanies}
                    />
                  ))}
                </div>
              </ChartPanel>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <SectionHeader
                title="Tenant Load Ranking"
                subtitle="Largest workspaces by current member count"
                icon={BarChart3}
              />
              <ChartPanel
                title="Top Companies by Members"
                meta={`${overviewAnalytics.topCompaniesByMembers.length} tenants shown`}
                footer="Includes member count, mentor count, and pending invites"
              >
                <div className="space-y-4">
                  {overviewAnalytics.topCompaniesByMembers.map((company, index) => (
                    <CompanyLoadRow
                      key={company.id}
                      company={company}
                      index={index}
                      largestMemberCount={overviewAnalytics.largestMemberCount}
                    />
                  ))}
                </div>
              </ChartPanel>
            </div>

            <div className="space-y-4">
              <SectionHeader
                title="Domain Hotspots"
                subtitle="Tenants with the highest pending invite load"
                icon={Globe2}
              />
              <ChartPanel
                title="Invite Backlog"
                meta={`${overview?.pendingInvites || 0} pending invites across the platform`}
                footer="Useful for spotting onboarding bottlenecks"
              >
                <div className="space-y-3">
                  {overviewAnalytics.hottestDomains.map((company) => (
                    <DomainHotspotRow key={company.id} company={company} />
                  ))}
                </div>
              </ChartPanel>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <SectionHeader
                title="Tenant Coverage Map"
                subtitle="Heatmap view of company size, support depth, invite load, and billing posture"
                icon={Globe2}
              />
              <ChartPanel
                title="Company Health Matrix"
                meta="Top tenants by current member count"
                footer="Darker cells indicate higher concentration"
              >
                <TenantCoverageHeatmap rows={overviewAnalytics.coverageMatrix} />
              </ChartPanel>
            </div>

            <div className="space-y-4">
              <SectionHeader
                title="Onboarding Queue"
                subtitle="Where invite volume is building faster than mentor support"
                icon={ShieldAlert}
              />
              <ChartPanel
                title="Invite Pressure Leaders"
                meta="Pending invites compared against current members and mentors"
                footer="Prioritize tenants with backlog and low mentor depth"
              >
                <div className="space-y-4">
                  {overviewAnalytics.hottestDomains.map((company) => (
                    <QueueInsightRow key={company.id} company={company} />
                  ))}
                </div>
              </ChartPanel>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-4">
              <SectionHeader
                title="Tenant Snapshot"
                subtitle="Newest workspaces and their current load"
                icon={Building2}
              />
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="grid grid-cols-[1.8fr_1fr_0.8fr_0.8fr_0.9fr_1fr] gap-4 border-b border-slate-200 bg-primary/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                  <span>Company</span>
                  <span>Domain</span>
                  <span>Members</span>
                  <span>Mentors</span>
                  <span>Invites</span>
                  <span>Subscription</span>
                </div>
                {overview?.companies?.map((company) => (
                  <div
                    key={company.id}
                    className="grid grid-cols-[1.8fr_1fr_0.8fr_0.8fr_0.9fr_1fr] gap-4 border-b border-slate-100 px-5 py-4 text-sm last:border-b-0"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{company.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatCompanyLifecycle(company)}</p>
                    </div>
                    <div className="text-slate-600">{company.domain}</div>
                    <div className="font-semibold text-slate-800">{company.memberCount}</div>
                    <div className="font-semibold text-slate-800">{company.mentorCount}</div>
                    <div className="font-semibold text-slate-800">{company.pendingInviteCount}</div>
                    <div className="text-slate-600">{company.subscriptionPlanName || 'Unassigned'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader
                title="Recent Platform Activity"
                subtitle="Latest tenant and security operations"
                icon={FileClock}
              />
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                {(overview?.recentActivity || []).length === 0 ? (
                  <EmptyState label="No audit events yet." />
                ) : (
                  overview.recentActivity.map((item) => (
                    <div key={item.id} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{formatAuditTitle(item)}</p>
                        <span className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.companyName || 'Global'} · {item.userName || 'System'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'companies' ? (
        <div className="space-y-8">
          <section className="grid gap-6 xl:grid-cols-[1.1fr_1.2fr]">
            <div className="space-y-4">
              <SectionHeader
                title="Create Company"
                subtitle="Provision a new tenant and issue the first HR invite"
                icon={Plus}
              />
              <form onSubmit={handleCreateCompany} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
                <Input label="Company Name" value={companyForm.companyName} onChange={(value) => handleCompanyFormChange('companyName', value)} />
                <Input label="Email Domain" value={companyForm.emailDomain} onChange={(value) => handleCompanyFormChange('emailDomain', value)} placeholder="company.com" />
                <Input label="HR Full Name" value={companyForm.hrFullName} onChange={(value) => handleCompanyFormChange('hrFullName', value)} />
                <Input label="HR Email" value={companyForm.hrEmail} onChange={(value) => handleCompanyFormChange('hrEmail', value)} placeholder="hr@company.com" />
                <Input label="Timezone" value={companyForm.timezone} onChange={(value) => handleCompanyFormChange('timezone', value)} />
                <Input label="Language" value={companyForm.language} onChange={(value) => handleCompanyFormChange('language', value)} />
                <label className="md:col-span-2 flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={companyForm.allowExternalHrEmail}
                    onChange={(event) => handleCompanyFormChange('allowExternalHrEmail', event.target.checked)}
                    className="mt-1 size-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Allow external HR email</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      Use this only when the first HR must receive the invite through a non-company email such as Gmail. Future employee invites still use the company domain rule.
                    </span>
                  </span>
                </label>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={companySubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-deep-blue transition hover:brightness-105 disabled:opacity-60"
                  >
                    {companySubmitting ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                    Create company
                  </button>
                </div>
              </form>

              {lastHrInvite ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="rounded-lg border border-primary/15 bg-white p-2 text-primary">
                          <Mail className="size-4" />
                        </div>
                        <p className="font-semibold text-slate-900">HR invite created</p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            lastHrInvite.emailSent
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {lastHrInvite.emailSent ? 'Email sent' : 'Manual link required'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {lastHrInvite.email} will become the first HR after accepting this invite.
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {lastHrInvite.emailDeliveryMessage}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-primary/10"
                      >
                        <Copy className="size-4" />
                        {inviteLinkCopied ? 'Copied' : 'Copy link'}
                      </button>
                      <a
                        href={lastHrInvite.inviteLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-deep-blue transition hover:brightness-105"
                      >
                        <ExternalLink className="size-4" />
                        Open invite
                      </a>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Accept invite link</p>
                    <p className="mt-1 break-all text-sm text-slate-700">{lastHrInvite.inviteLink}</p>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4">
                <SectionHeader
                  title="Edit Company"
                  subtitle={editCompanyId ? 'Update tenant profile, domain, and locale settings' : 'Select a company from the directory to edit'}
                  icon={UserCog}
                />
                <form onSubmit={handleUpdateCompany} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
                  <Input label="Company Name" value={editCompanyForm.name} onChange={(value) => handleEditCompanyFormChange('name', value)} />
                  <Input label="Email Domain" value={editCompanyForm.domain} onChange={(value) => handleEditCompanyFormChange('domain', value)} placeholder="company.com" />
                  <Input label="Timezone" value={editCompanyForm.timezone} onChange={(value) => handleEditCompanyFormChange('timezone', value)} />
                  <Input label="Language" value={editCompanyForm.language} onChange={(value) => handleEditCompanyFormChange('language', value)} />
                  <div className="md:col-span-2">
                    <Input label="Logo URL" value={editCompanyForm.logoUrl} onChange={(value) => handleEditCompanyFormChange('logoUrl', value)} placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={!editCompanyId || companyUpdating}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-deep-blue transition hover:brightness-105 disabled:opacity-60"
                    >
                      {companyUpdating ? <Loader2 className="size-4 animate-spin" /> : <UserCog className="size-4" />}
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEditCompany}
                      disabled={!editCompanyId || companyUpdating}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 hover:text-slate-900 disabled:opacity-60"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-4">
              <SectionHeader
                title="Company Directory"
                subtitle="Provision, search, activate, deactivate, and soft-delete tenants"
                icon={Users}
              />
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={companySearch}
                    onChange={(event) => setCompanySearch(event.target.value)}
                    placeholder="Search by company name or domain"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-slate-400" />
                  <select
                    value={companyStatusFilter}
                    onChange={(event) => setCompanyStatusFilter(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">All statuses</option>
                    <option value="pending">Pending onboarding</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="deleted">Deleted</option>
                  </select>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                {companyRows.length === 0 ? (
                  <EmptyState label="No companies match the current filters." />
                ) : null}
                {companyRows.map((company) => (
                  <div key={company.id} className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{company.name}</p>
                        <CompanyLifecycleBadge company={company} />
                        <Link
                          to={`/admin/companies/${company.id}`}
                          className="rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                        >
                          View detail
                        </Link>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {company.domain} · {company.memberCount} members · {company.hrCount} HR · {company.mentorCount} mentors
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Created {formatDate(company.createdAt)} · {company.timezone} · {company.language}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-slate-500">{company.subscriptionPlanName || 'No plan'}</span>
                      {company.deletedAt ? null : (
                        <button
                          type="button"
                          onClick={() => handleStartEditCompany(company)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary/30 hover:bg-primary/5 hover:text-slate-900"
                        >
                          Edit
                        </button>
                      )}
                      {company.deletedAt ? null : (
                        <button
                          type="button"
                          onClick={() => handleToggleCompanyStatus(company)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                            company.isActive
                              ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {company.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {!company.deletedAt ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCompany(company)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'subscriptions' ? (
        <div className="space-y-4">
          <SectionHeader
            title="Subscription Management"
            subtitle="Assign plans and control billing status per workspace"
            icon={CreditCard}
          />
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {companyRows.map((company) => {
              const draft = subscriptionDrafts[company.id] || {};
              return (
                <div key={company.id} className="border-b border-slate-100 px-5 py-5 last:border-b-0">
                  <div className="mb-4 flex flex-col gap-1 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{company.name}</p>
                      <p className="text-sm text-slate-500">
                        Current: {company.subscriptionPlanName || 'Unassigned'} {company.subscriptionStatus ? `· ${company.subscriptionStatus}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400">
                      Period ends {company.subscriptionEndsAt ? formatDate(company.subscriptionEndsAt) : 'not set'}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    <Select
                      label="Plan"
                      value={draft.subscriptionPlanId || ''}
                      onChange={(value) => handleSubscriptionDraftChange(company.id, 'subscriptionPlanId', value)}
                      options={plans.map((plan) => ({ value: plan.id, label: `${plan.name} · $${plan.pricePerUser}/${plan.billingCycle.toLowerCase()}` }))}
                    />
                    <Select
                      label="Status"
                      value={draft.status || 'Active'}
                      onChange={(value) => handleSubscriptionDraftChange(company.id, 'status', value)}
                      options={[
                        { value: 'Trial', label: 'Trial' },
                        { value: 'Active', label: 'Active' },
                        { value: 'PastDue', label: 'Past Due' },
                        { value: 'Cancelled', label: 'Cancelled' },
                        { value: 'Expired', label: 'Expired' },
                      ]}
                    />
                    <Input type="date" label="Period Start" value={toDateInputValue(draft.currentPeriodStart)} onChange={(value) => handleSubscriptionDraftChange(company.id, 'currentPeriodStart', value)} />
                    <Input type="date" label="Period End" value={toDateInputValue(draft.currentPeriodEnd)} onChange={(value) => handleSubscriptionDraftChange(company.id, 'currentPeriodEnd', value)} />
                    <Input type="date" label="Trial Ends" value={toDateInputValue(draft.trialEndsAt)} onChange={(value) => handleSubscriptionDraftChange(company.id, 'trialEndsAt', value)} />
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleAssignSubscription(company.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary px-4 py-2 text-sm font-semibold text-deep-blue transition hover:brightness-105"
                    >
                      <BadgeDollarSign className="size-4" />
                      Apply subscription
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === 'audit' ? (
        <div className="space-y-4">
          <SectionHeader
            title="Audit Feed"
            subtitle="Recent platform-wide actions across all tenants"
            icon={FileClock}
          />
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            {auditLogs.length === 0 ? (
              <EmptyState label="No audit entries found." />
            ) : (
              auditLogs.map((item) => (
                <div key={item.id} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{formatAuditTitle(item)}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.companyName || 'Global'} · {item.userName || 'System'} · {item.userEmail || 'n/a'}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{formatDateTime(item.createdAt)}</p>
                      <p>{item.ipAddress || 'No IP'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'platform' ? (
        <div className="space-y-6">
          <SectionHeader
            title="Platform Settings"
            subtitle="Global integration and security posture"
            icon={Cog}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SettingCard
              icon={Cog}
              label="Environment"
              value={overview?.platformSettings?.environmentName || 'Unknown'}
              description="Current ASP.NET Core environment"
            />
            <SettingCard
              icon={CheckCircle2}
              label="Google OAuth"
              value={overview?.platformSettings?.googleOAuthConfigured ? 'Configured' : 'Missing'}
              description="Workspace SSO integration readiness"
            />
            <SettingCard
              icon={UserCog}
              label="SMTP"
              value={overview?.platformSettings?.smtpConfigured ? 'Configured' : 'Missing'}
              description="Email delivery for invites and security flows"
            />
            <SettingCard
              icon={CalendarClock}
              label="Invite TTL"
              value={`${overview?.platformSettings?.inviteExpiryDays || 7} days`}
              description={`Refresh tokens: ${overview?.platformSettings?.refreshTokenDays || 7} days`}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Frontend Origins</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {(overview?.platformSettings?.frontendUrls || []).map((url) => (
                <span key={url} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {url}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SectionHeader({ title, subtitle, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="rounded-xl border border-primary/15 bg-primary/10 p-3 text-primary">
        <Icon className="size-4.5" />
      </div>
    </div>
  );
}

function ChartPanel({ title, meta, footer, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-500">{meta}</p>
        </div>
        {footer ? (
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {footer}
          </span>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? 'bg-primary/10 text-primary' : 'bg-amber-50 text-amber-700'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function CompanyLifecycleBadge({ company }) {
  const lifecycle = getCompanyLifecycle(company);

  if (lifecycle === 'deleted') {
    return <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">Deleted</span>;
  }

  if (lifecycle === 'pending') {
    return <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">Pending onboarding</span>;
  }

  return <StatusBadge active={lifecycle === 'active'} />;
}

function MetricPanel({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-xl border border-primary/15 bg-primary/10 p-3 text-primary">
          <Icon className="size-4.5" />
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{note}</p>
    </div>
  );
}

function MiniBarChart({ data, valueKey, labelKey, colorClassName }) {
  const maxValue = Math.max(...data.map((item) => item[valueKey] || 0), 1);

  return (
    <div className="grid grid-cols-6 gap-3">
      {data.map((item) => {
        const height = `${Math.max(((item[valueKey] || 0) / maxValue) * 100, item[valueKey] ? 12 : 4)}%`;
        return (
          <div key={item[labelKey]} className="flex h-56 min-h-56 flex-col items-center justify-end gap-3">
            <span className="text-xs font-semibold text-slate-700">{item[valueKey] || 0}</span>
            <div className="flex h-40 w-full items-end rounded-xl bg-slate-100 px-1.5 py-1.5">
              <div className={`w-full rounded-lg ${colorClassName}`} style={{ height }} />
            </div>
            <span className="text-center text-xs text-slate-500">{item[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function ActivityComboChart({ data, compareData = [], valueKey, labelKey }) {
  const currentTotal = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  const previousTotal = compareData.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  const growth = previousTotal > 0
    ? ((currentTotal - previousTotal) / previousTotal) * 100
    : currentTotal > 0
      ? 100
      : 0;
  const growthLabel = `${growth >= 0 ? '+' : ''}${formatDecimal(growth)}% compared to previous 7 days`;
  const maxValue = Math.max(
    ...data.map((item) => item[valueKey] || 0),
    ...compareData.map((item) => item[valueKey] || 0),
    1,
  );
  const slots = data.map((item, index) => {
    const currentRaw = item[valueKey] || 0;
    const compareRaw = compareData[index]?.[valueKey] || 0;
    const currentPercent = maxValue ? (currentRaw / maxValue) * 100 : 0;
    const comparePercent = maxValue ? (compareRaw / maxValue) * 100 : 0;

    return {
      label: item[labelKey],
      value: currentRaw,
      compareValue: compareRaw,
      currentPercent,
      comparePercent,
      currentHeight: Math.min(currentPercent * 0.86, 86),
      backgroundHeight: Math.min(comparePercent * 0.9, 90),
      lineHeight: Math.min(comparePercent * 0.86, 86),
    };
  });
  const linePoints = slots.map((item, index) => {
    const x = slots.length === 1 ? 50 : (index / (slots.length - 1)) * 100;
    const y = 100 - item.lineHeight;
    return { x, y, value: item.lineHeight };
  });
  const linePath = buildSmoothLinePath(linePoints);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-500">
            <TrendingUp className="size-4 text-primary" />
            {growthLabel}
          </p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="block size-3 rounded-full bg-primary shadow-[0_0_8px_rgba(19,236,182,0.4)]" />
            <span className="text-xs font-bold text-slate-500">Current 7d</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block size-3 rounded-full bg-slate-200" />
            <span className="text-xs font-bold text-slate-500">Previous 7d</span>
          </div>
        </div>
      </div>

      <div className="relative h-72 w-full rounded-xl bg-slate-50/70 px-4 py-5">
        <div className="pointer-events-none absolute bottom-8 left-0 top-0 flex flex-col justify-between text-[10px] font-black text-slate-300">
          {['100%', '75%', '50%', '25%', '0%'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="pointer-events-none absolute bottom-8 left-10 right-0 top-0 flex flex-col justify-between">
          {[0, 25, 50, 75, 100].map((value) => (
            <div key={value} className="h-px w-full bg-slate-100" />
          ))}
        </div>

        <div className="absolute bottom-8 left-10 right-0 top-0 flex items-end justify-between gap-3 px-2 pt-4">
          {slots.map((slot, index) => (
            <div key={slot.label} className="group/bar relative h-full flex-1">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-lg bg-slate-50 transition-colors group-hover/bar:bg-slate-100"
                style={{ height: `${slot.backgroundHeight}%` }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-lg bg-primary/20 transition-colors group-hover/bar:bg-primary/30"
                style={{ height: `${slot.currentHeight}%` }}
              >
                <div className="absolute left-0 right-0 top-0 h-1 bg-primary/40" />
              </div>
              <div className="pointer-events-none absolute -top-9 left-1/2 z-20 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[10px] font-black text-white opacity-0 shadow-sm transition-opacity group-hover/bar:opacity-100">
                {formatDecimal(slot.currentPercent)}%
                <span className="ml-1 text-slate-300">({slot.value})</span>
              </div>
            </div>
          ))}

          <svg className="pointer-events-none absolute inset-x-2 bottom-0 z-10 h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="adminActivityLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#13ecb6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
            <path
              d={linePath}
              fill="none"
              stroke="url(#adminActivityLineGradient)"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="drop-shadow-[0_4px_8px_rgba(19,236,182,0.25)]"
            />
          </svg>
        </div>

        <div className="absolute bottom-0 left-10 right-0 grid gap-3 px-2" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
          {slots.map((slot) => (
            <div key={slot.label} className="text-center">
              <p className="text-[10px] font-black uppercase tracking-tight text-slate-400">{slot.label}</p>
              <p className="mt-1 text-xs font-black text-slate-900">{slot.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StackedRoleBar({ items }) {
  const filtered = items.filter((item) => item.count > 0);

  if (filtered.length === 0) {
    return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-sm text-slate-500">No role data yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-full bg-slate-100">
      <div className="flex h-5 w-full">
        {filtered.map((item) => (
          <div
            key={item.role}
            className={getRoleColorClass(item.role)}
            style={{ width: `${Math.max(item.share, 3)}%` }}
            title={`${item.role}: ${item.count}`}
          />
        ))}
      </div>
    </div>
  );
}

function RoleLegendRow({ item }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className={`block size-3 rounded-full ${getRoleColorClass(item.role)}`} />
        <span className="text-sm font-medium text-slate-700">{item.role}</span>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-900">{item.count}</p>
        <p className="text-xs text-slate-500">{formatPercent(item.share)}</p>
      </div>
    </div>
  );
}

function StatusBarRow({ label, count, total }) {
  const width = total ? Math.max((count / total) * 100, count ? 6 : 0) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{count}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100">
        <div className="h-2.5 rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function CompanyLoadRow({ company, index, largestMemberCount }) {
  const width = largestMemberCount ? Math.max(((company.memberCount || 0) / largestMemberCount) * 100, 8) : 8;

  return (
    <div className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-4 md:grid-cols-[auto_1fr_auto] md:items-center">
      <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {index + 1}
      </span>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">{company.name}</p>
          <CompanyLifecycleBadge company={company} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {company.domain} · {company.mentorCount} mentors · {company.pendingInviteCount} pending invites
        </p>
        <div className="mt-3 h-2.5 rounded-full bg-slate-200">
          <div className="h-2.5 rounded-full bg-primary" style={{ width: `${width}%` }} />
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold tracking-tight text-slate-900">{company.memberCount}</p>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Members</p>
      </div>
    </div>
  );
}

function DomainHotspotRow({ company }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{company.name}</p>
          <p className="mt-1 text-sm text-slate-500">{company.domain}</p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          {company.pendingInviteCount} invites
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <p className="text-slate-500">Members</p>
          <p className="mt-1 font-semibold text-slate-900">{company.memberCount}</p>
        </div>
        <div>
          <p className="text-slate-500">HR</p>
          <p className="mt-1 font-semibold text-slate-900">{company.hrCount}</p>
        </div>
        <div>
          <p className="text-slate-500">Plan</p>
          <p className="mt-1 font-semibold text-slate-900">{company.subscriptionPlanName || 'None'}</p>
        </div>
      </div>
    </div>
  );
}

function QueueInsightRow({ company }) {
  const inviteRate = company.memberCount ? ((company.pendingInviteCount || 0) / company.memberCount) * 100 : 0;
  const mentorDensity = company.memberCount ? ((company.mentorCount || 0) / company.memberCount) * 100 : 0;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{company.name}</p>
          <p className="mt-1 text-sm text-slate-500">{company.domain}</p>
        </div>
        <CompanyLifecycleBadge company={company} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <QueueMetric label="Invite load" value={formatPercent(inviteRate)} />
        <QueueMetric label="Mentor density" value={formatPercent(mentorDensity)} />
      </div>
      <div className="mt-4 h-2.5 rounded-full bg-slate-200">
        <div
          className="h-2.5 rounded-full bg-primary"
          style={{ width: `${Math.min(Math.max(inviteRate * 2, 6), 100)}%` }}
        />
      </div>
    </div>
  );
}

function QueueMetric({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function TenantCoverageHeatmap({ rows }) {
  const metricKeys = ['members', 'mentors', 'hr', 'invites', 'billing'];
  const metricLabels = {
    members: 'Members',
    mentors: 'Mentors',
    hr: 'HR',
    invites: 'Invites',
    billing: 'Billing',
  };

  const maxByMetric = metricKeys.reduce((accumulator, key) => {
    accumulator[key] = Math.max(
      ...rows.map((row) => row.metrics.find((metric) => metric.key === key)?.value || 0),
      1,
    );
    return accumulator;
  }, {});

  if (!rows.length) {
    return <EmptyState label="No tenant coverage data available." />;
  }

  return (
    <div>
      <div className="grid grid-cols-[1.4fr_repeat(5,minmax(0,1fr))] gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        <div>Company</div>
        {metricKeys.map((key) => (
          <div key={key} className="text-center">{metricLabels[key]}</div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-[1.4fr_repeat(5,minmax(0,1fr))] gap-2">
            <div className="flex items-center rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              {row.label}
            </div>
            {row.metrics.map((metric) => (
              <div
                key={metric.key}
                className={`flex h-10 items-center justify-center rounded-lg ${getHeatCellClass(metric.value, maxByMetric[metric.key])}`}
                title={`${metric.label}: ${metric.value}`}
              >
                <span className="text-sm font-semibold text-slate-900">{metric.value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end items-center gap-2">
        <span className="text-[10px] text-slate-400">Low</span>
        <div className="flex gap-1">
          <div className="size-3 rounded bg-primary/10" />
          <div className="size-3 rounded bg-primary/30" />
          <div className="size-3 rounded bg-primary/60" />
          <div className="size-3 rounded bg-primary" />
        </div>
        <span className="text-[10px] text-slate-400">High</span>
      </div>
    </div>
  );
}

function SettingCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-700">
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        <option value="">Select</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ label }) {
  return <div className="px-5 py-8 text-sm text-slate-500">{label}</div>;
}

function buildSubscriptionDrafts(companies, plans) {
  const fallbackPlanId = plans[0]?.id || '';
  return Object.fromEntries(
    companies.map((company) => [
      company.id,
      {
        subscriptionPlanId: findPlanIdByName(plans, company.subscriptionPlanName) || fallbackPlanId,
        status: company.subscriptionStatus || 'Active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: company.subscriptionEndsAt || addMonthsIso(1),
        trialEndsAt: '',
      },
    ]),
  );
}

function buildRecentDaySeries(items, dayCount, endOffsetDays = 0) {
  const today = startOfDay(new Date());
  today.setDate(today.getDate() - endOffsetDays);
  const buckets = Array.from({ length: dayCount }, (_, index) => {
    const current = new Date(today);
    current.setDate(today.getDate() - (dayCount - index - 1));
    return {
      key: current.toISOString().slice(0, 10),
      label: current.toLocaleDateString('en-GB', { weekday: 'short' }),
      count: 0,
    };
  });

  const lookup = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]));
  items.forEach((item) => {
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return;
    }

    const key = startOfDay(createdAt).toISOString().slice(0, 10);
    if (lookup[key]) {
      lookup[key].count += 1;
    }
  });

  return buckets;
}

function buildRecentMonthSeries(items, monthCount) {
  const now = new Date();
  const buckets = Array.from({ length: monthCount }, (_, index) => {
    const current = new Date(now.getFullYear(), now.getMonth() - (monthCount - index - 1), 1);
    return {
      key: `${current.getFullYear()}-${current.getMonth()}`,
      label: current.toLocaleDateString('en-GB', { month: 'short' }),
      count: 0,
    };
  });

  const lookup = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]));
  items.forEach((item) => {
    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime())) {
      return;
    }

    const key = `${createdAt.getFullYear()}-${createdAt.getMonth()}`;
    if (lookup[key]) {
      lookup[key].count += 1;
    }
  });

  return buckets;
}

function buildSmoothLinePath(points) {
  if (!points.length) {
    return '';
  }

  if (points.length === 1) {
    return `M ${points[0].x},${points[0].y}`;
  }

  let path = `M ${points[0].x},${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
  }

  return path;
}

function buildAreaPath(points, baselineY) {
  if (!points.length) {
    return '';
  }

  const linePath = buildSmoothLinePath(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath} L ${last.x},${baselineY} L ${first.x},${baselineY} Z`;
}

function getRoleColorClass(role) {
  switch ((role || '').toLowerCase()) {
    case 'systemadmin':
      return 'bg-[#0F766E]';
    case 'hr':
      return 'bg-[#14B8A6]';
    case 'mentor':
      return 'bg-[#0EA5E9]';
    case 'mentee':
      return 'bg-[#6366F1]';
    default:
      return 'bg-slate-400';
  }
}

function getHeatCellClass(value, maxValue) {
  const ratio = maxValue ? value / maxValue : 0;

  if (ratio >= 0.8) return 'bg-primary text-deep-blue';
  if (ratio >= 0.55) return 'bg-primary/70';
  if (ratio >= 0.3) return 'bg-primary/35';
  return 'bg-primary/12';
}

function startOfDay(value) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function formatPercent(value) {
  return `${formatDecimal(value)}%`;
}

function formatDecimal(value) {
  return Number.isFinite(value) ? value.toFixed(value >= 10 ? 0 : 1) : '0';
}

function findPlanIdByName(plans, planName) {
  return plans.find((plan) => plan.name === planName)?.id || '';
}

function addMonthsIso(months) {
  const value = new Date();
  value.setMonth(value.getMonth() + months);
  return value.toISOString();
}

function toDateInputValue(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) {
    return 'n/a';
  }

  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) {
    return 'n/a';
  }

  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAuditTitle(item) {
  if (!item) {
    return 'Audit event';
  }

  return `${item.action} ${item.entityType}`.trim();
}

function getCompanyLifecycle(company) {
  if (company?.deletedAt) {
    return 'deleted';
  }

  if (company?.isActive) {
    return 'active';
  }

  const hasMembers = (company?.memberCount || 0) > 0;
  const hasPendingInvites = (company?.pendingInviteCount || 0) > 0;
  return !hasMembers && hasPendingInvites ? 'pending' : 'inactive';
}

function formatCompanyLifecycle(company) {
  const lifecycle = getCompanyLifecycle(company);

  switch (lifecycle) {
    case 'active':
      return 'Active workspace';
    case 'pending':
      return 'Pending HR onboarding';
    case 'deleted':
      return 'Deleted workspace';
    default:
      return 'Inactive workspace';
  }
}

function extractErrorMessage(error, fallback) {
  const errors = error?.response?.data?.errors;
  if (errors && typeof errors === 'object') {
    const firstError = Object.values(errors).flat().find(Boolean);
    if (firstError) {
      return firstError;
    }
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.response?.data?.title ||
    error?.message ||
    fallback
  );
}
