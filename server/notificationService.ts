import { db } from "./db";
import { notifications, requestStatusEvents } from "@shared/schema";
import type { InsertNotification, InsertRequestStatusEvent } from "@shared/schema";

export class NotificationService {
  /**
   * Create a status event and return its ID for linking notifications
   */
  async createStatusEvent(event: Omit<InsertRequestStatusEvent, "eventId">): Promise<string> {
    const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(requestStatusEvents).values({
      eventId,
      ...event,
    });
    
    return eventId;
  }

  /**
   * Create a notification for a user
   */
  async createNotification(notification: Omit<InsertNotification, "notificationId">): Promise<void> {
    const notificationId = `NOT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(notifications).values({
      notificationId,
      ...notification,
    });
  }

  /**
   * Notify operator(s) about a new service request
   */
  async notifyOperatorsOfNewRequest(requestId: string, customerName: string, serviceType: string, operatorIds: string[]) {
    // Create status event
    const eventId = await this.createStatusEvent({
      requestId,
      actorRole: "customer",
      actorId: requestId, // Using request ID as customer may not be logged in
      actorName: customerName,
      fromStatus: null,
      toStatus: "pending",
      eventType: "request_created",
      metadata: { serviceType },
    });

    // Create notification for each operator (with error handling)
    const notificationPromises = operatorIds.map(operatorId =>
      this.createNotification({
        userId: operatorId,
        audienceRole: "operator",
        title: "New Service Request",
        body: `${customerName} requested ${serviceType}`,
        type: "request_update",
        requestId,
        statusEventId: eventId,
        metadata: { serviceType },
        deliveryState: "pending",
      }).catch(err => {
        console.error(`Failed to notify operator ${operatorId}:`, err);
        return null; // Continue even if one fails
      })
    );
    
    await Promise.all(notificationPromises);
  }

  /**
   * Notify customer about a new quote
   */
  async notifyCustomerOfQuote(requestId: string, customerId: string, operatorName: string, amount: string, quoteId: string) {
    // Create status event
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

    // Notify customer
    await this.createNotification({
      userId: customerId,
      audienceRole: "customer",
      title: "New Quote Received",
      body: `${operatorName} quoted $${amount} for your request`,
      type: "quote_received",
      requestId,
      statusEventId: eventId,
      metadata: { quoteId, amount, operatorName },
      deliveryState: "pending",
    });
  }

  /**
   * Notify operator about quote acceptance
   */
  async notifyOperatorOfQuoteAcceptance(requestId: string, operatorId: string, customerName: string, quoteId: string) {
    // Create status event
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

    // Notify operator
    await this.createNotification({
      userId: operatorId,
      audienceRole: "operator",
      title: "Quote Accepted!",
      body: `${customerName} accepted your quote`,
      type: "quote_accepted",
      requestId,
      statusEventId: eventId,
      metadata: { quoteId, customerName },
      deliveryState: "pending",
    });
  }

  /**
   * Notify customer when job starts
   */
  async notifyCustomerOfJobStart(requestId: string, customerId: string, operatorName: string, jobId: string) {
    // Create status event
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

    // Notify customer
    await this.createNotification({
      userId: customerId,
      audienceRole: "customer",
      title: "Job Started",
      body: `${operatorName} has started working on your request`,
      type: "job_started",
      requestId,
      statusEventId: eventId,
      metadata: { jobId, operatorName },
      deliveryState: "pending",
    });
  }

  /**
   * Notify customer when job is completed
   */
  async notifyCustomerOfJobCompletion(requestId: string, customerId: string, operatorName: string, jobId: string) {
    // Create status event
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

    // Notify customer
    await this.createNotification({
      userId: customerId,
      audienceRole: "customer",
      title: "Job Completed",
      body: `${operatorName} has completed your service request`,
      type: "job_completed",
      requestId,
      statusEventId: eventId,
      metadata: { jobId, operatorName },
      deliveryState: "pending",
    });
  }
}

// Singleton instance
export const notificationService = new NotificationService();
