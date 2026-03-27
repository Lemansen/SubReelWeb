"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Copy,
  Download,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MonitorSmartphone,
  Save,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  UserRound,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { fetchSession, logoutAccount, type AccountUser } from "@/lib/auth-client";

type Lang = "RU" | "EN";
type Message = { type: "success" | "error"; text: string } | null;

const content = {
  RU: {
    nav_home: "Главная",
    nav_launcher: "Лаунчер",
    nav_server: "Сервер",
    nav_wiki: "Вики",
    nav_account: "Кабинет",
    badge: "Личный кабинет",
    title: "Профиль Subreel",
    subtitle:
      "Нормальный центр аккаунта: данные профиля, безопасность, launcher token и состояние связок собраны в одном месте.",
    auth_title: "Account Center",
    auth_desc:
      "Здесь теперь не просто карточки, а полноценный профиль пользователя с настройками, безопасностью и доступом для будущего лаунчера.",
    logout_button: "Выйти",
    logout_ok: "Ты вышел из аккаунта.",
    guest_title: "Войди или создай аккаунт",
    guest_desc:
      "Чтобы открыть профиль, войди через отдельную страницу авторизации или создай новый аккаунт.",
    guest_login: "Перейти ко входу",
    guest_register: "Создать аккаунт",
    profile_badge: "Текущий профиль",
    profile_status: "Статус",
    profile_status_value: "Авторизован",
    profile_role: "Роль",
    profile_role_value: "Игрок проекта",
    profile_created: "Создан",
    quick_title: "Состояние аккаунта",
    quick_auth: "Профиль",
    quick_auth_desc: "Основные данные аккаунта, логин и почта собраны в одном месте и готовы для сайта и лаунчера.",
    quick_launcher: "Лаунчер",
    quick_launcher_desc: "Тот же аккаунт уже может использоваться для будущего клиента.",
    quick_security: "Безопасность",
    quick_security_desc: "Пароль, сессия и launcher token собраны в одном месте.",
    quick_support: "Активность",
    quick_support_desc: "Профиль уже хранит дату последнего входа и базу под историю устройств.",
    cta_title: "Дальше можно усиливать экосистему",
    cta_desc:
      "Следующий логичный шаг уже понятен: расширение профиля игрока, история активности и более глубокая связка с лаунчером.",
    cta_primary: "Открыть лаунчер",
    cta_secondary: "Перейти в вики",
    footer: "Subreel Studio • Account",
    profile_settings: "Настройки профиля",
    profile_settings_desc:
      "Обновляй основные данные аккаунта. Эти поля потом будут использоваться и на сайте, и в лаунчере.",
    security_title: "Безопасность и доступ",
    security_desc:
      "Управляй паролем, следи за состоянием связок и держи доступ к launcher token под контролем.",
    launcher_title: "Launcher Access",
    launcher_desc:
      "Ключ для будущего лаунчера уже живёт в профиле. Его можно копировать и обновлять прямо из кабинета.",
    links_title: "Состояние аккаунта",
    save_profile: "Сохранить изменения",
    update_password: "Обновить пароль",
    copy_token: "Скопировать токен",
    rotate_token: "Обновить токен",
    nickname: "Ник",
    login: "Логин",
    email: "Почта",
    current_password: "Текущий пароль",
    next_password: "Новый пароль",
    last_login: "Последний вход",
    microsoft: "Профиль",
    connected: "Подключён",
    not_connected: "Не подключён",
    session_state: "Сессия",
    session_active: "Активна",
    identity_title: "Идентичность",
    identity_desc: "Профиль, роль и активная сессия собраны в одном блоке, чтобы кабинет ощущался как настоящий центр аккаунта.",
    launcher_token: "Launcher Token",
    token_updated: "Обновлён",
    profile_saved: "Профиль обновлён.",
    profile_failed: "Не удалось сохранить профиль.",
    profile_exists: "Логин или почта уже заняты.",
    password_saved: "Пароль обновлён.",
    password_failed: "Не удалось обновить пароль.",
    password_invalid: "Текущий пароль указан неверно.",
    password_short: "Новый пароль должен быть не короче 6 символов.",
    token_copied: "Launcher token скопирован.",
    token_rotated: "Launcher token обновлён.",
    token_failed: "Не удалось обновить launcher token.",
    loading_title: "Загрузка профиля",
    loading_desc: "Проверяем текущую сессию и подготавливаем кабинет.",
  },
  EN: {
    nav_home: "Home",
    nav_launcher: "Launcher",
    nav_server: "Server",
    nav_wiki: "Wiki",
    nav_account: "Account",
    badge: "Personal Cabinet",
    title: "Subreel Profile",
    subtitle:
      "A real account center: profile data, security, launcher token, and link state are gathered in one place.",
    auth_title: "Account Center",
    auth_desc:
      "This is no longer just a set of cards. It is a full user profile with settings, security, and launcher access.",
    logout_button: "Sign out",
    logout_ok: "You have signed out.",
    guest_title: "Sign in or create an account",
    guest_desc: "To open the profile, sign in through the dedicated auth page or create a new account.",
    guest_login: "Open login",
    guest_register: "Create account",
    profile_badge: "Current profile",
    profile_status: "Status",
    profile_status_value: "Authorized",
    profile_role: "Role",
    profile_role_value: "Project player",
    profile_created: "Created",
    quick_title: "Account state",
    quick_auth: "Profile",
    quick_auth_desc: "Core account data, login, and email live in one place and are ready for both the site and launcher.",
    quick_launcher: "Launcher",
    quick_launcher_desc: "The same account can already be used for the future client.",
    quick_security: "Security",
    quick_security_desc: "Password, session, and launcher token are in one place.",
    quick_support: "Activity",
    quick_support_desc: "The profile already stores last sign-in date and a base for device history.",
    cta_title: "The ecosystem can be pushed further",
    cta_desc:
      "The next logical step is clear: richer player profile data, activity history, and a deeper launcher connection.",
    cta_primary: "Open launcher",
    cta_secondary: "Open wiki",
    footer: "Subreel Studio • Account",
    profile_settings: "Profile settings",
    profile_settings_desc:
      "Update the main account data. These fields will later be used on both the website and the launcher.",
    security_title: "Security & access",
    security_desc:
      "Manage your password, track link state, and keep launcher token access under control.",
    launcher_title: "Launcher Access",
    launcher_desc:
      "The key for the future launcher already lives inside the profile. You can copy and rotate it directly from the cabinet.",
    links_title: "Account state",
    save_profile: "Save changes",
    update_password: "Update password",
    copy_token: "Copy token",
    rotate_token: "Rotate token",
    nickname: "Nickname",
    login: "Login",
    email: "Email",
    current_password: "Current password",
    next_password: "New password",
    last_login: "Last login",
    microsoft: "Profile",
    connected: "Connected",
    not_connected: "Not connected",
    session_state: "Session",
    session_active: "Active",
    identity_title: "Identity",
    identity_desc: "Profile data, role, and the active session are grouped together so the cabinet feels like a real account center.",
    launcher_token: "Launcher Token",
    token_updated: "Updated",
    profile_saved: "Profile updated.",
    profile_failed: "Failed to save profile.",
    profile_exists: "Login or email is already taken.",
    password_saved: "Password updated.",
    password_failed: "Failed to update password.",
    password_invalid: "Current password is incorrect.",
    password_short: "New password must be at least 6 characters.",
    token_copied: "Launcher token copied.",
    token_rotated: "Launcher token rotated.",
    token_failed: "Failed to rotate launcher token.",
    loading_title: "Loading profile",
    loading_desc: "Checking the current session and preparing the cabinet.",
  },
} as const;

