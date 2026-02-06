import Stripe from "stripe";
import {
  getBandPayoutSettings,
  upsertBandPayoutSettings,
} from "./payouts.repo.js";

let stripeInstance: Stripe | null = null;

function getStripe() {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error(
        "STRIPE_SECRET_KEY is not defined in environment variables",
      );
    }
    stripeInstance = new Stripe(key, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeInstance;
}

export async function createStripeConnectAccount(
  bandId: string,
  email?: string,
) {
  // 1. Check if band already has an account
  const settings = await getBandPayoutSettings(bandId);
  if (settings?.stripe_connect_id) {
    return settings.stripe_connect_id;
  }

  // 2. Create a new Express account
  const account = await getStripe().accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  // 3. Save to database
  await upsertBandPayoutSettings(bandId, {
    stripe_connect_id: account.id,
    payout_status: "pending",
  });

  return account.id;
}

export async function createOnboardingLink(bandId: string, accountId: string) {
  const accountLink = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.FRONTEND_URL}/bands/${bandId}/events?stripe=refresh`,
    return_url: `${process.env.FRONTEND_URL}/bands/${bandId}/events?stripe=success`,
    type: "account_onboarding",
  });

  return accountLink.url;
}

export async function createTicketCheckoutSession(
  eventId: string,
  eventTitle: string,
  price: number,
  currency: string,
  connectedAccountId: string,
  userId: string,
  quantity = 1,
) {
  const session = await getStripe().checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: `Ticket for ${eventTitle}`,
          },
          unit_amount: Math.round(price * 100), // Stripe expects cents
        },
        quantity,
      },
    ],
    mode: "payment",
    metadata: {
      userId,
      eventId,
    },
    payment_intent_data: {
      application_fee_amount: 0, // In future: platform fee
      transfer_data: {
        destination: connectedAccountId,
      },
    },
    success_url: `${process.env.FRONTEND_URL}/tickets?success=true`,
    cancel_url: `${process.env.FRONTEND_URL}/events/${eventId}?cancelled=true`,
  });

  return session;
}
