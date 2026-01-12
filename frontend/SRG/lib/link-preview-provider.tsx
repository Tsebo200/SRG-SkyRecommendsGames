/**
 * This file provides LinkPreviewContextProvider that matches Expo Router's implementation
 * We create it here to ensure it's available before Expo Router's internal code needs it
 */

import { createContext, PropsWithChildren, use, useState } from 'react';

// Create the context - this MUST match Expo Router's implementation exactly
const LinkPreviewContext = createContext<
  | {
      isStackAnimationDisabled: boolean;
      openPreviewKey: string | undefined;
      setOpenPreviewKey: (openPreviewKey: string | undefined) => void;
    }
  | undefined
>(undefined);

export function LinkPreviewContextProvider({ children }: PropsWithChildren) {
  const [openPreviewKey, setOpenPreviewKey] = useState<string | undefined>(undefined);
  const isStackAnimationDisabled = openPreviewKey !== undefined;
  return (
    <LinkPreviewContext.Provider
      value={{ isStackAnimationDisabled, openPreviewKey, setOpenPreviewKey }}>
      {children}
    </LinkPreviewContext.Provider>
  );
}

export const useLinkPreviewContext = () => {
  const context = use(LinkPreviewContext);
  if (context == null) {
    // Instead of throwing, return a safe default to prevent crashes
    // This is a workaround for Expo Router's internal code that uses this hook
    console.warn('useLinkPreviewContext called outside provider - using default values');
    return {
      isStackAnimationDisabled: false,
      openPreviewKey: undefined,
      setOpenPreviewKey: () => {},
    };
  }
  return context;
};
