/**
 * Weather Sync Job - Automatically fetches and updates weather alerts
 * Runs on server startup and periodically to keep alerts current
 */

import { db } from "../db";
import { weatherAlerts } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { getServiceRelevantAlerts } from "../services/weatherService";

export async function syncWeatherAlerts(area: string = "US"): Promise<void> {
  try {
    console.log(`[Weather Sync] Starting weather alert sync for area: ${area}...`);
    
    // Fetch latest alerts from NWS
    const alerts = await getServiceRelevantAlerts(area);
    const allRelevantAlerts = [...alerts.winterAlerts, ...alerts.stormAlerts];
    
    if (allRelevantAlerts.length === 0) {
      console.log("[Weather Sync] No severe weather alerts found");
      // Still deactivate expired alerts
      await db.update(weatherAlerts)
        .set({ isActive: 0 })
        .where(sql`${weatherAlerts.expires} < NOW() AND ${weatherAlerts.isActive} = 1`);
      return;
    }
    
    // Update database with new alerts
    let newAlerts = 0;
    for (const alert of allRelevantAlerts) {
      const existingAlert = await db.query.weatherAlerts.findFirst({
        where: eq(weatherAlerts.alertId, alert.id)
      });
      
      if (!existingAlert) {
        // Insert new alert
        await db.insert(weatherAlerts).values({
          alertId: alert.id,
          event: alert.event,
          headline: alert.headline,
          description: alert.description,
          severity: alert.severity,
          urgency: alert.urgency,
          areaDesc: alert.areaDesc,
          effective: new Date(alert.effective),
          expires: new Date(alert.expires),
          instruction: alert.instruction,
          category: alert.category,
          isActive: 1,
        });
        newAlerts++;
      }
    }
    
    // Deactivate expired alerts
    await db.update(weatherAlerts)
      .set({ isActive: 0 })
      .where(sql`${weatherAlerts.expires} < NOW() AND ${weatherAlerts.isActive} = 1`);
    
    console.log(`[Weather Sync] Completed. New alerts: ${newAlerts}, Total relevant: ${allRelevantAlerts.length}`);
    console.log(`[Weather Sync] Winter alerts: ${alerts.winterAlerts.length}, Storm alerts: ${alerts.stormAlerts.length}`);
  } catch (error) {
    console.error("[Weather Sync] Error syncing weather alerts:", error);
  }
}

/**
 * Start weather sync job - runs on startup and every hour
 */
export function startWeatherSyncJob(): void {
  // Run immediately on startup
  console.log("[Weather Sync] Starting initial weather sync...");
  syncWeatherAlerts().catch(err => {
    console.error("[Weather Sync] Initial sync failed:", err);
  });
  
  // Run every hour (3600000 ms)
  const SYNC_INTERVAL = 60 * 60 * 1000;
  setInterval(() => {
    console.log("[Weather Sync] Running scheduled weather sync...");
    syncWeatherAlerts().catch(err => {
      console.error("[Weather Sync] Scheduled sync failed:", err);
    });
  }, SYNC_INTERVAL);
  
  console.log("[Weather Sync] Job started - will sync every hour");
}
