//  "generate-test-token.ts"
//  Generate test token for testing APIs

import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "secret-key-123-456-789-000-xxx-yyy-zzz";

async function generateTestToken() {
  const userId = "96d9a2e4-3e06-46ce-bd23-db7da7271776";

  const secret = new TextEncoder().encode(JWT_SECRET);

  const token = await new jose.SignJWT({
    sub: userId,
    userId: userId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  console.log("🔐 Test Token Generated:");
  console.log(token);
  console.log("\n📋 Use this token in Authorization header:");
  console.log(`Authorization: Bearer ${token}`);

  console.log("\n🧪 Test command:");
  console.log(`curl -X GET "http://localhost:3000/api/users/notifications" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json"`);
}

generateTestToken();