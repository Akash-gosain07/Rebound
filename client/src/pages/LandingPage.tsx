import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../components/rebound/PrimaryButton';
import { useAuth } from '../providers/AuthProvider';
import { LoginForm } from '../components/auth/LoginForm';

function ReboundMark() {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-400 text-lg font-bold text-white shadow-soft ring-1 ring-white/70">
        R
      </div>
      <div>
        <div className="font-display text-2xl font-semibold tracking-tight text-slate-950">Rebound</div>
        <div className="text-xs font-medium uppercase tracking-[0.28em] text-slate-500">Secure recovery network</div>
      </div>
    </div>
  );
}

function Illustration() {
  return (
    <div className="relative h-[23rem] w-full max-w-[32rem]">
      <div className="absolute inset-0 rounded-[40px] bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.22),_transparent_42%),linear-gradient(145deg,#081120_0%,#0f1c2f_48%,#15324e_100%)] shadow-[0_30px_80px_rgba(8,17,32,0.24)]" />
      <div className="absolute inset-5 rounded-[34px] border border-white/10 bg-white/5 backdrop-blur-sm" />
      <div className="absolute left-8 top-8 rounded-[28px] border border-white/10 bg-white/10 px-4 py-3 text-white shadow-soft backdrop-blur">
        <div className="text-xs uppercase tracking-[0.3em] text-cyan-100/80">Recovery status</div>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-400/15 ring-1 ring-emerald-300/30" />
          <div>
            <div className="text-sm font-semibold">Wallet claim verified</div>
            <div className="text-xs text-slate-200/75">Meetup approved at Library Desk</div>
          </div>
        </div>
      </div>
      <div className="absolute right-8 top-14 w-40 rounded-[26px] border border-white/10 bg-white px-4 py-4 shadow-card">
        <div className="text-xs uppercase tracking-[0.26em] text-slate-400">Confidence</div>
        <div className="mt-2 text-3xl font-display font-semibold text-slate-950">98%</div>
        <div className="mt-2 h-2 rounded-full bg-slate-100">
          <div className="h-2 w-[98%] rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" />
        </div>
      </div>
      <div className="absolute bottom-8 left-10 right-10 rounded-[30px] border border-white/10 bg-slate-950/80 px-5 py-4 text-white shadow-card backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.28em] text-slate-400">Live ecosystem</div>
            <div className="mt-2 text-lg font-semibold">Verified handoffs, map-based discovery, real-time claims</div>
          </div>
          <div className="grid gap-2 text-right text-sm text-slate-300">
            <div>24/7 incident intake</div>
            <div>Identity-backed recovery</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const trustMetrics = [
  { value: '10m', label: 'average first response' },
  { value: '92%', label: 'resolved through guided flow' },
  { value: '1 hub', label: 'single place for map, claims, alerts' }
];

export function LandingPage({ initialMode = 'signin' }: { initialMode?: 'signin' | 'signup' }) {
  const navigate = useNavigate();
  const { continueAsGuest } = useAuth();

  const goToMap = async () => {
    await continueAsGuest();
    navigate('/map');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef6fb_0%,#f8fbfd_36%,#ffffff_100%)]">
      <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.14),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.14),_transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl space-y-8"
        >
          <ReboundMark />
          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-cyan-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-800 shadow-soft backdrop-blur">
              Campus-grade lost and found intelligence
            </div>
            <h1 className="font-display text-5xl font-semibold leading-[1.02] text-slate-950 md:text-6xl">
              Reunite people with what matters through a calmer, safer recovery workflow.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-slate-600">
              Rebound turns scattered lost-and-found activity into a trustworthy operating system for discovery,
              claims, and verified handoffs.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {trustMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[28px] border border-white/70 bg-white/80 px-5 py-4 shadow-soft backdrop-blur"
              >
                <div className="font-display text-2xl font-semibold text-slate-950">{metric.value}</div>
                <div className="mt-1 text-sm text-slate-600">{metric.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-3 max-w-sm">
            <PrimaryButton
              size="lg"
              type="button"
              className="rounded-full bg-slate-950 text-white shadow-[0_18px_45px_rgba(15,23,42,0.18)] hover:bg-slate-900"
              onClick={goToMap}
            >
              Continue as guest
            </PrimaryButton>
            <button
              type="button"
              onClick={goToMap}
              className="w-full text-center text-sm font-semibold text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Preview the live map instantly
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="grid w-full max-w-3xl gap-6 lg:w-auto"
        >
          <div className="flex justify-center lg:justify-end">
            <Illustration />
          </div>
          <div className="mx-auto w-full max-w-md rounded-[32px] border border-white/70 bg-white/86 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.14)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Access portal</div>
                <h2 className="mt-2 font-display text-3xl font-semibold text-slate-950">
                  {initialMode === 'signup' ? 'Create your recovery account' : 'Sign in to your workspace'}
                </h2>
              </div>
              <div className="rounded-2xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white">Secure</div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Continue with a verified identity to post items, manage claims, and coordinate safer handoffs.
            </p>
            <div className="mt-6">
              <LoginForm initialMode={initialMode} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
