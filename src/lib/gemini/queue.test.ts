import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enqueueGeminiCall } from "./queue";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("enqueueGeminiCall", () => {
  it("runs tasks strictly one after another", async () => {
    const order: string[] = [];
    const first = enqueueGeminiCall(async () => { order.push("first"); return 1; });
    const second = enqueueGeminiCall(async () => { order.push("second"); return 2; });

    await vi.runAllTimersAsync();

    await expect(first).resolves.toBe(1);
    await expect(second).resolves.toBe(2);
    expect(order).toEqual(["first", "second"]);
  });

  it("retries rate-limit errors with backoff", async () => {
    const task = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error("429 Too Many Requests"))
      .mockResolvedValueOnce("ok");

    const result = enqueueGeminiCall(task);
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe("ok");
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("does not retry other errors and keeps the queue usable afterwards", async () => {
    const failing = vi.fn<() => Promise<never>>().mockRejectedValue(new Error("invalid request"));
    const failed = enqueueGeminiCall(failing);
    const assertion = expect(failed).rejects.toThrow("invalid request");
    const next = enqueueGeminiCall(async () => "still running");

    await vi.runAllTimersAsync();

    await assertion;
    expect(failing).toHaveBeenCalledTimes(1);
    await expect(next).resolves.toBe("still running");
  });
});
