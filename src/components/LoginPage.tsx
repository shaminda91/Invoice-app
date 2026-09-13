import React from 'react';
import { Translations, AppLanguage } from '../i18n/translations';
import { ADMIN_EMAIL } from '../types';
import {
  Receipt,
  CheckCircle2,
  FileSpreadsheet,
  FileDown,
  Cloud,
  Building2,
  Languages,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onLoginGoogle: () => void;
  onContinueGuest: () => void;
  isLoggingIn: boolean;
  loginError: string | null;
  language: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  t: Translations;
}

export function LoginPage({
  onLoginGoogle,
  onContinueGuest,
  isLoggingIn,
  loginError,
  language,
  onLanguageChange,
  t,
}: LoginPageProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* BACKGROUND DECORATIVE ACCENTS */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP NAV BAR */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">
                PS Invoice
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Ps ebay solution
              </span>
            </div>
            <p className="text-xs text-slate-400">by Pramesh Shaminda</p>
          </div>
        </div>

        {/* LANGUAGE SWITCHER */}
        <div className="flex items-center bg-slate-800/80 backdrop-blur-xs border border-slate-700/60 p-1 rounded-xl">
          <div className="px-2 text-slate-400 hidden sm:block">
            <Languages className="w-4 h-4" />
          </div>
          <button
            type="button"
            onClick={() => onLanguageChange('si')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              language === 'si'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            සිංහල
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              language === 'en'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </header>

      {/* MAIN HERO CONTENT */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col lg:flex-row items-center gap-10 lg:gap-14 my-auto">
        {/* LEFT COLUMN: BRAND STORY & KEY PERKS */}
        <div className="flex-1 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.appBadge}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {t.loginTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {t.loginSubtitle}
          </p>

          {/* BENEFIT GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center mb-2">
                <FileDown className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                {t.loginBenefit1Title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                {t.loginBenefit1Desc}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2">
                <Cloud className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                {t.loginBenefit2Title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                {t.loginBenefit2Desc}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                {t.loginBenefit3Title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                {t.loginBenefit3Desc}
              </p>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white mb-1">
                {t.loginBenefit4Title}
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                {t.loginBenefit4Desc}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AUTHENTICATION CARD */}
        <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/30">
              <Receipt className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {language === 'si' ? 'ගිණුමට පිවිසෙන්න' : 'Sign in to PS Invoice'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'si'
                ? 'ඔබගේ Gmail / Google ගිණුම මගින් තත්පරයකින් ඇතුල් වන්න'
                : 'Authenticate securely using your Google (Gmail) account'}
            </p>
          </div>

          {/* ERROR ALERT */}
          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <span className="font-bold">!</span>
              <span>{loginError}</span>
            </div>
          )}

          {/* PRIMARY GOOGLE SIGN IN BUTTON */}
          <button
            type="button"
            id="btn-login-google"
            onClick={onLoginGoogle}
            disabled={isLoggingIn}
            className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                <span>{t.connectingGoogle}</span>
              </>
            ) : (
              <>
                {/* OFFICIAL GOOGLE SVG ICON */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
                  />
                </svg>
                <span>
                  {language === 'si'
                    ? 'Gmail ගිණුමෙන් පිවිසෙන්න'
                    : 'Sign in with Google (Gmail)'}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          {/* DIVIDER */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-slate-800 px-3 text-slate-400">
                {language === 'si' ? 'හෝ' : 'or'}
              </span>
            </div>
          </div>

          {/* GUEST ACCESS BUTTON */}
          <button
            type="button"
            id="btn-login-guest"
            onClick={onContinueGuest}
            className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-600/50 transition-colors cursor-pointer text-center"
          >
            {t.continueAsGuest}
          </button>

          {/* ADMIN MONITORING & TRIAL BADGE */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-snug">
                {language === 'si' ? (
                  <>
                    පරිපාලක ගිණුම:{' '}
                    <span className="text-indigo-300 font-mono font-semibold">
                      {ADMIN_EMAIL}
                    </span>
                    . සියලුම පිවිසුම් තොරතුරු පරිපාලක වෙත වාර්තා වේ.
                  </>
                ) : (
                  <>
                    System Admin:{' '}
                    <span className="text-indigo-300 font-mono font-semibold">
                      {ADMIN_EMAIL}
                    </span>
                    . User sessions are securely logged.
                  </>
                )}
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-2.5 flex items-center justify-between text-[11px]">
              <span className="text-slate-300">
                {language === 'si' ? 'නව පරිශීලක ප්‍රවේශය:' : 'New user access:'}
              </span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {language === 'si' ? 'දින 7 ක අත්හදා බැලීමක්' : '7 Days Trial Access'}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        <p>
          PS Invoice © 2026 • Ps ebay solution • Pramesh Shaminda (Malabe, Sri Lanka)
        </p>
      </footer>
    </div>
  );
}
