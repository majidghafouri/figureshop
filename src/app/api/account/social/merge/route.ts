import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { ok, fail, parseJson } from "@/lib/api";
import { getSessionUserFromRequest } from "@/lib/auth";

interface MergePayload {
  socialAccountId?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUserFromRequest(req);
  if (!user) {
    return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401 });
  }

  const body = parseJson<MergePayload>(await req.text());
  const socialAccountId = body?.socialAccountId?.trim();
  if (!socialAccountId) return fail("socialAccountId_required");

  const socialAccount = await prisma.socialAccount.findUnique({
    where: { id: socialAccountId },
    include: { user: true },
  });
  if (!socialAccount) return fail("social_account_not_found", 404);
  if (socialAccount.userId === user.id) return fail("already_own_this_account");

  const otherUser = socialAccount.user;

  await prisma.$transaction(async (tx) => {
    await tx.socialAccount.update({
      where: { id: socialAccountId },
      data: { userId: user.id },
    });

    await tx.order.updateMany({
      where: { userId: otherUser.id },
      data: { userId: user.id },
    });

    await tx.favorite.updateMany({
      where: { userId: otherUser.id },
      data: { userId: user.id },
    });

    const otherCoupons = await tx.coupon.findMany({
      where: { allowedUsers: { some: { id: otherUser.id } } },
    });
    for (const coupon of otherCoupons) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: { allowedUsers: { connect: { id: user.id } } },
      });
    }

    await tx.newsletterSubscriber.updateMany({
      where: { userId: otherUser.id },
      data: { userId: user.id },
    });

    const myCart = await tx.cart.findUnique({ where: { userId: user.id } });
    const otherCart = await tx.cart.findUnique({
      where: { userId: otherUser.id },
      include: { items: true },
    });

    if (otherCart) {
      if (myCart) {
        for (const item of otherCart.items) {
          const existing = await tx.cartItem.findFirst({
            where: { cartId: myCart.id, productId: item.productId },
          });
          if (existing) {
            await tx.cartItem.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + item.quantity },
            });
          } else {
            await tx.cartItem.create({
              data: { cartId: myCart.id, productId: item.productId, quantity: item.quantity },
            });
          }
        }
        await tx.cart.delete({ where: { id: otherCart.id } });
      } else {
        await tx.cart.update({
          where: { id: otherCart.id },
          data: { userId: user.id },
        });
      }
    }

    if (body?.name) {
      await tx.user.update({
        where: { id: user.id },
        data: { name: body.name },
      });
    }
    if (body?.email && !user.email) {
      const emailTaken = await tx.user.findUnique({ where: { email: body.email } });
      if (!emailTaken) {
        await tx.user.update({
          where: { id: user.id },
          data: { email: body.email, emailVerified: otherUser.emailVerified },
        });
      }
    }
    if (body?.phone && !user.phone) {
      const phoneTaken = await tx.user.findUnique({ where: { phone: body.phone } });
      if (!phoneTaken) {
        await tx.user.update({
          where: { id: user.id },
          data: { phone: body.phone, phoneVerified: otherUser.phoneVerified },
        });
      }
    }

    await tx.user.delete({ where: { id: otherUser.id } });
  });

  return ok({ merged: true });
}
