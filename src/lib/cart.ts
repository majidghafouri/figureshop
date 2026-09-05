import { randomUUID } from "crypto";
import prisma from "@/lib/db";
import { Locale } from "@/lib/i18n";
import { mapProduct } from "@/lib/shop";

export type CartInput = { token: string | null; userId: string | null };

export async function findCart({ token, userId }: CartInput) {
  if (userId) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) return cart;
  }
  if (token) {
    const cart = await prisma.cart.findUnique({ where: { token } });
    if (cart) return cart;
  }
  return null;
}

export async function getOrCreateCart({ token, userId }: CartInput) {
  const existing = await findCart({ token, userId });
  if (existing) return { cart: existing, newToken: null };

  const newToken = token ?? randomUUID();
  const cart = await prisma.cart.create({
    data: {
      token: userId ? null : newToken,
      userId: userId ?? null,
    },
  });
  return { cart, newToken };
}

export async function getCartItems(cartId: string, locale: Locale) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: {
        include: {
          translations: { where: { locale } },
          category: { include: { translations: { where: { locale } } } },
        },
      },
    },
  });
  return items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: mapProduct(item.product),
  }));
}

export async function addToCart(input: CartInput, productId: string, quantity: number, locale: Locale) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive || product.isDeactivated) return { error: "Product not found" as const };
  if (product.stock < quantity) return { error: "Not enough stock" as const };

  const { cart, newToken } = await getOrCreateCart(input);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });
  if (existing) {
    const q = Math.min(existing.quantity + quantity, product.stock);
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: q } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
  }
  const items = await getCartItems(cart.id, locale);
  return { error: null as null, items, newToken };
}

export async function updateCartItem(input: CartInput, itemId: string, quantity: number, locale: Locale) {
  const cart = await findCart(input);
  if (!cart) return { error: "Cart not found" as const };
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
  if (!item) return { error: "Item not found" as const };
  const product = await prisma.product.findUnique({ where: { id: item.productId } });
  const maxQty = Math.max(1, Math.min(quantity, product?.stock ?? quantity));
  await prisma.cartItem.update({ where: { id: item.id }, data: { quantity: maxQty } });
  const items = await getCartItems(cart.id, locale);
  return { error: null as null, items };
}

export async function removeCartItem(input: CartInput, itemId: string, locale: Locale) {
  const cart = await findCart(input);
  if (!cart) return { error: "Cart not found" as const };
  await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  const items = await getCartItems(cart.id, locale);
  return { error: null as null, items };
}

export async function clearCart(input: CartInput) {
  const cart = await findCart(input);
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
}

export async function mergeGuestCart(userId: string, token: string | null) {
  if (!token) return;
  const guest = await prisma.cart.findUnique({ where: { token } });
  if (!guest) return;
  const userCart = await prisma.cart.findUnique({ where: { userId } });

  const guestItems = await prisma.cartItem.findMany({
    where: { cartId: guest.id },
    include: { product: true },
  });

  if (userCart) {
    for (const gi of guestItems) {
      const existing = await prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: userCart.id, productId: gi.productId } },
      });
      const stock = gi.product.stock;
      if (existing) {
        await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(existing.quantity + gi.quantity, stock) },
        });
      } else {
        await prisma.cartItem.create({
          data: { cartId: userCart.id, productId: gi.productId, quantity: gi.quantity },
        });
      }
    }
    await prisma.cart.delete({ where: { id: guest.id } });
  } else {
    await prisma.cart.update({
      where: { id: guest.id },
      data: { token: null, userId },
    });
  }
}
