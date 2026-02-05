import Stripe from "stripe";
import { getBandPayoutSettings, upsertBandPayoutSettings, } from "./payouts.repo.js";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2023-10-16",
});
export async function createStripeConnectAccount(bandId, email) {
    // 1. Check if band already has an account
    const settings = await getBandPayoutSettings(bandId);
    if (settings?.stripe_connect_id) {
        return settings.stripe_connect_id;
    }
    // 2. Create a new Express account
    const account = await stripe.accounts.create({
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
export async function createOnboardingLink(bandId, accountId) {
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${process.env.FRONTEND_URL}/bands/${bandId}/events?stripe=refresh`,
        return_url: `${process.env.FRONTEND_URL}/bands/${bandId}/events?stripe=success`,
        type: "account_onboarding",
    });
    return accountLink.url;
}
export async function createTicketCheckoutSession(eventId, eventTitle, price, currency, connectedAccountId, userId) {
    const session = await stripe.checkout.sessions.create({
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
                quantity: 1,
            },
        ],
        mode: "payment",
        payment_intent_data: {
            application_fee_amount: 0, // In future: platform fee
            transfer_data: {
                destination: connectedAccountId,
            },
            metadata: {
                userId,
                eventId,
            },
        },
        success_url: `${process.env.FRONTEND_URL}/tickets?success=true`,
        cancel_url: `${process.env.FRONTEND_URL}/events/${eventId}?cancelled=true`,
    });
    return session;
}
