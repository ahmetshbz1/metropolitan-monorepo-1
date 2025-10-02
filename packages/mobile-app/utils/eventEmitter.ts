// eventEmitter.ts
// Simple event emitter for app-wide events

import { DeviceEventEmitter } from "react-native";

// Event types
export enum AppEvent {
  SESSION_EXPIRED = "SESSION_EXPIRED",
}

export const EventEmitter = {
  emit: (event: AppEvent, data?: any) => {
    DeviceEventEmitter.emit(event, data);
  },

  addListener: (event: AppEvent, handler: (data?: any) => void) => {
    return DeviceEventEmitter.addListener(event, handler);
  },
};
