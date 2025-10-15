//  "order-tracking.service.ts"
//  metropolitan backend
//  Created by Ahmet on 15.06.2025.

import type { OrderQueryResult, OrderWithItems } from "../types/order-tracking.types";
import { OrderTrackingNotificationService } from "./order-tracking-notification.service";
import { OrderTrackingQueryService } from "./order-tracking-query.service";
import { OrderTrackingUpdateService } from "./order-tracking-update.service";

/**
 * Ana facade servis - geriye dönük uyumluluk için tüm metotları delegate eder
 */
export class OrderTrackingService {
  /**
   * Kullanıcının tüm siparişlerini getirir
   * Tek query ile tüm ilişkili verileri JOIN ile alır (N+1 query önlenir)
   */
  static async getUserOrders(userId: string) {
    return OrderTrackingQueryService.getUserOrders(userId);
  }

  /**
   * Flat query sonuçlarını nested order yapısına dönüştürür
   */
  static transformToNestedOrders(results: OrderQueryResult[]): OrderWithItems[] {
    return OrderTrackingQueryService.transformToNestedOrders(results);
  }

  /**
   * Belirli bir siparişin detaylarını getirir
   */
  static async getOrderDetails(orderId: string, userId: string) {
    return OrderTrackingQueryService.getOrderDetails(orderId, userId);
  }

  /**
   * Sipariş öğelerini getirir
   */
  static async getOrderItems(orderId: string, language: string) {
    return OrderTrackingQueryService.getOrderItems(orderId, language);
  }

  /**
   * Kargo takip olaylarını getirir
   */
  static async getTrackingEvents(orderId: string) {
    return OrderTrackingQueryService.getTrackingEvents(orderId);
  }

  /**
   * Kargo takip numarasına göre sipariş bulur
   */
  static async getOrderByTrackingNumber(
    trackingNumber: string,
    userId: string
  ) {
    return OrderTrackingQueryService.getOrderByTrackingNumber(trackingNumber, userId);
  }

  /**
   * Sipariş durumunu günceller ve bildirim gönderir
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: string,
    trackingInfo?: {
      trackingNumber?: string;
      shippingCompany?: string;
      estimatedDelivery?: Date;
      location?: string;
      description?: string;
    }
  ) {
    return OrderTrackingUpdateService.updateOrderStatus(orderId, newStatus, trackingInfo);
  }

  /**
   * Sipariş durumuna göre bildirim gönderilip gönderilmeyeceğini kontrol eder
   */
  static shouldSendNotification(status: string): boolean {
    return OrderTrackingNotificationService.shouldSendNotification(status);
  }

  /**
   * Sipariş durumuna göre bildirim çevirilerini döndürür
   */
  static getNotificationTranslations(
    status: string,
    orderNumber: string
  ): Record<"tr" | "en" | "pl", { title: string; body: string }> {
    return OrderTrackingNotificationService.getNotificationTranslations(status, orderNumber);
  }

  /**
   * Sipariş durumu açıklaması
   */
  static getStatusText(status: string): string {
    return OrderTrackingNotificationService.getStatusText(status);
  }
}
