import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth";

// Hardcoded promo codes always count as 100% free access
const HARDCODED_COUPONS = ["NAVIGATE2026", "WELCOME2026", "HAR60", "FAMILY50"];

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthenticatedUser(req);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();
    let isHardcoded = false;
    let dbCoupon = null;

    if (HARDCODED_COUPONS.includes(normalizedCode)) {
      isHardcoded = true;
    } else {
      dbCoupon = await prisma.coupon.findUnique({
        where: { code: normalizedCode },
      });
    }

    // Check if code exists/is active
    if (!isHardcoded && (!dbCoupon || !dbCoupon.isActive)) {
      return NextResponse.json({ error: "Invalid or expired coupon code" }, { status: 400 });
    }

    // Verify if it grants 100% free access
    // Non-100% coupons must be used at app store checkout instead of direct database upgrades
    if (!isHardcoded && dbCoupon) {
      const isPercent100 = dbCoupon.discountType === "PERCENT" && dbCoupon.discountValue === 100;
      
      if (!isPercent100) {
        const discountText =
          dbCoupon.discountType === "PERCENT"
            ? `${dbCoupon.discountValue}%`
            : `$${dbCoupon.discountValue.toFixed(2)}`;

        return NextResponse.json(
          {
            error: `This coupon code provides a ${discountText} discount. It cannot be redeemed for direct free access. Please enter this code during checkout on the mobile App Store.`,
          },
          { status: 400 }
        );
      }
    }

    // Upgrade user to SUBSCRIBED (100% discount applied)
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: { subscriptionStatus: "SUBSCRIBED" },
    });

    return NextResponse.json({
      success: true,
      message: "Coupon redeemed successfully! Unlimited access unlocked.",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        subscriptionStatus: updatedUser.subscriptionStatus,
      },
    });
  } catch (error: any) {
    console.error("Coupon redemption error:", error);
    return NextResponse.json(
      { error: "Failed to redeem coupon: " + error.message },
      { status: 500 }
    );
  }
}