export default function AccountPage() {
  const [lang, setLang] = useState<Lang>("RU");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [currentUser, setCurrentUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenPending, setTokenPending] = useState(false);
  const [profilePending, setProfilePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [profileForm, setProfileForm] = useState({ login: "", email: "", nickname: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", nextPassword: "" });
  const pathname = usePathname();
  const router = useRouter();
  const t = content[lang];

  const navItems = [
    { name: t.nav_home, path: "/" },
    { name: t.nav_launcher, path: "/launcher" },
    { name: t.nav_server, path: "/server" },
    { name: t.nav_account, path: "/account" },
  ];

  useEffect(() => {
    let cancelled = false;

    fetchSession()
      .then((user) => {
        if (!cancelled) {
          setCurrentUser(user);
          if (user) {
            setProfileForm({
              login: user.login,
              email: user.email,
              nickname: user.nickname,
            });
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentUser(null);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    await logoutAccount();
    setCurrentUser(null);
    setMessage({ type: "success", text: t.logout_ok });
    router.push("/login");
  }

  async function handleCopyLauncherToken() {
    if (!currentUser) return;
    await navigator.clipboard.writeText(currentUser.launcherToken);
    setMessage({ type: "success", text: t.token_copied });
  }

  async function handleRotateLauncherToken() {
    setTokenPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/account/launcher-token", {
        method: "POST",
        credentials: "include",
      });

      const result = (await response.json()) as { ok: boolean; user?: AccountUser };

      if (!response.ok || !result.ok || !result.user) {
        setMessage({ type: "error", text: t.token_failed });
        return;
      }

      setCurrentUser(result.user);
      setMessage({ type: "success", text: t.token_rotated });
    } catch {
      setMessage({ type: "error", text: t.token_failed });
    } finally {
      setTokenPending(false);
    }
  }

  async function handleProfileSave() {
    setProfilePending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profileForm),
      });

      const result = (await response.json()) as
        | { ok: true; user: AccountUser }
        | { ok: false; error: "fill" | "exists" | "unauthorized" };

      if (!response.ok || !result.ok) {
        const error = result.ok ? "fill" : result.error;
        setMessage({ type: "error", text: error === "exists" ? t.profile_exists : t.profile_failed });
        return;
      }

      setCurrentUser(result.user);
      setProfileForm({
        login: result.user.login,
        email: result.user.email,
        nickname: result.user.nickname,
      });
      setMessage({ type: "success", text: t.profile_saved });
    } catch {
      setMessage({ type: "error", text: t.profile_failed });
    } finally {
      setProfilePending(false);
    }
  }

  async function handlePasswordSave() {
    setPasswordPending(true);
    setMessage(null);

    try {
      const response = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passwordForm),
      });

      const result = (await response.json()) as
        | { ok: true }
        | { ok: false; error: "fill" | "password" | "invalid" | "unauthorized" };

      if (!response.ok || !result.ok) {
        const error = result.ok ? "fill" : result.error;
        const text = error === "invalid" ? t.password_invalid : error === "password" ? t.password_short : t.password_failed;
        setMessage({ type: "error", text });
        return;
      }

      setPasswordForm({ currentPassword: "", nextPassword: "" });
      setMessage({ type: "success", text: t.password_saved });
    } catch {
      setMessage({ type: "error", text: t.password_failed });
    } finally {
      setPasswordPending(false);
    }
  }

  const profileDate = currentUser
    ? new Date(currentUser.createdAt).toLocaleDateString(lang === "RU" ? "ru-RU" : "en-US")
    : "";
  const lastLoginDate = currentUser
    ? new Date(currentUser.lastLoginAt).toLocaleDateString(lang === "RU" ? "ru-RU" : "en-US")
    : "";
  const launcherTokenDate = currentUser
    ? new Date(currentUser.launcherTokenUpdatedAt).toLocaleDateString(lang === "RU" ? "ru-RU" : "en-US")
    : "";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-text)] transition-colors">
      <nav className="border-b border-[var(--color-border-sharp)] sticky top-0 bg-[var(--color-bg)]/70 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 min-h-16 py-3 md:py-0 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3 md:gap-6 w-auto md:w-1/3 min-w-0">
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-accent-blue)] text-sm font-black uppercase text-white shadow-lg shadow-blue-500/20">S</span>
              <span className="truncate text-lg md:text-xl font-black tracking-tighter uppercase text-[var(--color-accent-blue)]">Subreel</span>
            </Link>
          </div>

          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-4 md:gap-8">
            {navItems.filter((item) => item.path !== "/account").map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] transition-all relative py-2 ${
                    isActive ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text-gray)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {item.name}
                  {isActive && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--color-accent-blue)] rounded-full" />}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center justify-end w-auto md:w-1/3 gap-3 ml-auto">
            <div className="flex items-center gap-1 bg-[var(--color-panel-bg)] p-1 rounded-xl border border-[var(--color-border-sharp)] shadow-sm">
              <Link href="/wiki" className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-sm font-bold uppercase transition-colors group">
                <BookOpen size={14} className="text-[var(--color-text-gray)] group-hover:text-[var(--color-accent-blue)] transition-colors" />
                <span className="hidden sm:block text-[var(--color-text-gray)] group-hover:text-[var(--color-text)] transition-colors">{t.nav_wiki}</span>
              </Link>
              <div className="w-px h-4 bg-[var(--color-border-sharp)] mx-0.5" />
              <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="px-2 md:px-3 py-1.5 rounded-lg hover:bg-[var(--color-panel-hover)] text-[10px] md:text-sm font-bold uppercase text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors">
                {lang}
              </button>
              <ThemeToggle className="p-1.5 md:p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors" />
            </div>
          </div>

          <div className="md:hidden ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] text-[var(--color-text)]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden order-4 w-full rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-3 shadow-lg">
              <div className="grid gap-2">
                {navItems.map((item) => (
                  <Link key={item.path} href={item.path} onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                    {item.name}
                  </Link>
                ))}
                <Link href="/wiki" onClick={() => setMobileMenuOpen(false)} className="rounded-xl px-3 py-3 text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text)]">
                  {t.nav_wiki}
                </Link>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-2">
                <button onClick={() => setLang(lang === "RU" ? "EN" : "RU")} className="text-sm font-black uppercase tracking-[0.16em] text-[var(--color-text-gray)]">
                  {lang}
                </button>
                <ThemeToggle className="p-2 rounded-lg hover:bg-[var(--color-panel-hover)] text-[var(--color-text-gray)] hover:text-[var(--color-text)] transition-colors" />
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="grow px-4 md:px-6 py-12 md:py-24">
        <div className="max-w-7xl mx-auto space-y-10 md:space-y-12">
          <section className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border-sharp)] bg-[radial-gradient(circle_at_top_left,_rgba(71,85,105,0.18),_transparent_38%),linear-gradient(135deg,rgba(12,18,35,0.96),rgba(20,30,50,0.92))] p-7 md:p-10 text-white shadow-[0_30px_90px_rgba(15,23,42,0.24)]">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[var(--color-accent-blue)]/15 blur-3xl" />
            <div className="relative max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/90">
                <Sparkles size={12} />
                {t.badge}
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight">{t.title}</h1>
                <p className="text-sm md:text-base leading-7 text-slate-200">{t.subtitle}</p>
              </div>
              {message && (
                <div
                  className={`max-w-2xl rounded-[1.25rem] border px-4 py-3 text-sm font-medium ${
                    message.type === "success"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                      : "border-red-500/20 bg-red-500/10 text-red-300"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </div>
          </section>

          {loading ? (
            <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-8 md:p-10">
              <div className="max-w-xl space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)]">
                  <Sparkles size={12} />
                  {t.loading_title}
                </span>
                <h2 className="text-2xl font-black tracking-tight text-[var(--color-text)]">{t.loading_title}</h2>
                <p className="text-sm leading-7 text-[var(--color-text-gray)]">{t.loading_desc}</p>
              </div>
            </section>
          ) : currentUser ? (
            <>
              <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
                <aside className="space-y-6">
                  <div className="overflow-hidden rounded-[2rem] border border-[var(--color-border-sharp)] bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(180deg,rgba(59,130,246,0.08),transparent_55%),var(--color-panel-bg)] p-6 md:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-[var(--color-accent-blue)] text-3xl font-black uppercase text-white shadow-lg shadow-blue-500/20">
                        {currentUser.nickname.slice(0, 1)}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-accent-blue)]">
                          <UserRound size={12} />
                          {t.profile_badge}
                        </div>
                        <div>
                          <h2 className="truncate text-2xl font-black tracking-tight text-[var(--color-text)]">
                            {currentUser.nickname}
                          </h2>
                          <p className="truncate text-sm text-[var(--color-text-gray)]">@{currentUser.login}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
                            ID
                          </p>
                          <p className="mt-1 text-sm font-bold text-[var(--color-text)]">#{currentUser.id.slice(0, 8)}</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-4 py-3">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
                            {t.profile_status}
                          </p>
                          <p className="mt-1 text-sm font-bold text-[var(--color-accent-blue)]">{t.profile_status_value}</p>
                        </div>
                      </div>
                      <ProfileMeta label={t.email} value={currentUser.email} icon={<Mail size={15} />} />
                      <ProfileMeta label={t.profile_role} value={t.profile_role_value} icon={<ShieldCheck size={15} />} />
                      <ProfileMeta label={t.profile_created} value={profileDate} icon={<Sparkles size={15} />} />
                      <ProfileMeta label={t.last_login} value={lastLoginDate} icon={<LayoutDashboard size={15} />} />
                    </div>
                  </div>

                  <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-5 md:p-6">
                    <div className="mb-4 flex items-start gap-3">
                      <div className="rounded-2xl bg-[var(--color-accent-blue)]/10 p-3 text-[var(--color-accent-blue)]">
                        <ShieldCheck size={16} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-lg font-black tracking-tight text-[var(--color-text)]">{t.links_title}</h3>
                        <p className="text-sm leading-6 text-[var(--color-text-gray)]">{t.identity_desc}</p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <StatusRow label={t.session_state} value={t.session_active} accent />
                      <StatusRow label={t.quick_launcher} value={t.connected} />
                      <StatusRow label={t.token_updated} value={launcherTokenDate} />
                    </div>
                  </section>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-[1.25rem] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-red-300 transition-colors hover:bg-red-500/15"
                  >
                    <LogOut size={16} />
                    {t.logout_button}
                  </button>
                </aside>

                <div className="space-y-6">
                  <section className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_28%),var(--color-panel-bg)] p-6 md:p-8">
                    <div className="mb-6 space-y-2">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
                          {t.profile_settings}
                        </h3>
                        <p className="max-w-2xl text-sm leading-7 text-[var(--color-text-gray)]">
                          {t.profile_settings_desc}
                        </p>
                      </div>

                    </div>

                    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                      <div className="space-y-6">
                        <section className="rounded-[1.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-5 md:p-6">
                          <div className="mb-5 space-y-2">
                            <h4 className="text-lg font-black tracking-tight text-[var(--color-text)]">
                              {t.profile_settings}
                            </h4>
                            <p className="text-sm leading-6 text-[var(--color-text-gray)]">
                              Обновляй основные данные профиля в одном аккуратном блоке без повторяющихся карточек.
                            </p>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <AccountField
                              label={t.nickname}
                              value={profileForm.nickname}
                              onChange={(value) => setProfileForm((prev) => ({ ...prev, nickname: value }))}
                            />
                            <AccountField
                              label={t.login}
                              value={profileForm.login}
                              onChange={(value) => setProfileForm((prev) => ({ ...prev, login: value }))}
                            />
                          </div>
                          <div className="mt-4">
                            <AccountField
                              label={t.email}
                              value={profileForm.email}
                              onChange={(value) => setProfileForm((prev) => ({ ...prev, email: value }))}
                              type="email"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleProfileSave}
                            disabled={profilePending}
                            className="mt-6 inline-flex items-center gap-2 rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Save size={16} />
                            {t.save_profile}
                          </button>
                        </section>

                        <section className="rounded-[1.75rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] p-5 md:p-6">
                          <div className="mb-5 space-y-2">
                            <h4 className="text-lg font-black tracking-tight text-[var(--color-text)]">
                              {t.security_title}
                            </h4>
                            <p className="text-sm leading-6 text-[var(--color-text-gray)]">{t.security_desc}</p>
                          </div>

                          <div className="space-y-4">
                            <AccountField
                              label={t.current_password}
                              value={passwordForm.currentPassword}
                              onChange={(value) => setPasswordForm((prev) => ({ ...prev, currentPassword: value }))}
                              type="password"
                            />
                            <AccountField
                              label={t.next_password}
                              value={passwordForm.nextPassword}
                              onChange={(value) => setPasswordForm((prev) => ({ ...prev, nextPassword: value }))}
                              type="password"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handlePasswordSave}
                            disabled={passwordPending}
                            className="mt-6 inline-flex items-center gap-2 rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-panel-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <KeyRound size={16} />
                            {t.update_password}
                          </button>
                        </section>
                      </div>

                      <section className="rounded-[1.75rem] border border-[var(--color-border-sharp)] bg-[linear-gradient(180deg,rgba(59,130,246,0.08),transparent_48%),var(--color-bg)] p-5 md:p-6">
                        <div className="mb-5 space-y-2">
                          <h4 className="text-lg font-black tracking-tight text-[var(--color-text)]">
                            {t.launcher_title}
                          </h4>
                          <p className="text-sm leading-6 text-[var(--color-text-gray)]">{t.launcher_desc}</p>
                        </div>

                        <div className="rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-gray)]">
                            {t.launcher_token}
                          </p>
                          <p className="mt-3 break-all font-mono text-sm leading-7 text-[var(--color-text)]">
                            {currentUser.launcherToken}
                          </p>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={handleCopyLauncherToken}
                            className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-panel-hover)]"
                          >
                            <Copy size={16} />
                            {t.copy_token}
                          </button>
                          <button
                            type="button"
                            onClick={handleRotateLauncherToken}
                            disabled={tokenPending}
                            className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Download size={16} />
                            {t.rotate_token}
                          </button>
                        </div>

                        <div className="mt-5 rounded-[1.5rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-4">
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
                            {t.quick_support}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">
                            {t.last_login}: {lastLoginDate}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[var(--color-text-gray)]">
                            {t.quick_launcher_desc}
                          </p>
                        </div>
                      </section>
                    </div>
                  </section>
                </div>
              </section>

            </>
          ) : (
            <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 md:p-8">
                <div className="space-y-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-accent-blue)]">
                    <UserCircle2 size={12} />
                    {t.guest_title}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[var(--color-text)]">
                    {t.guest_title}
                  </h2>
                  <p className="text-sm leading-7 text-[var(--color-text-gray)]">{t.guest_desc}</p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-[var(--color-accent-blue)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                  >
                    <UserRound size={16} />
                    {t.guest_login}
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-[var(--color-text)] transition-colors hover:bg-[var(--color-panel-hover)]"
                  >
                    <Sparkles size={16} />
                    {t.guest_register}
                  </Link>
                </div>
              </div>

              <div className="rounded-[2rem] border border-[var(--color-border-sharp)] bg-[var(--color-panel-bg)] p-6 md:p-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-black tracking-tight text-[var(--color-text)]">
                    {t.auth_title}
                  </h3>
                  <p className="text-sm leading-7 text-[var(--color-text-gray)]">{t.auth_desc}</p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <OverviewCard
                    icon={<ShieldCheck size={18} />}
                    title={t.quick_security}
                    description={t.quick_security_desc}
                    theme="light"
                  />
                  <OverviewCard
                    icon={<MonitorSmartphone size={18} />}
                    title={t.quick_launcher}
                    description={t.quick_launcher_desc}
                    theme="light"
                  />
                  <OverviewCard
                    icon={<Sparkles size={18} />}
                    title={t.quick_auth}
                    description={t.quick_auth_desc}
                    theme="light"
                  />
                  <OverviewCard
                    icon={<LayoutDashboard size={18} />}
                    title={t.quick_support}
                    description={t.quick_support_desc}
                    theme="light"
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--color-border-sharp)] px-4 md:px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
          <span>{t.footer}</span>
          <span>{new Date().getFullYear()} Subreel</span>
        </div>
      </footer>
    </div>
  );
}

type ProfileMetaProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

function ProfileMeta({ icon, label, value }: ProfileMetaProps) {
  return (
    <div className="flex items-center gap-3 rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-4 py-3">
      <div className="rounded-xl bg-[var(--color-accent-blue)]/10 p-2 text-[var(--color-accent-blue)]">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">{label}</p>
        <p className="truncate text-sm font-semibold text-[var(--color-text)]">{value}</p>
      </div>
    </div>
  );
}

type StatusRowProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function StatusRow({ label, value, accent = false }: StatusRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-4 py-3">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">{label}</span>
      <span className={`text-sm font-bold ${accent ? "text-[var(--color-accent-blue)]" : "text-[var(--color-text)]"}`}>
        {value}
      </span>
    </div>
  );
}

type OverviewCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  theme?: "dark" | "light";
};

function OverviewCard({ icon, title, description, theme = "dark" }: OverviewCardProps) {
  const isDark = theme === "dark";
  return (
    <div
      className={`rounded-[1.5rem] p-4 ${isDark ? "border border-white/10 bg-white/5 backdrop-blur-sm" : "border border-[var(--color-border-sharp)] bg-[var(--color-bg)]"}`}
    >
      <div
        className={`mb-3 inline-flex rounded-2xl p-2 ${
          isDark
            ? "bg-white/10 text-blue-100"
            : "bg-[var(--color-accent-blue)]/10 text-[var(--color-accent-blue)]"
        }`}
      >
        {icon}
      </div>
      <h3
        className={`text-sm font-black uppercase tracking-[0.16em] ${
          isDark ? "text-white" : "text-[var(--color-text)]"
        }`}
      >
        {title}
      </h3>
      <p className={`mt-2 text-sm leading-6 ${isDark ? "text-slate-200" : "text-[var(--color-text-gray)]"}`}>
        {description}
      </p>
    </div>
  );
}

type AccountFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password";
};

function AccountField({ label, value, onChange, type = "text" }: AccountFieldProps) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-text-gray)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[1.25rem] border border-[var(--color-border-sharp)] bg-[var(--color-bg)] px-4 py-3 text-sm font-medium text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-gray)] focus:border-[var(--color-accent-blue)]"
      />
    </label>
  );
}
