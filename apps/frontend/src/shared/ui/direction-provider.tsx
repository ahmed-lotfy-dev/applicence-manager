import * as React from "react";
import {
  DirectionProvider as RadixDirectionProvider,
  useDirection as useRadixDirection,
} from "@radix-ui/react-direction";

interface DirectionProviderProps {
  direction?: "ltr" | "rtl";
  dir?: "ltr" | "rtl";
  children: React.ReactNode;
}

export function DirectionProvider({ direction, dir, children }: DirectionProviderProps) {
  const resolvedDirection = direction ?? dir ?? "ltr";
  return <RadixDirectionProvider dir={resolvedDirection}>{children}</RadixDirectionProvider>;
}

export function useDirection() {
  return useRadixDirection();
}
