//  "shared-example.tsx"
//  metropolitan app
//  Created by Ahmet on 04.07.2025.

import React from "react";
import { StyleSheet, Text, View } from "react-native";

// Shared package'den import - React Native'de normal şekilde çalışır
import {
  API_ENDPOINTS,
  ERROR_MESSAGES,
  ORDER_STATUS,
  formatPrice,
  validateEmail,
  type Product,
  type User,
} from "@metropolitan/shared";

interface Props {
  product: Product;
  user: User;
}

export const SharedExampleComponent: React.FC<Props> = ({ product, user }) => {
  // Shared utilities kullanımı
  const formattedPrice = formatPrice(product.price);
  const isValidEmail = validateEmail(user.email);

  // Shared constants kullanımı
  const apiUrl = `https://api.example.com${API_ENDPOINTS.PRODUCTS}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shared Package Örneği</Text>

      {/* Price formatting */}
      <Text style={styles.price}>Fiyat: {formattedPrice}</Text>

      {/* Email validation */}
      <Text style={styles.email}>
        Email: {user.email}
        {isValidEmail ? " ✅" : " ❌"}
      </Text>

      {/* API endpoint */}
      <Text style={styles.api}>API: {apiUrl}</Text>

      {/* Error message */}
      {!isValidEmail && (
        <Text style={styles.error}>{ERROR_MESSAGES.VALIDATION_ERROR}</Text>
      )}

      {/* Order status */}
      <Text style={styles.status}>Status: {ORDER_STATUS.PENDING}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  price: {
    fontSize: 16,
    color: "#2196F3",
    marginBottom: 10,
  },
  email: {
    fontSize: 14,
    marginBottom: 10,
  },
  api: {
    fontSize: 12,
    color: "#666",
    marginBottom: 10,
  },
  error: {
    fontSize: 12,
    color: "#F44336",
    marginBottom: 10,
  },
  status: {
    fontSize: 14,
    color: "#4CAF50",
  },
});
