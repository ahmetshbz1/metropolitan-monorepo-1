"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { secureStorage, testSecureStorage } from "@/lib/secure-storage-v2";
import { tokenStorage } from "@/lib/token-storage";
import { useState } from "react";

export function TestSecureStorage() {
  const [testResult, setTestResult] = useState<string>("");
  const [info, setInfo] = useState<any>(null);

  const runTest = async () => {
    setTestResult("🔄 Running test...");
    const success = await testSecureStorage();
    setTestResult(success ? "✅ Test passed!" : "❌ Test failed!");

    // Get info
    const storageInfo = secureStorage.getInfo();
    setInfo(storageInfo);
  };

  const testTokenStorage = async () => {
    setTestResult("🔄 Testing token storage...");

    try {
      // Test save
      await tokenStorage.saveTokens("test_access_token", "test_refresh_token");

      // Test get
      const access = await tokenStorage.getAccessToken();
      const refresh = await tokenStorage.getRefreshToken();

      if (access && refresh) {
        setTestResult("✅ Token storage test passed!");
      } else {
        setTestResult("❌ Token storage test failed!");
      }

      // Cleanup
      await tokenStorage.clearTokens();
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    }
  };

  const viewLocalStorage = () => {
    const keys = Object.keys(localStorage);
    const encrypted = keys.filter((k) => k.startsWith("secure_v2_"));
    setTestResult(`
📦 Encrypted Keys: ${encrypted.length}
${encrypted.map((k) => `  - ${k}: ${localStorage.getItem(k)?.substring(0, 50)}...`).join("\n")}
    `);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>🔐 SecureStore v2 Test</CardTitle>
        <CardDescription>
          Test Metropolitan SecureStore with AES-256 encryption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={runTest}>Run SecureStore Test</Button>
          <Button onClick={testTokenStorage} variant="outline">
            Test Token Storage
          </Button>
          <Button onClick={viewLocalStorage} variant="outline">
            View Encrypted Data
          </Button>
        </div>

        {testResult && (
          <div className="p-4 bg-muted rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">{testResult}</pre>
          </div>
        )}

        {info && (
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Storage Info:</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt>Algorithm:</dt>
              <dd className="font-mono">{info.algorithm}</dd>

              <dt>Key Size:</dt>
              <dd className="font-mono">{info.keySize} bits</dd>

              <dt>PBKDF2 Iterations:</dt>
              <dd className="font-mono">{info.iterations.toLocaleString()}</dd>

              <dt>Available:</dt>
              <dd className="font-mono">
                {info.isAvailable ? "✅ Yes" : "❌ No"}
              </dd>

              <dt>Salt:</dt>
              <dd className="font-mono text-xs break-all">
                {info.salt?.substring(0, 30)}...
              </dd>
            </dl>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
