"use client";

import { useEffect } from "react";
import { rememberSignupCity } from "@/lib/signup/intentStorage";

export function RememberSignupCity({ city }: { city: string }) {
  useEffect(() => {
    rememberSignupCity(city);
  }, [city]);
  return null;
}
