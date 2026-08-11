"use client";

import {
  ArrowLeft,
  ChevronRight,
  LogOut,
  MapPin,
  PackageCheck,
  RotateCcw,
  Save,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  apiFetch,
  money,
  type AccountProfile,
  type Order,
  type ReturnRequest,
  type StoreCredit,
  type User,
} from "../../lib/api";
import {
  formatCpf,
  formatPersonName,
  formatPhone,
} from "../../lib/input-formatters";
import { AddressesPanel } from "./panels/AddressesPanel";
import { ReturnsPanel } from "./panels/ReturnsPanel";

type AccountTab = "orders" | "returns" | "profile" | "addresses";

const emptyProfile: AccountProfile = {
  uid: "",
  name: "",
  email: "",
  taxId: "",
  phone: "",
};

const inputClass =
  "w-full border border-bubble-line bg-bubble-cream px-3.5 py-3 text-[.86rem] outline-none transition-colors focus:border-bubble-ink focus:bg-bubble-white disabled:cursor-not-allowed disabled:opacity-60";
const labelClass =
  "mb-1.5 block font-sans text-[.64rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/55";

export function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AccountProfile>(emptyProfile);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [credits, setCredits] = useState<StoreCredit[]>([]);
  const [tab, setTab] = useState<AccountTab>("orders");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<"success" | "error">(
    "success",
  );

  useEffect(() => {
    void loadAccount();
  }, []);

  async function loadAccount() {
    const params = new URLSearchParams(window.location.search);
    const requestedTab = accountTabFromParam(params.get("tab"));
    const intent = params.get("intent");
    if (requestedTab) setTab(requestedTab);

    setLoading(true);
    setLoadError("");
    let currentUser: User | null;

    try {
      currentUser = await apiFetch<User | null>("/auth/session");
    } catch {
      setLoadError(
        "Não foi possível validar sua sessão agora. Verifique sua conexão e tente novamente.",
      );
      setLoading(false);
      return;
    }

    if (!currentUser) {
      window.location.replace(intent === "rastreio" ? "/cadastro" : "/login");
      return;
    }

    setUser(currentUser);
    setProfile({
      ...emptyProfile,
      uid: currentUser.uid,
      name: currentUser.name || "",
      email: currentUser.email,
    });

    try {
      const [accountResult, ordersResult, returnsResult, creditsResult] =
        await Promise.allSettled([
        apiFetch<Partial<AccountProfile>>("/account"),
        apiFetch<Order[] | null>("/orders/mine"),
        apiFetch<ReturnRequest[]>("/returns/mine"),
        apiFetch<StoreCredit[]>("/returns/credits/mine"),
      ]);

      if (accountResult.status === "fulfilled") {
        const account = accountResult.value;
        setProfile({
          ...emptyProfile,
          ...account,
          uid: account.uid || currentUser.uid,
          name: account.name || currentUser.name || "",
          email: account.email || currentUser.email,
        });
      }

      if (ordersResult.status === "fulfilled") {
        setOrders(Array.isArray(ordersResult.value) ? ordersResult.value : []);
      }
      if (returnsResult.status === "fulfilled") setReturns(returnsResult.value);
      if (creditsResult.status === "fulfilled") setCredits(creditsResult.value);

      if (
        accountResult.status === "rejected" ||
        ordersResult.status === "rejected" ||
        returnsResult.status === "rejected" ||
        creditsResult.status === "rejected"
      ) {
        setLoadError(
          "Sua sessão está ativa, mas alguns dados da conta não puderam ser carregados. Tente novamente.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await apiFetch<AccountProfile>("/account", {
        method: "PATCH",
        body: JSON.stringify({
          ...(profile.name ? { name: profile.name } : {}),
          ...(profile.taxId ? { taxId: profile.taxId } : {}),
          phone: profile.phone,
        }),
      });
      setProfile((current) => ({ ...current, ...updated }));
      showMessage("Seus dados foram atualizados.", "success");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar seus dados.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    window.location.replace("/");
  }

  async function deleteAccount() {
    if (
      !window.confirm(
        "Excluir sua conta e seus dados pessoais? Esta ação não pode ser desfeita.",
      )
    )
      return;
    try {
      const result = await apiFetch<{ protocol: string }>("/account/delete", {
        method: "POST",
      });
      window.alert(`Conta excluída. Protocolo: ${result.protocol}`);
      window.location.replace("/");
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a conta.",
        "error",
      );
    }
  }

  function showMessage(value: string, kind: "success" | "error") {
    setMessage(value);
    setMessageKind(kind);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bubble-cream">
        <span className="font-sans text-[.72rem] font-semibold uppercase tracking-[.18em] text-bubble-ink/55">
          Carregando sua conta...
        </span>
      </main>
    );
  }

  if (!user) {
    return loadError ? (
      <main className="flex min-h-screen items-center justify-center bg-bubble-cream px-6 text-bubble-ink">
        <div className="max-w-lg border border-bubble-ink bg-bubble-white p-8 text-center">
          <h1 className="text-2xl">Não foi possível abrir sua conta</h1>
          <p className="mt-3 text-sm leading-6 text-bubble-ink/65">{loadError}</p>
          <button
            type="button"
            onClick={() => void loadAccount()}
            className="mt-6 border border-bubble-ink bg-bubble-ink px-5 py-3 font-sans text-[.66rem] font-semibold uppercase tracking-[.1em] text-bubble-white"
          >
            Tentar novamente
          </button>
        </div>
      </main>
    ) : null;
  }

  const displayName = profile.name || user.name || user.email;
  const initial = displayName.charAt(0).toUpperCase() || "U";

  return (
    <main className="min-h-screen bg-bubble-cream text-bubble-ink">
      <header className="border-b border-bubble-ink bg-bubble-cream">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
          <Link href="/" className="flex cursor-pointer flex-col leading-[.82]">
            <span className="ml-px font-serif text-[.74rem] italic">wear</span>
            <span className="font-display text-[1.35rem] uppercase">
              BUBBLE
            </span>
          </Link>
          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-sans text-[.68rem] font-semibold uppercase tracking-[.1em] text-bubble-ink/60 hover:text-bubble-ink"
            >
              <ArrowLeft className="size-4" /> Voltar para a loja
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 border-0 bg-transparent font-sans text-[.68rem] font-semibold uppercase tracking-[.1em]"
              onClick={() => void logout()}
            >
              <LogOut className="size-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-6 py-12">
        <span className="font-sans text-[.66rem] font-semibold uppercase tracking-[.28em] text-bubble-brown">
          Área do cliente
        </span>
        <h1 className="mt-2 text-[clamp(2.4rem,6vw,4.5rem)] leading-none">
          Minha conta
        </h1>

        {loadError ? (
          <div className="mt-6 flex flex-col gap-3 border border-bubble-danger/30 bg-bubble-danger/[.06] p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => void loadAccount()}
              className="shrink-0 font-sans text-[.62rem] font-bold uppercase tracking-[.1em] underline underline-offset-4"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        <div className="mt-10 grid grid-cols-[280px_minmax(0,1fr)] gap-8 max-[820px]:grid-cols-1">
          <aside>
            <div className="border border-bubble-ink bg-bubble-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-bubble-ink font-display text-xl text-bubble-white">
                  {initial}
                </div>
                <div className="min-w-0">
                  <strong className="block truncate text-[.88rem]">
                    {displayName}
                  </strong>
                  <span className="block truncate text-[.68rem] text-bubble-ink/55">
                    {user.email}
                  </span>
                </div>
              </div>
              <div className="mt-5 border-t border-bubble-line pt-3">
                <AccountNavButton
                  active={tab === "returns"}
                  icon={<RotateCcw />}
                  label="Trocas e devoluções"
                  onClick={() => setTab("returns")}
                />
                <AccountNavButton
                  active={tab === "orders"}
                  icon={<ShoppingBag />}
                  label="Meus pedidos"
                  onClick={() => setTab("orders")}
                />
                <AccountNavButton
                  active={tab === "profile"}
                  icon={<UserRound />}
                  label="Meus dados"
                  onClick={() => setTab("profile")}
                />
                <AccountNavButton
                  active={tab === "addresses"}
                  icon={<MapPin />}
                  label="Endereços"
                  onClick={() => setTab("addresses")}
                />
              </div>
              {user.role === "manager" ? (
                <Link
                  href="/?admin=1"
                  className="mt-4 flex items-center justify-between bg-bubble-ink px-4 py-3 font-sans text-[.66rem] font-semibold uppercase tracking-[.1em] text-bubble-white"
                >
                  Painel do gerente <ChevronRight className="size-4" />
                </Link>
              ) : null}
            </div>
            <div className="mt-4 flex gap-3 border border-bubble-success/25 bg-bubble-success/[.08] p-4 text-[.68rem] leading-[1.55] text-bubble-success">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" />
              Seus dados pessoais ficam separados do histórico comercial.
            </div>
          </aside>

          <section>
            {tab === "orders" ? <OrdersPanel orders={orders} /> : null}
            {tab === "returns" ? (
              <ReturnsPanel
                orders={orders}
                requests={returns}
                credits={credits}
                onChanged={loadAccount}
              />
            ) : null}
            {tab === "addresses" ? <AddressesPanel /> : null}
            {tab === "profile" ? (
              <form
                className="border border-bubble-ink bg-bubble-white p-7 max-[620px]:p-5"
                onSubmit={saveProfile}
              >
                <div className="mb-7 flex items-center justify-between gap-4 border-b border-bubble-line pb-5">
                  <div>
                    <h2 className="text-2xl">Informações pessoais</h2>
                    <p className="mt-1 text-[.72rem] text-bubble-ink/55">
                      Mantenha seus dados pessoais atualizados.
                    </p>
                  </div>
                  <UserRound className="size-6 text-bubble-ink/35" />
                </div>

                <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">
                  <AccountField label="Nome completo">
                    <input
                      className={inputClass}
                      value={profile.name}
                      onChange={(event) =>
                        setProfile({
                          ...profile,
                          name: formatPersonName(event.target.value),
                        })
                      }
                      autoComplete="name"
                      maxLength={150}
                    />
                  </AccountField>
                  <AccountField label="E-mail">
                    <input
                      className={inputClass}
                      value={profile.email}
                      disabled
                    />
                  </AccountField>
                  <AccountField label="CPF">
                    <input
                      className={inputClass}
                      value={profile.taxId}
                      onChange={(event) =>
                        setProfile({
                          ...profile,
                          taxId: formatCpf(event.target.value),
                        })
                      }
                      inputMode="numeric"
                      maxLength={14}
                      placeholder="000.000.000-00"
                    />
                  </AccountField>
                  <AccountField label="Telefone">
                    <input
                      className={inputClass}
                      value={profile.phone}
                      onChange={(event) =>
                        setProfile({
                          ...profile,
                          phone: formatPhone(event.target.value),
                        })
                      }
                      type="tel"
                      autoComplete="tel"
                      maxLength={15}
                      placeholder="(11) 99999-9999"
                    />
                  </AccountField>
                </div>

                {message ? (
                  <p
                    className={`mt-5 text-[.74rem] ${
                      messageKind === "success"
                        ? "text-bubble-success"
                        : "text-bubble-danger"
                    }`}
                  >
                    {message}
                  </p>
                ) : null}

                <div className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-bubble-line pt-5">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 border-0 bg-transparent text-[.68rem] text-bubble-danger underline"
                    onClick={() => void deleteAccount()}
                  >
                    <Trash2 className="size-4" /> Excluir minha conta
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-bubble-ink px-6 py-3.5 font-sans text-[.7rem] font-semibold uppercase tracking-[.12em] text-bubble-white disabled:opacity-50"
                  >
                    <Save className="size-4" />
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}

function OrdersPanel({ orders }: { orders: Order[] }) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const statusLabel: Record<Order["status"], string> = {
    pending: "Aguardando pagamento",
    paid: "Pagamento confirmado",
    canceled: "Cancelado",
  };

  return (
    <div className="border border-bubble-ink bg-bubble-white p-7 max-[620px]:p-5">
      <div className="mb-7 flex items-center justify-between border-b border-bubble-line pb-5">
        <div>
          <h2 className="text-2xl">Meus pedidos</h2>
          <p className="mt-1 text-[.72rem] text-bubble-ink/55">
            Acompanhe pagamentos, preparação e entrega.
          </p>
        </div>
        <span className="font-display text-3xl">{safeOrders.length}</span>
      </div>

      {safeOrders.length ? (
        <div className="space-y-4">
          {safeOrders.map((order) => (
            <article
              key={order.id}
              className="border border-bubble-line bg-bubble-cream p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="font-sans text-[.6rem] font-semibold uppercase tracking-[.12em] text-bubble-ink/45">
                    Pedido
                  </span>
                  <h3 className="mt-0.5 text-lg">#{order.number}</h3>
                  <span className="text-[.68rem] text-bubble-ink/50">
                    {new Date(order.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <span
                  className={`px-3 py-1.5 font-sans text-[.62rem] font-semibold uppercase tracking-[.08em] ${
                    order.status === "paid"
                      ? "bg-bubble-success/10 text-bubble-success"
                      : order.status === "pending"
                        ? "bg-[#fff1c7] text-[#7a5500]"
                        : "bg-bubble-danger/10 text-bubble-danger"
                  }`}
                >
                  {statusLabel[order.status]}
                </span>
              </div>

              <div className="my-4 border-y border-bubble-line py-3">
                {order.items.map((item) => (
                  <div
                    className="flex justify-between gap-4 py-1 text-[.72rem]"
                    key={`${item.pid}-${item.color || "legacy"}-${item.size}`}
                  >
                    <span>
                      {item.qty}x {item.name}
                      {item.color ? ` · Cor ${item.color}` : ""} · Tam.{" "}
                      {item.size}
                    </span>
                    <span>{money.format(item.price * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="text-[.68rem] text-bubble-ink/55">
                  <span className="flex items-center gap-1.5">
                    <PackageCheck className="size-4" />
                    Etapa de envio {order.shipStage || 0} de 5
                  </span>
                  {order.tracking ? (
                    <span className="mt-1 flex items-center gap-1.5">
                      <MapPin className="size-4" />
                      Rastreio: {order.tracking}
                    </span>
                  ) : null}
                </div>
                <div className="text-right">
                  <span className="block text-[.62rem] uppercase tracking-[.08em] text-bubble-ink/45">
                    Total · {order.method}
                  </span>
                  <strong className="text-lg">
                    {money.format(order.total)}
                  </strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center px-4 py-16 text-center">
          <ShoppingBag className="size-9 text-bubble-ink/25" />
          <h3 className="mt-4 text-xl">Nenhum pedido ainda</h3>
          <p className="mt-2 max-w-[360px] text-[.76rem] leading-[1.6] text-bubble-ink/50">
            Quando você fizer uma compra, o acompanhamento aparecerá aqui.
          </p>
          <Link
            href="/#coleção"
            className="mt-6 bg-bubble-ink px-6 py-3.5 font-sans text-[.68rem] font-semibold uppercase tracking-[.12em] text-bubble-white"
          >
            Conhecer a coleção
          </Link>
        </div>
      )}
    </div>
  );
}

function AccountNavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-3 px-3 py-3 font-sans text-[.68rem] font-semibold uppercase tracking-[.08em] ${
        active
          ? "bg-bubble-ink text-bubble-white"
          : "bg-transparent text-bubble-ink hover:bg-bubble-cream"
      }`}
      onClick={onClick}
    >
      <span className="[&_svg]:size-4">{icon}</span>
      {label}
      <ChevronRight className="ml-auto size-4" />
    </button>
  );
}

function accountTabFromParam(value: string | null): AccountTab | null {
  if (
    value === "orders" ||
    value === "returns" ||
    value === "profile" ||
    value === "addresses"
  ) {
    return value;
  }
  return null;
}

function AccountField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>
      {children}
      {hint ? (
        <span
          className={`mt-1.5 block text-[.64rem] ${
            hint.startsWith("Não") || hint.includes("não encontrado")
              ? "text-bubble-danger"
              : "text-bubble-success"
          }`}
        >
          {hint}
        </span>
      ) : null}
    </label>
  );
}
