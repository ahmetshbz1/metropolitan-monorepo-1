//  "useTrackingHelpers.ts"
//  metropolitan app
//  Created by Ahmet on 27.07.2025.

export const useTrackingHelpers = (colors: any) => {
  const getTrackingIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "info_received":
        return "document-text-outline";
      case "picked_up":
        return "cube-outline";
      case "arrived_at_hub":
        return "business-outline";
      case "out_for_delivery":
        return "car-outline";
      case "delivered":
        return "checkmark-circle-outline";
      default:
        return "ellipse-outline";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return colors.statusBadge.delivered.background;
      case "out_for_delivery":
        return colors.statusBadge.shipped.background;
      case "arrived_at_hub":
        return colors.statusBadge.confirmed.background;
      default:
        return colors.statusBadge.pending.background;
    }
  };

  const getIconColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return colors.statusBadge.delivered.text;
      case "out_for_delivery":
        return colors.statusBadge.shipped.text;
      case "arrived_at_hub":
        return colors.statusBadge.confirmed.text;
      default:
        return colors.statusBadge.pending.text;
    }
  };

  return {
    getTrackingIcon,
    getStatusColor,
    getIconColor,
  };
};