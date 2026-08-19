"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  type ShippingOption,
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
import { FREE_SHIPPING_MINIMUM } from "../../lib/store-config";

export default function CartPage() {
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<AccountAddress[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [shippingQuoteKey, setShippingQuoteKey] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
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
  const shippingRequestId = useRef(0);

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
      .catch(() => setMessage("Não foi possível carregar os produtos."))
      .finally(() => setProductsLoaded(true));

    apiFetch<User | null>("/auth/session")
      .then(async (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setAddresses([]);
          setShowAddressForm(true);
          if (requestedStep === "payment") {
            const validation = validateAddressProfile(restoredProfile);
            if (validation) returnDeliveryForCorrection(validation);
          }
          if (requestedStep === "confirmation") {
            setCart([]);
            writeCart([]);
          }
          return;
        }
        setUser(currentUser);
        const [account, addressResult] = await Promise.all([
          apiFetch<Partial<AccountProfile>>("/account"),
          apiFetch<AccountAddress[] | null>("/account/addresses"),
        ]);
        const addresses = Array.isArray(addressResult) ? addressResult : [];
        const address =
          addresses.find((item) => item.isDefault) || addresses[0];
        const accountProfile = {
          ...emptyDeliveryProfile,
          ...account,
          ...(address || {}),
          email: account.email || currentUser.email,
        };
        setAddresses(addresses);
        setAddressId(address?.id || null);
        setShowAddressForm(!address);
        setProfile(accountProfile);
        saveCheckoutProfile(accountProfile);
        if (requestedStep === "payment") {
          const validation = validateAddressProfile(accountProfile);
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
        setAddresses([]);
        setShowAddressForm(true);
        if (requestedStep === "payment") {
          const validation = validateAddressProfile(restoredProfile);
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

  const cartQuoteSignature = cart
    .map((item) => `${item.pid}-${item.qty}`)
    .sort()
    .join(",");

  const calculateShipping = useCallback(
    async (postalCode: string) => {
      const normalizedPostalCode = postalCode.replace(/\D/g, "");
      if (normalizedPostalCode.length !== 8 || !cart.length) return;

      const requestId = ++shippingRequestId.current;
      const quoteKey = `${normalizedPostalCode}:${cart
        .map((item) => `${item.pid}-${item.qty}`)
        .sort()
        .join(",")}`;

      setShippingLoading(true);
      setShippingOptions([]);
      setSelectedShipping(null);
      setShippingQuoteKey("");
      setMessage("");

      try {
        const options = await apiFetch<ShippingOption[]>(
          "/integrations/melhor-envio/quote",
          {
            method: "POST",
            body: JSON.stringify({
              postalCode: normalizedPostalCode,
              items: cart.map((item) => ({ pid: item.pid, qty: item.qty })),
            }),
          },
        );
        if (requestId !== shippingRequestId.current) return;
        if (!options.length) {
          throw new Error(
            "Nenhuma transportadora atende este CEP para os produtos selecionados.",
          );
        }
        setShippingOptions(options);
        setShippingQuoteKey(quoteKey);
        setMessage("Selecione uma opção de entrega para continuar.");
      } catch (error) {
        if (requestId !== shippingRequestId.current) return;
        setMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível calcular o frete para este CEP.",
        );
      } finally {
        if (requestId === shippingRequestId.current) {
          setShippingLoading(false);
        }
      }
    },
    [cart],
  );

  useEffect(() => {
    const postalCode = profile.cep.replace(/\D/g, "");
    if (step !== "delivery" || postalCode.length !== 8 || !cart.length) {
      if (postalCode.length !== 8) {
        shippingRequestId.current += 1;
        setShippingOptions([]);
        setSelectedShipping(null);
        setShippingQuoteKey("");
        setShippingLoading(false);
      }
      return;
    }

    const quoteKey = `${postalCode}:${cartQuoteSignature}`;
    if (quoteKey === shippingQuoteKey && shippingOptions.length) return;

    const timer = window.setTimeout(
      () => void calculateShipping(postalCode),
      350,
    );
    return () => window.clearTimeout(timer);
  }, [
    calculateShipping,
    cart.length,
    cartQuoteSignature,
    profile.cep,
    shippingOptions.length,
    shippingQuoteKey,
    step,
  ]);

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
  // O Pix não reduz a base do frete; preços promocionais, conjuntos e cupons reduzem.
  const freeShipping = totals.freeShippingSubtotal >= FREE_SHIPPING_MINIMUM;
  const shippingPrice = selectedShipping
    ? freeShipping
      ? 0
      : selectedShipping.price
    : 0;
  const totalWithShipping =
    displayedTotal + (step === "cart" ? 0 : shippingPrice);

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
          entry.color === item.color &&
          entry.bundle === item.bundle
            ? { ...entry, qty: Math.min(10, entry.qty + delta) }
            : entry,
        )
        .filter((entry) => entry.qty > 0),
    );
  }

  async function applyCoupon() {
    try {
      const code = couponCode.trim().toUpperCase();
      if (code.startsWith('WB-')) {
        const credit = await apiFetch<{
          code: string;
          value: number;
          balance: number;
          expiresAt: number;
          type: 'store_credit';
        }>(`/credits/${encodeURIComponent(code)}`);
        setCoupon(credit);
        setMessage(`Crédito ${credit.code} aplicado.`);
      } else {
        const applied = await apiFetch<{ code: string; pct: number }>(
          `/coupons/${encodeURIComponent(code)}`,
        );
        setCoupon({ ...applied, type: 'coupon' });
        setMessage(`Cupom ${applied.code} aplicado.`);
      }
    } catch (error) {
      setCoupon(null);
      setMessage(error instanceof Error ? error.message : "Cupom inválido.");
    }
  }

  async function saveDelivery() {
    const validation = validateAddressProfile(profile);
    if (validation) return setMessage(validation);

    setBusy(true);
    setMessage("");
    try {
      saveCheckoutProfile(profile);
      if (user) {
        const currentAddress = addresses.find(
          (address) => address.id === addressId,
        );
        const addressPayload = {
          ...(!addressId ? { label: "Principal" } : {}),
          cep: profile.cep,
          street: profile.street,
          neighborhood: profile.neighborhood,
          number: profile.number,
          reference: profile.reference,
          city: profile.city,
          state: profile.state,
          isDefault: currentAddress?.isDefault || addresses.length === 0,
        };
        let savedAddress = currentAddress;
        if (showAddressForm || !savedAddress) {
          savedAddress = await apiFetch<AccountAddress>(
            addressId
              ? `/account/addresses/${addressId}`
              : "/account/addresses",
            {
              method: addressId ? "PATCH" : "POST",
              body: JSON.stringify(addressPayload),
            },
          );
          setAddresses((current) => {
            const exists = current.some(
              (address) => address.id === savedAddress?.id,
            );
            return exists
              ? current.map((address) =>
                  address.id === savedAddress?.id ? savedAddress! : address,
                )
              : [...current, savedAddress!];
          });
          setAddressId(savedAddress.id);
        }
        const savedProfile = { ...profile, ...savedAddress };
        setProfile(savedProfile);
        saveCheckoutProfile(savedProfile);
        setShowAddressForm(false);
      }
      const nextQuoteKey = `${profile.cep.replace(/\D/g, "")}:${cart
        .map((item) => `${item.pid}-${item.qty}`)
        .sort()
        .join(",")}`;
      if (shippingLoading) {
        setMessage("Aguarde enquanto calculamos o frete.");
        return;
      }
      if (shippingQuoteKey !== nextQuoteKey || !shippingOptions.length) {
        await calculateShipping(profile.cep);
        return;
      }
      if (!selectedShipping) {
        setMessage("Selecione uma opção de entrega para continuar.");
        return;
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
          : "Não foi possível salvar o endereço.",
      );
    } finally {
      setShippingLoading(false);
      setBusy(false);
    }
  }

  async function checkout() {
    if (busy || !totals.lines.length) return;
    const addressValidation = validateAddressProfile(profile);
    if (addressValidation) {
      returnDeliveryForCorrection(addressValidation);
      return;
    }
    const buyerValidation = validateBuyerProfile(profile);
    if (buyerValidation) return setMessage(buyerValidation);
    setBusy(true);
    setMessage("");
    try {
      if (user) {
        const saved = await apiFetch<Partial<AccountProfile>>("/account", {
          method: "PATCH",
          body: JSON.stringify({
            name: profile.name,
            taxId: profile.taxId,
            phone: profile.phone,
          }),
        });
        const savedProfile = { ...profile, ...saved };
        setProfile(savedProfile);
        saveCheckoutProfile(savedProfile);
      }
      let paymentCard: ReturnType<typeof prepareCard> | undefined;
      if (method === "Cartão de crédito") {
        paymentCard = prepareCard(card);
      }
      const response = await apiFetch<TransparentPaymentResponse>(
        "/payment/checkout",
        {
          method: "POST",
          body: JSON.stringify({
            items: cart,
            method,
            coupon: coupon?.type === 'coupon' ? coupon.code : undefined,
            creditCode:
              coupon?.type === 'store_credit' ? coupon.code : undefined,
            customer: profile,
            card: paymentCard,
            installments: card.installments,
            existingOrderId: pixPayment?.orderId,
            shippingQuoteToken: selectedShipping?.quoteToken,
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
        throw new Error(response.message || "Pagamento não autorizado.");
      }
      setCard(emptyCardPaymentForm);
      finishOnSiteCheckout(response.number);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível processar o pagamento.",
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

  function selectDeliveryAddress(address: AccountAddress) {
    setAddressId(address.id);
    setShowAddressForm(false);
    setMessage("");
    setProfile((current) => {
      const updated = { ...current, ...address };
      saveCheckoutProfile(updated);
      return updated;
    });
  }

  function startNewDeliveryAddress() {
    setAddressId(null);
    setShowAddressForm(true);
    setMessage("");
    setProfile((current) => {
      const updated = {
        ...current,
        cep: "",
        street: "",
        neighborhood: "",
        number: "",
        reference: "",
        city: "",
        state: "",
      };
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
        label={
          shippingLoading
            ? "Calculando frete..."
            : shippingOptions.length
              ? selectedShipping
                ? "Continuar para pagamento"
                : "Selecione uma entrega"
              : "Calcular frete"
        }
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
          <Link href="/" className="flex cursor-pointer flex-col leading-[.82]">
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
            <h1 className="text-3xl">Seu carrinho está vazio</h1>
            <p className="mt-3 text-bubble-ink/60">
              Escolha suas peças e volte aqui para finalizar.
            </p>
            <Link
              href="/#coleção"
              className="mt-6 inline-flex bg-bubble-ink px-6 py-3 font-sans text-[.72rem] font-semibold uppercase tracking-[.1em] text-bubble-white"
            >
              Ver coleção
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
                addresses={addresses}
                selectedAddressId={addressId}
                showAddressForm={showAddressForm}
                shippingOptions={shippingOptions}
                selectedShippingToken={selectedShipping?.quoteToken || null}
                shippingLoading={shippingLoading}
                freeShipping={freeShipping}
                profile={profile}
                message={message}
                onProfile={updateProfile}
                onSelectAddress={selectDeliveryAddress}
                onAddAddress={startNewDeliveryAddress}
                onSelectShipping={(option) => {
                  setSelectedShipping(option);
                  setMessage("");
                }}
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
                user={user}
                profile={profile}
                onMethod={(nextMethod) => {
                  setMethod(nextMethod);
                  setMessage("");
                }}
                onCard={(patch) =>
                  setCard((current) => ({ ...current, ...patch }))
                }
                onProfile={updateProfile}
                onBack={() => goToStep("delivery")}
              />
            ) : null}
            <OrderSummary
              subtotal={totals.subtotal}
              bundleDiscount={totals.bundleDiscount}
              couponDiscount={totals.couponDiscount}
              pixDiscount={step === "payment" ? totals.pixDiscount : 0}
              total={totalWithShipping}
              freeShipping={freeShipping}
              shippingPrice={
                selectedShipping
                  ? freeShipping
                    ? 0
                    : selectedShipping.price
                  : null
              }
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

function validateAddressProfile(profile: DeliveryProfile) {
  const missing = [
    ["CEP", profile.cep],
    ["rua", profile.street],
    ["número", profile.number],
    ["cidade", profile.city],
    ["estado", profile.state],
  ].find(([, value]) => !String(value).trim());
  if (missing) return `Informe ${missing[0]} para continuar.`;
  if (profile.cep.replace(/\D/g, "").length !== 8)
    return "Informe um CEP com 8 dígitos.";
  if (!/^[A-Z]{2}$/.test(profile.state))
    return "Informe a UF do estado com 2 letras.";
  return "";
}

function validateBuyerProfile(profile: DeliveryProfile) {
  const missing = [
    ["nome", profile.name],
    ["e-mail", profile.email],
    ["CPF", profile.taxId],
  ].find(([, value]) => !String(value).trim());
  if (missing) return `Informe ${missing[0]} para continuar.`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()))
    return "Informe um e-mail válido para continuar.";
  if (!isValidCpf(profile.taxId))
    return "Informe um CPF válido para o pagamento.";
  const phoneDigits = profile.phone.replace(/\D/g, "");
  if (phoneDigits && ![10, 11].includes(phoneDigits.length))
    return "Informe um telefone com DDD válido.";
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

function prepareCard(card: CardPaymentForm) {
  const number = card.number.replace(/\D/g, "");
  const [month, shortYear] = card.expiry.split("/");
  if (card.holder.trim().split(/\s+/).length < 2)
    throw new Error("Informe o nome completo impresso no cartão.");
  if (number.length < 14 || number.length > 19)
    throw new Error("Informe um número de cartão válido.");
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry))
    throw new Error("Informe a validade no formato MM/AA.");
  if (!/^\d{3,4}$/.test(card.securityCode))
    throw new Error("Informe um CVV válido.");

  return {
    holderName: card.holder.trim(),
    number,
    expiryMonth: month,
    expiryYear: `20${shortYear}`,
    ccv: card.securityCode,
  };
}
