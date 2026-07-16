import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, plan } = body; // plan is optional, e.g. "MONTHLY", "THREE_MONTH", "ANNUAL"

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: "This coupon code does not exist." },
        { status: 404 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { success: false, error: "This coupon code is no longer active." },
        { status: 400 }
      );
    }

    // Check if the coupon is restricted to specific plans
    if (coupon.applicablePlan && coupon.applicablePlan !== "ALL") {
      const allowedPlans = coupon.applicablePlan.split(",").map(p => p.trim().toUpperCase());
      if (!plan) {
        return NextResponse.json(
          {
            success: false,
            error: `This coupon code is only applicable to the following plans: ${allowedPlans.map(formatPlanName).join(", ")}.`,
          },
          { status: 400 }
        );
      }

      if (!allowedPlans.includes(plan.trim().toUpperCase())) {
        return NextResponse.json(
          {
            success: false,
            error: `This coupon code is not valid for this plan. It is only valid for the ${allowedPlans.map(formatPlanName).join(", ")} plan(s).`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      applicablePlan: coupon.applicablePlan,
      isOneTimeUse: coupon.isOneTimeUse,
    });
  } catch (error: any) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Failed to validate coupon: " + error.message },
      { status: 500 }
    );
  }
}

function formatPlanName(plan: string) {
  switch (plan) {
    case "MONTHLY":
      return "Monthly ($19.99/mo)";
    case "THREE_MONTH":
      return "3-Month IEP Season ($49.99)";
    case "ANNUAL":
      return "Annual ($149.99/yr)";
    default:
      return plan;
  }
}
