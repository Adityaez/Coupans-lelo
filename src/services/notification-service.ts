import { prisma } from "@/lib/prisma";

type NotificationType =
  | "new_offer"
  | "counter_offer"
  | "offer_accepted"
  | "offer_rejected"
  | "offer_expired"
  | "offer_withdrawn";

interface NotifyParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
}

/**
 * Create an in-app notification for a user.
 * Email delivery via Resend can be layered on later by extending this function.
 */
export async function notifyUser(params: NotifyParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        href: params.href || null,
        read: false,
      },
    });
  } catch (error) {
    // Never fail the parent action because of a notification error
    console.error("[notification-service] Failed to create notification:", error);
  }

  // Email delivery via Resend — only if API key is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: params.userId },
        select: { email: true, name: true },
      });

      if (user?.email) {
        const { sendOfferEmail } = await import("./email-service");
        await sendOfferEmail({
          to: user.email,
          subject: params.title,
          body: params.body,
          href: params.href,
          recipientName: user.name || "there",
        });
      }
    } catch (error) {
      console.error("[notification-service] Failed to send email:", error);
    }
  }
}
