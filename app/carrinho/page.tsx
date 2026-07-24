"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartStep } from "../../components/checkout/CartStep";
import { CheckoutStepper } from "../../components/checkout/CheckoutStepper";
import { ConfirmationStep } from "../../components/checkout/ConfirmationStep";
import { DeliveryStep } from "../../components/checkout/DeliveryStep";
import { OrderSummary } from "../../components/checkout/OrderSummary";
import { PaymentStep } from "../../components/checkout/PaymentStep";
import {
  emptyCardPaymentForm,
  emptyDeliveryProfile,
  type CardPaymentForm,
  type CheckoutStep,
  type DeliveryProfile,
  type PixPayment,
} from "../../components/checkout/checkout.types";
import {
  Order,
  Product,
  User,
  apiFetch,
  type AccountAddress,
  type AccountProfile,
} from "../../lib/api";
import {
  calculateCart,
  readCart,
  writeCart,
  type AppliedCoupon,
  type CartItem,
  type PaymentMethod,
} from "../../lib/cart";

export default function CartPage() {
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [profile, setProfile] = useState<DeliveryProfile>(emptyDeliveryProfile);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon>(null);
  const [method, setMethod] = useState<PaymentMethod>("Pix");
  const [card, setCard] = useState<CardPaymentForm>(emptyCardPaymentForm);
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedStep = params.get("etapa");
    if (isCheckoutStep(requestedStep)) setStep(requestedStep);
    setConfirmationNumber(params.get("pedido") || "");
    const savedProfile = readCheckoutProfile();
    const checkoutEmail = window.sessionStorage.getItem(
      "bubble_checkout_email",
    );
    const restoredProfile = {
      ...emptyDeliveryProfile,
      ...savedProfile,
      ...(checkoutEmail ? { email: checkoutEmail } : {}),
    };
    setProfile(restoredProfile);

    setCart(readCart());
    setCartHydrated(true);
    apiFetch<Product[]>("/products")
      .then(setProducts)
      .catch(() => setMessage("Nao foi possivel carregar os produtos."))
      .finally(() => setProductsLoaded(true));

    apiFetch<User | null>("/auth/session")
      .then(async (currentUser) => {
        if (!currentUser) {
          setUser(null);
          if (requestedStep === "payment") {
            const validation = validateDeliveryProfile(restoredProfile);
            if (validation) returnDeliveryForCorrection(validation);
          }
          if (requestedStep === "confirmation") {
            setCart([]);
            writeCart([]);
          }
          return;
        }
        setUser(currentUser);
        const [account, addresses] = await Promise.all([
          apiFetch<Partial<AccountProfile>>("/account"),
          apiFetch<AccountAddress[]>("/account/addresses"),
        ]);
        const address =
          addresses.find((item) => item.isDefault) || addresses[0];
        const accountProfile = {
          ...emptyDeliveryProfile,
          ...account,
          ...(address || {}),
          email: account.email || currentUser.email,
        };
        setAddressId(address?.id || null);
        setProfile(accountProfile);
        saveCheckoutProfile(accountProfile);
        if (requestedStep === "payment") {
          const validation = validateDeliveryProfile(accountProfile);
          if (validation) returnDeliveryForCorrection(validation);
        }
        if (requestedStep === "confirmation") {
          const orders = await apiFetch<Order[]>("/orders/mine");
          const number = params.get("pedido");
          setOrder(
            orders.find((item) => item.number === number) || orders[0] || null,
          );
          setCart([]);
          writeCart([]);
        }
      })
      .catch(() => {
        setUser(null);
        if (requestedStep === "payment") {
          const validation = validateDeliveryProfile(restoredProfile);
          if (validation) returnDeliveryForCorrection(validation);
        }
        if (requestedStep === "confirmation") {
          setCart([]);
          writeCart([]);
        }
      });
  }, []);

  useEffect(() => {
    if (cartHydrated) writeCart(cart);
  }, [cart, cartHydrated]);

  useEffect(() => {
    if (!pixPayment) return;
    const checkStatus = async () => {
      try {
        const status = await apiFetch<{
          status: Order["status"];
          number: string;
        }>(`/payment/status/${pixPayment.orderId}`);
        if (status.status === "paid") finishOnSiteCheckout(status.number);
        if (status.status === "canceled")
          setMessage("O pagamento Pix foi cancelado.");
      } catch {
        // A proxima consulta tenta novamente sem interromper o QR Code.
      }
    };
    const timer = window.setInterval(() => void checkStatus(), 5000);
    void checkStatus();
    return () => window.clearInterval(timer);
  }, [pixPayment]);

  const totals = calculateCart(cart, products, coupon, method);
  const ready = cartHydrated && productsLoaded;
  const displayedTotal =
    step === "payment" ? totals.total : totals.total + totals.pixDiscount;

  function goToStep(nextStep: CheckoutStep) {
    setMessage("");
    setStep(nextStep);
    const url =
      nextStep === "cart" ? "/carrinho" : `/carrinho?etapa=${nextStep}`;
    window.history.replaceState({}, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function changeQty(item: CartItem, delta: number) {
    setCart((current) =>
      current
        .map((entry) =>
          entry.pid === item.pid &&
          entry.size === item.size &&
          entry.bundle === item.bundle
            ? { ...entry, qty: Math.min(10, entry.qty + delta) }
            : entry,
        )
        .filter((entry) => entry.qty > 0),
    );
  }

  async function applyCoupon() {
    try {
      const applied = await apiFetch<{ code: string; pct: number }>(
        `/coupons/${encodeURIComponent(couponCode)}`,
      );
      setCoupon(applied);
      setMessage(`Cupom ${applied.code} aplicado.`);
    } catch (error) {
      setCoupon(null);
      setMessage(error instanceof Error ? error.message : "Cupom invalido.");
    }
  }

  async function saveDelivery() {
    const validation = validateDeliveryProfile(profile);
    if (validation) return setMessage(validation);

    setBusy(true);
    setMessage("");
    try {
      saveCheckoutProfile(profile);
      if (user) {
        const saved = await apiFetch<Partial<AccountProfile>>("/account", {
          method: "PATCH",
          body: JSON.stringify({
            name: profile.name,
            taxId: profile.taxId,
            phone: profile.phone,
          }),
        });
        const addressPayload = {
          ...(!addressId ? { label: "Principal" } : {}),
          cep: profile.cep,
          street: profile.street,
          neighborhood: profile.neighborhood,
          number: profile.number,
          reference: profile.reference,
          city: profile.city,
          state: profile.state,
          isDefault: true,
        };
        const savedAddress = await apiFetch<AccountAddress>(
          addressId ? `/account/addresses/${addressId}` : "/account/addresses",
          {
            method: addressId ? "PATCH" : "POST",
            body: JSON.stringify(addressPayload),
          },
        );
        setAddressId(savedAddress.id);
        const savedProfile = { ...profile, ...saved, ...savedAddress };
        setProfile(savedProfile);
        saveCheckoutProfile(savedProfile);
      }
      goToStep("payment");
    } catch (error) {
      if (
        user &&
        error instanceof Error &&
        error.message.toLowerCase().includes("login")
      ) {
        setUser(null);
        goToStep("payment");
        return;
      }
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o endereco.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    if (busy || !totals.lines.length) return;
    const validation = validateDeliveryProfile(profile);
    if (validation) {
      returnDeliveryForCorrection(validation);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      let encryptedCard: string | undefined;
      if (method === "Cartao de credito") {
        encryptedCard = await encryptCard(card);
      }
      const response = await apiFetch<TransparentPaymentResponse>(
        "/payment/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            items: cart,
            method,
            coupon: coupon?.code,
            customer: profile,
            encryptedCard,
            installments: card.installments,
            existingOrderId: pixPayment?.orderId,
          }),
        },
      );
      window.sessionStorage.setItem("bubble_checkout_email", profile.email);
      if ("pix" in response) {
        setPixPayment(response);
        setBusy(false);
        return;
      }
      if (
        ["DECLINED", "CANCELED", "CANCELLED"].includes(response.paymentStatus)
      ) {
        throw new Error(response.message || "Pagamento nao autorizado.");
      }
      setCard(emptyCardPaymentForm);
      finishOnSiteCheckout(response.number);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel processar o pagamento.",
      );
      setBusy(false);
    }
  }

  function finishOnSiteCheckout(number: string) {
    setConfirmationNumber(number);
    setPixPayment(null);
    setCart([]);
    writeCart([]);
    setStep("confirmation");
    window.history.replaceState(
      {},
      "",
      `/carrinho?etapa=confirmation&pedido=${encodeURIComponent(number)}`,
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
    setBusy(false);
  }

  function updateProfile(patch: Partial<DeliveryProfile>) {
    setProfile((current) => {
      const updated = { ...current, ...patch };
      saveCheckoutProfile(updated);
      return updated;
    });
  }

  function returnDeliveryForCorrection(reason: string) {
    setStep("delivery");
    setMessage(`${reason} Revise os dados de entrega antes de pagar.`);
    window.history.replaceState({}, "", "/carrinho?etapa=delivery");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const summaryAction =
    step === "cart" ? (
      <ActionButton
        label="Continuar para entrega"
        onClick={() => goToStep("delivery")}
      />
    ) : step === "delivery" ? (
      <ActionButton
        label={busy ? "Salvando..." : "Continuar para pagamento"}
        onClick={saveDelivery}
        disabled={busy}
      />
    ) : (
      <ActionButton
        label={
          pixPayment && method === "Pix"
            ? "Pix gerado · aguardando pagamento"
            : busy
              ? "Processando..."
              : method === "Pix"
                ? "Gerar QR Code Pix"
                : "Pagar agora"
        }
        onClick={checkout}
        disabled={busy || Boolean(pixPayment && method === "Pix")}
      />
    );

  return (
    <main className="min-h-screen bg-bubble-cream text-bubble-ink">
      <header className="border-b border-bubble-ink bg-bubble-white">
        <div className="mx-auto grid max-w-[1400px] grid-cols-[180px_1fr_180px] items-center gap-6 px-8 py-5 max-[760px]:grid-cols-[1fr_auto]">
          <Link href="/" className="flex flex-col leading-[.82]">
            <span className="ml-px font-serif text-[.74rem] italic">wear</span>
            <span className="font-display text-[1.35rem] uppercase">
              BUBBLE
            </span>
          </Link>
          <div className="max-[760px]:order-3 max-[760px]:col-span-2 max-[760px]:w-full">
            <CheckoutStepper current={step} />
          </div>
          <span className="text-right font-sans text-[.64rem] font-semibold uppercase tracking-[.08em] text-bubble-ink/55">
            Ambiente seguro
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[1170px] px-8 py-12">
        {!ready && step !== "confirmation" ? (
          <div className="py-20 text-center text-bubble-ink/50">
            Carregando carrinho...
          </div>
        ) : null}

        {ready && !totals.lines.length && step !== "confirmation" ? (
          <div className="border border-bubble-line bg-bubble-white px-8 py-20 text-center">
            <h1 className="text-3xl">Seu carrinho esta vazio</h1>
            <p className="mt-3 text-bubble-ink/60">
              Escolha suas pecas e volte aqui para finalizar.
            </p>
            <Link
              href="/#colecao"
              className="mt-6 inline-flex bg-bubble-ink px-6 py-3 font-sans text-[.72rem] font-semibold uppercase tracking-[.1em] text-bubble-white"
            >
              Ver colecao
            </Link>
          </div>
        ) : null}

        {step === "confirmation" ? (
          <ConfirmationStep
            order={order}
            orderNumber={confirmationNumber}
            email={profile.email}
          />
        ) : null}

        {ready && totals.lines.length && step !== "confirmation" ? (
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(320px,.72fr)] items-start gap-8 max-[900px]:grid-cols-1">
            {step === "cart" ? (
              <CartStep
                lines={totals.lines}
                couponCode={couponCode}
                coupon={coupon}
                message={message}
                onCouponCode={setCouponCode}
                onApplyCoupon={applyCoupon}
                onRemoveCoupon={() => {
                  setCoupon(null);
                  setMessage("");
                }}
                onQty={changeQty}
              />
            ) : null}
            {step === "delivery" ? (
              <DeliveryStep
                user={user}
                profile={profile}
                message={message}
                onProfile={updateProfile}
                onBack={() => goToStep("cart")}
              />
            ) : null}
            {step === "payment" ? (
              <PaymentStep
                method={method}
                message={message}
                total={totals.total}
                card={card}
                pix={pixPayment}
                onMethod={(nextMethod) => {
                  setMethod(nextMethod);
                  setMessage("");
                }}
                onCard={(patch) =>
                  setCard((current) => ({ ...current, ...patch }))
                }
                onBack={() => goToStep("delivery")}
              />
            ) : null}
            <OrderSummary
              subtotal={totals.subtotal}
              bundleDiscount={totals.bundleDiscount}
              couponDiscount={totals.couponDiscount}
              pixDiscount={step === "payment" ? totals.pixDiscount : 0}
              total={displayedTotal}
              freeShipping={displayedTotal >= 299}
              coupon={coupon}
              action={summaryAction}
            />
          </div>
        ) : null}

        {step !== "confirmation" ? (
          <Link
            href="/"
            className="mx-auto mt-8 block w-fit font-sans text-[.7rem] font-semibold uppercase tracking-[.1em] underline"
          >
            Buscar mais produtos
          </Link>
        ) : null}
      </div>
    </main>
  );
}

function ActionButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className="w-full bg-bubble-ink px-6 py-4 font-sans text-[.76rem] font-semibold uppercase tracking-[.1em] text-bubble-white disabled:cursor-not-allowed disabled:opacity-45"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function isCheckoutStep(value: string | null): value is CheckoutStep {
  return (
    value === "cart" ||
    value === "delivery" ||
    value === "payment" ||
    value === "confirmation"
  );
}

function isValidCpf(value: string) {
  const cpf = value.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length: number) => {
    const sum = cpf
      .slice(0, length)
      .split("")
      .reduce(
        (total, number, index) => total + Number(number) * (length + 1 - index),
        0,
      );
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function validateDeliveryProfile(profile: DeliveryProfile) {
  const missing = [
    ["nome", profile.name],
    ["e-mail", profile.email],
    ["CPF", profile.taxId],
    ["CEP", profile.cep],
    ["rua", profile.street],
    ["numero", profile.number],
    ["cidade", profile.city],
    ["estado", profile.state],
  ].find(([, value]) => !String(value).trim());
  if (missing) return `Informe ${missing[0]} para continuar.`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
    return "Informe um e-mail valido para continuar.";
  if (!isValidCpf(profile.taxId))
    return "Informe um CPF valido para o pagamento.";
  if (profile.cep.replace(/\D/g, "").length !== 8)
    return "Informe um CEP com 8 digitos.";
  const phoneDigits = profile.phone.replace(/\D/g, "");
  if (phoneDigits && ![10, 11].includes(phoneDigits.length))
    return "Informe um telefone com DDD valido.";
  if (!/^[A-Z]{2}$/.test(profile.state))
    return "Informe a UF do estado com 2 letras.";
  return "";
}

function readCheckoutProfile(): Partial<DeliveryProfile> {
  try {
    const saved = window.sessionStorage.getItem("bubble_checkout_profile");
    return saved ? (JSON.parse(saved) as Partial<DeliveryProfile>) : {};
  } catch {
    return {};
  }
}

function saveCheckoutProfile(profile: DeliveryProfile) {
  window.sessionStorage.setItem(
    "bubble_checkout_profile",
    JSON.stringify(profile),
  );
}

type TransparentPaymentResponse =
  | {
      orderId: string;
      number: string;
      total: number;
      paymentStatus: string;
      message?: string;
    }
  | PixPayment;

async function encryptCard(card: CardPaymentForm) {
  const number = card.number.replace(/\D/g, "");
  const [month, shortYear] = card.expiry.split("/");
  if (card.holder.trim().split(/\s+/).length < 2)
    throw new Error("Informe o nome completo impresso no cartao.");
  if (number.length < 14 || number.length > 19)
    throw new Error("Informe um numero de cartao valido.");
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry))
    throw new Error("Informe a validade no formato MM/AA.");
  if (!/^\d{3,4}$/.test(card.securityCode))
    throw new Error("Informe um CVV valido.");

  const key = await apiFetch<{ publicKey: string }>("/payment/public-key");
  if (!window.PagSeguro?.encryptCard)
    throw new Error(
      "O modulo seguro do PagBank ainda esta carregando. Tente novamente.",
    );
  const encrypted = window.PagSeguro.encryptCard({
    publicKey: key.publicKey,
    holder: card.holder.trim(),
    number,
    expMonth: month,
    expYear: `20${shortYear}`,
    securityCode: card.securityCode,
  });
  if (encrypted.hasErrors || !encrypted.encryptedCard) {
    const message = encrypted.errors?.[0]?.message;
    throw new Error(message || "Confira os dados do cartao.");
  }
  return encrypted.encryptedCard;
}

declare global {
  interface Window {
    PagSeguro?: {
      encryptCard(data: {
        publicKey: string;
        holder: string;
        number: string;
        expMonth: string;
        expYear: string;
        securityCode: string;
      }): {
        encryptedCard?: string;
        hasErrors: boolean;
        errors?: Array<{ code?: string; message?: string }>;
      };
    };
  }
}
