import { db } from "./db";
import { notifications, requestStatusEvents, operators, customers, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export class NotificationService {
  /**
   * Helper to get userId from operatorId
   */
  async getUserIdFromOperatorId(operatorId: string): Promise<string | null> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.operatorId, operatorId),
      });
      return user?.userId || null;
    } catch (error) {
      console.error(`Failed to get userId for operator ${operatorId}:`, error);
      return null;
    }
  }

  /**
   * Helper to get userId from customerId by looking up customer email then user
   */
  async getUserIdFromCustomerId(customerId: string): Promise<string | null> {
    try {
      // First, get the customer record to find their email
      const customer = await db.query.customers.findFirst({
        where: eq(customers.customerId, customerId),
      });
      if (!customer) {
        console.warn(`Customer ${customerId} not found`);
        return null;
      }
      
      // Then, find the user with the same email
      const user = await db.query.users.findFirst({
        where: eq(users.email, customer.email),
      });
      return user?.userId || null;
    } catch (error) {
      console.error(`Failed to get userId for customer ${customerId}:`, error);
      return null;
    }
  }

  /**
   * Create a status event and return its ID for linking notifications
   */
  async createStatusEvent(params: {
    requestId: string;
    actorRole: string;
    actorId: string;
    actorName: string;
    fromStatus: string | null;
    toStatus: string;
    eventType: string;
    metadata?: Record<string, unknown>;
  }): Promise<string> {
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(requestStatusEvents).values({
      eventId,
      requestId: params.requestId,
      actorRole: params.actorRole,
      actorId: params.actorId,
      actorName: params.actorName,
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      eventType: params.eventType,
      metadata: params.metadata,
    });
    
    return eventId;
  }

  /**
   * Create a notification for a user
   */
  async createNotification(params: {
    userId: string;
    audienceRole: string;
    title: string;
    body: string;
    type: string;
    requestId?: string;
    statusEventId?: string;
    metadata?: Record<string, unknown>;
    deliveryState?: string;
  }): Promise<void> {
    const notificationId = `NOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(notifications).values({
      notificationId,
      userId: params.userId,
      audienceRole: params.audienceRole,
      title: params.title,
      body: params.body,
      type: params.type,
      requestId: params.requestId,
      statusEventId: params.statusEventId,
      metadata: params.metadata,
      deliveryState: params.deliveryState || "pending",
    });
  }

  /**
   * Notify operator(s) about a new service request
   * @param operatorIds - Array of operatorId values (OP-xxx format)
   */
  async notifyOperatorsOfNewRequest(requestId: string, customerName: string, serviceType: string, operatorIds: string[]) {
    const eventId = await this.createStatusEvent({
      requestId,
      actorRole: "customer",
      actorId: requestId,
      actorName: customerName,
      fromStatus: null,
      toStatus: "pending",
      eventType: "request_created",
      metadata: { serviceType },
    });

    const notificationPromises = operatorIds.map(async (operatorId) => {
      try {
        const userId = await this.getUserIdFromOperatorId(operatorId);
        if (!userId) {
          console.warn(`No userId found for operator ${operatorId}, skipping notification`);
          return null;
        }

        await this.createNotification({
          userId,
          audienceRole: "operator",
          title: "New Service Request",
          body: `${customerName} requested ${serviceType}`,
          type: "request_update",
          requestId,
          statusEventId: eventId,
          metadata: { serviceType, operatorId },
          deliveryState: "pending",
        });
      } catch (err) {
        console.error(`Failed to notify operator ${operatorId}:`, err);
        return null;
      }
    });
    
    await Promise.all(notificationPromises);
  }

  /**
   * Notify customer about a new quote
   * @param customerId - The customerId (CUST-xxx format)
   */
  async notifyCustomerOfQuote(requestId: string, customerId: string, operatorName: string, amount: string, quoteId: string) {
    const eventId = await this.createStatusEvent({
      requestId,
      actorRole: "operator",
      actorId: quoteId,
      actorName: operatorName,
      fromStatus: "pending",
      toStatus: "quoted",
      eventType: "quote_submitted",
      metadata: { quoteId, amount },
    });

    const userId = await this.getUserIdFromCustomerId(customerId);
    if (!userId) {
      console.error(`No userId found for customer ${customerId}, cannot send quote notification`);
      return;
    }

    await this.createNotification({
      userId,
      audienceRole: "customer",
      title: "New Quote Received",
      body: `${operatorName} quoted $${amount} for your request`,
      type: "quote_received",
      requestId,
      statusEventId: eventId,
      metadata: { quoteId, amount, operatorName, customerId },
      deliveryState: "pending",
    });
  }

  /**
   * Notify operator about quote acceptance
   * @param operatorId - The operatorId (OP-xxx format)
   */
  async notifyOperatorOfQuoteAcceptance(requestId: string, operatorId: string, customerName: string, quoteId: string) {
    const eventId = await this.createStatusEvent({
      requestId,
      actorRole: "customer",
      actorId: requestId,
      actorName: customerName,
      fromStatus: "quoted",
      toStatus: "accepted",
      eventType: "quote_accepted",
      metadata: { quoteId },
    });

    const userId = await this.getUserIdFromOperatorId(operatorId);
    if (!userId) {
      console.error(`No userId found for operator ${operatorId}, cannot send acceptance notification`);
      return;
    }

    await this.createNotification({
      userId,
      audienceRole: "operator",
      title: "Quote Accepted!",
      body: `${customerName} accepted your quote`,
      type: "quote_accepted",
      requestId,
      statusEventId: eventId,
      metadata: { quoteId, customerName, operatorId },
      deliveryState: "pending",
    });
  }

  /**
   * Notify operator about quote decline
   * @param operatorId - The operatorId (OP-xxx format)
   */
  async notifyOperatorOfQuoteDecline(requestId: string, operatorId: string, customerName: string, quoteId: string) {
    const eventId = await this.createStatusEvent({
      requestId,
      actorRole: "customer",
      actorId: requestId,
      actorName: customerName,
      fromStatus: "quoted",
      toStatus: "declined",
      eventType: "quote_declined",
      metadata: { quoteId },
    });

    const userId = await this.getUserIdFromOperatorId(operatorId);
    if (!userId) {
      console.error(`No userId found for operator ${operatorId}, cannot send decline notification`);
      return;
    }

    await this.createNotification({
      userId,
      audienceRole: "operator",
      title: "Quote Declined",
      body: `${customerName} declined your quote`,
      type: "quote_declined",
      requestId,
      statusEventId: eventId,
      metadata: { quoteId, customerName, operatorId },
      deliveryState: "pending",
    });
  }

  /**
   * Notify customer when job starts
   * @param customerId - The customerId (CUST-xxx format)
   */
  async notifyCustomerOfJobStart(requestId: string, customerId: string, operatorName: string, jobId: string) {
    const eventId = await this.createStatusEvent({
      requestId,
      actorRole: "operator",
      actorId: jobId,
      actorName: operatorName,
      fromStatus: "accepted",
      toStatus: "in_progress",
      eventType: "job_started",
      metadata: { jobId },
    });

    const userId = await this.getUserIdFromCustomerId(customerId);
    if (!userId) {
      console.error(`No userId found for customer ${customerId}, cannot send job start notification`);
      return;
    }

    await this.createNotification({
      userId,
      audienceRole: "customer",
      title: "Job Started",
      body: `${operatorName} has started working on your request`,
      type: "job_started",
      requestId,
      statusEventId: eventId,
      metadata: { jobId, operatorName, customerId },
      deliveryState: "pending",
    });
  }

  /**
   * Notify customer when job is completed
   * @param customerId - The customerId (CUST-xxx format)
   */
  async notifyCustomerOfJobCompletion(requestId: string, customerId: string, operatorName: string, jobId: string) {
    const eventId = await this.createStatusEvent({
      requestId,
      actorRole: "operator",
      actorId: jobId,
      actorName: operatorName,
      fromStatus: "in_progress",
      toStatus: "completed",
      eventType: "job_completed",
      metadata: { jobId },
    });

    const userId = await this.getUserIdFromCustomerId(customerId);
    if (!userId) {
      console.error(`No userId found for customer ${customerId}, cannot send job completion notification`);
      return;
    }

    await this.createNotification({
      userId,
      audienceRole: "customer",
      title: "Job Completed",
      body: `${operatorName} has completed your service request`,
      type: "job_completed",
      requestId,
      statusEventId: eventId,
      metadata: { jobId, operatorName, customerId },
      deliveryState: "pending",
    });
  }

  /**
   * Notify customer about request cancellation by operator
   * @param customerId - The customerId (CUST-xxx format)
   */
  async notifyCustomerOfCancellation(requestId: string, customerId: string, operatorName: string, reason?: string) {
    const eventId = await this.createStatusEvent({
      requestId,
      actorRole: "operator",
      actorId: requestId,
      actorName: operatorName,
      fromStatus: null,
      toStatus: "cancelled",
      eventType: "request_cancelled",
      metadata: { reason },
    });

    const userId = await this.getUserIdFromCustomerId(customerId);
    if (!userId) {
      console.error(`No userId found for customer ${customerId}, cannot send cancellation notification`);
      return;
    }

    await this.createNotification({
      userId,
      audienceRole: "customer",
      title: "Request Cancelled",
      body: reason ? `${operatorName} cancelled: ${reason}` : `${operatorName} cancelled your request`,
      type: "request_cancelled",
      requestId,
      statusEventId: eventId,
      metadata: { operatorName, reason, customerId },
      deliveryState: "pending",
    });
  }

  /**
   * Notify operator about request cancellation by customer
   * @param operatorId - The operatorId (OP-xxx format)
   */
  async notifyOperatorOfCancellation(requestId: string, operatorId: string, customerName: string, reason?: string, feeCents?: number) {
    const eventId = await this.createStatusEvent({
      requestId,
      actorRole: "customer",
      actorId: requestId,
      actorName: customerName,
      fromStatus: null,
      toStatus: "cancelled",
      eventType: "request_cancelled",
      metadata: { reason, feeCents },
    });

    const userId = await this.getUserIdFromOperatorId(operatorId);
    if (!userId) {
      console.error(`No userId found for operator ${operatorId}, cannot send cancellation notification`);
      return;
    }

    const feeMessage = feeCents ? ` (${(feeCents / 100).toFixed(2)} cancellation fee)` : '';
    await this.createNotification({
      userId,
      audienceRole: "operator",
      title: "Request Cancelled",
      body: `${customerName} cancelled the request${feeMessage}`,
      type: "request_cancelled",
      requestId,
      statusEventId: eventId,
      metadata: { customerName, reason, feeCents, operatorId },
      deliveryState: "pending",
    });
  }
}

export const notificationService = new NotificationService();
