"use client";

import { Bubble } from "@ant-design/x";
import type { BubbleListRef } from "@ant-design/x/es/bubble/interface";
import type { BubbleItemType } from "@ant-design/x";
import { forwardRef } from "react";

interface BubbleListWrapperProps {
  items: BubbleItemType[];
}

export const BubbleListWrapper = forwardRef<BubbleListRef, BubbleListWrapperProps>(
  ({ items }, ref) => {
    return (
      <Bubble.List
        ref={ref}
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        styles={{
          root: {
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          },
          scroll: {
            flex: 1,
            minHeight: 0,
            overflow: "auto",
          },
        }}
        role={{
          user: { placement: "end" },
          ai: { placement: "start", variant: "shadow" },
        }}
        items={items}
        autoScroll
      />
    );
  }
);

BubbleListWrapper.displayName = "BubbleListWrapper";
