"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useState } from "react";

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>("Ready");
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      // Test health check endpoint
      const response = await api.get("/health");
      setApiStatus(`✅ Connected - ${response.data.message || "OK"}`);
    } catch (error: any) {
      console.error("API Test Error:", error);
      setApiStatus(`❌ Failed - ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Metropolitan Food Group
          </h1>
          <p className="text-xl text-muted-foreground">
            Web Application - Backend Integration Test
          </p>
        </div>

        {/* API Test Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
              Backend API Connection Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">API Base URL:</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {process.env.NEXT_PUBLIC_API_BASE_URL}/api
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">Status:</p>
                <p className="text-sm">{apiStatus}</p>
              </div>
            </div>

            <Button
              onClick={testAPI}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Testing..." : "Test API Connection"}
            </Button>
          </CardContent>
        </Card>

        {/* Color Test */}
        <Card>
          <CardHeader>
            <CardTitle>Color System Test</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-12 bg-primary rounded"></div>
              <p className="text-sm font-medium">Primary</p>
              <p className="text-xs text-muted-foreground">Metropolitan Orange</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-secondary rounded"></div>
              <p className="text-sm font-medium">Secondary</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-destructive rounded"></div>
              <p className="text-sm font-medium">Destructive</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-12 bg-muted rounded"></div>
              <p className="text-sm font-medium">Muted</p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Next.js 15.5 + Tailwind CSS 4.0 ✅
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Mobile-app color system ported ✅
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                API configuration ✅
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Auth system implementation 🚧
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Login/Register pages 🚧
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Google authentication 🚧
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                User dropdown with shadcn 🚧
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}