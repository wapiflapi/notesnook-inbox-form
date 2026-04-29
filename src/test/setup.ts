import "@testing-library/jest-dom/vitest";
import { Buffer } from "buffer";

globalThis.Buffer ??= Buffer;

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;
