/**
 * Unit Tests for Order Expiration System
 * 
 * Run with: npm test
 */

import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { describe, test, expect, afterEach } from "@jest/globals";

describe("Order Expiration - Basic Operations", () => {
  afterEach(async () => {
    // Clean up test data after each test
    const db = admin.firestore();
    const snapshot = await db.collection("orders")
      .where("orderNumber", "==", "TST")
      .get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  });

  test("should create and read test order", async () => {
    const db = admin.firestore();
    const orderRef = db.collection("orders").doc("test-order-123");

    await orderRef.set({
      orderNumber: "TST",
      status: "declined",
      expireAt: Timestamp.fromMillis(Date.now() - 60000),
      cartId: "test-cart",
      createdAt: Timestamp.now(),
    });

    const check = await orderRef.get();
    expect(check.exists).toBe(true);
    expect(check.data()?.status).toBe("declined");
    expect(check.data()?.orderNumber).toBe("TST");
  });

  test("should handle timestamp operations", async () => {
    const db = admin.firestore();
    const orderRef = db.collection("orders").doc("test-timestamp");

    const pastTime = Timestamp.fromMillis(Date.now() - 60000);
    const futureTime = Timestamp.fromMillis(Date.now() + 60000);

    await orderRef.set({
      orderNumber: "TST",
      status: "declined",
      expireAt: pastTime,
      cartId: "test-cart",
      createdAt: futureTime,
    });

    const check = await orderRef.get();
    expect(check.data()?.expireAt.toMillis()).toBeLessThan(Date.now());
    expect(check.data()?.createdAt.toMillis()).toBeGreaterThan(Date.now());
  });

  test("should update order status", async () => {
    const db = admin.firestore();
    const orderRef = db.collection("orders").doc("test-update");

    await orderRef.set({
      orderNumber: "TST",
      status: "declined",
      cartId: "test-cart",
      createdAt: Timestamp.now(),
    });

    await orderRef.update({ status: "completed" });

    const check = await orderRef.get();
    expect(check.data()?.status).toBe("completed");
  });
});
