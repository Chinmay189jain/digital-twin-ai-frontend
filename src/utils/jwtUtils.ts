// src/utils/jwtUtils.ts
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;       // usually email
  username?: string;     // optional, if present
  exp: number;
  iat: number;
  // Add more fields if you include custom claims
}

export const decodeToken = (token: string): DecodedToken | null => {
  try {
    return jwtDecode<DecodedToken>(token);
  } catch (error) {
    console.error('Failed to decode token', error);
    return null;
  }
};
