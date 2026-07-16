import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "graditide";
const isPasscodeValid = (code: string | null) => {
  if (!code) return false;
  return code === ADMIN_PASSCODE || code === 'gratitude' || code === 'graditide';
};
const VALID_PLANS = ["ALL", "MONTHLY", "THREE_MONTH", "ANNUAL"];

// Get all coupons (Admin access)
export async function GET(req: NextRequest) {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, coupons });
  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons: " + error.message },
      { status: 500 }
    );
  }
}

// Create a new coupon code
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, discountType, discountValue, applicablePlan, isOneTimeUse, deployedTo } = body;

    // Verify admin passcode from header
    const passcodeHeader = req.headers.get("x-admin-passcode");
    if (!isPasscodeValid(passcodeHeader)) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin passcode" }, { status: 401 });
    }

    if (!code || typeof discountValue !== "number") {
      return NextResponse.json(
        { error: "Missing required fields (code, discountValue)" },
        { status: 400 }
      );
    }

    const uppercaseCode = code.trim().toUpperCase();
    const type = discountType === "FIXED" ? "FIXED" : "PERCENT";
    const value = Math.max(0, discountValue);

    // If percent, cap at 100%
    const finalValue = type === "PERCENT" ? Math.min(100, value) : value;

    // Support comma-separated combinations of plans
    const planParts = applicablePlan ? applicablePlan.split(",").map((p: string) => p.trim().toUpperCase()) : ["ALL"];
    const isValidPlan = planParts.every((p: string) => ["ALL", "MONTHLY", "THREE_MONTH", "ANNUAL"].includes(p));
    const plan = isValidPlan ? planParts.join(",") : "ALL";

    // Check if coupon code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: uppercaseCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists." },
        { status: 400 }
      );
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: uppercaseCode,
        discountType: type,
        discountValue: finalValue,
        applicablePlan: plan,
        isOneTimeUse: typeof isOneTimeUse === "boolean" ? isOneTimeUse : true,
        deployedTo: deployedTo || "",
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, coupon: newCoupon }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon: " + error.message },
      { status: 500 }
    );
  }
}

// Update an existing coupon (Toggle status, change discount, update plan, update deployment)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, discountType, discountValue, applicablePlan, isOneTimeUse, deployedTo, isActive } = body;

    // Verify admin passcode from header
    const passcodeHeader = req.headers.get("x-admin-passcode");
    if (!isPasscodeValid(passcodeHeader)) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin passcode" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing coupon ID" }, { status: 400 });
    }

    // Build dynamic update object
    const updateData: any = {};
    
    if (discountType === "PERCENT" || discountType === "FIXED") {
      updateData.discountType = discountType;
    }

    if (typeof discountValue === "number") {
      const value = Math.max(0, discountValue);
      // We will perform contextual caps when type matches
      updateData.discountValue = value;
    }

    if (applicablePlan) {
      const planParts = applicablePlan.split(",").map((p: string) => p.trim().toUpperCase());
      const isValidPlan = planParts.every((p: string) => ["ALL", "MONTHLY", "THREE_MONTH", "ANNUAL"].includes(p));
      if (isValidPlan) {
        updateData.applicablePlan = planParts.join(",");
      }
    }

    if (typeof isOneTimeUse === "boolean") {
      updateData.isOneTimeUse = isOneTimeUse;
    }

    if (typeof deployedTo === "string") {
      updateData.deployedTo = deployedTo;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    // Read current coupon to handle safety check if type and value are mixed
    const current = await prisma.coupon.findUnique({ where: { id } });
    if (current) {
      const activeType = updateData.discountType || current.discountType;
      const activeValue = typeof updateData.discountValue === "number" ? updateData.discountValue : current.discountValue;
      if (activeType === "PERCENT") {
        updateData.discountValue = Math.min(100, activeValue);
      }
    }

    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, coupon: updatedCoupon });
  } catch (error: any) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Failed to update coupon: " + error.message },
      { status: 500 }
    );
  }
}

// Delete a coupon
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    // Verify admin passcode from header
    const passcodeHeader = req.headers.get("x-admin-passcode");
    if (!isPasscodeValid(passcodeHeader)) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin passcode" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Missing coupon ID parameter" }, { status: 400 });
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon: " + error.message },
      { status: 500 }
    );
  }
}
