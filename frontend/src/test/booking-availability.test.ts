import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBooking,
  createMove,
  getAvailability,
  getInventory,
  resetDemo,
  selectSlot,
  analyseMove,
  uploadPhotos,
} from "@/lib/morrow/api";
import type { Photo } from "@/lib/morrow/types";

describe("photo inventory", () => {
  beforeEach(async () => {
    await resetDemo();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends uploaded photos to vision and uses the returned detections", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{
        name: "3-seat sofa",
        quantity: 1,
        room: "Living room",
        estimated_volume_m3: 1.8,
        confidence: 0.96,
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    const photo: Photo = {
      id: "uploaded-photo",
      url: "blob:customer-room",
      dataUrl: "data:image/jpeg;base64,aGVsbG8=",
      name: "customer-room.jpg",
      status: "uploaded",
    };
    const stages: number[] = [];

    await uploadPhotos([photo]);
    await analyseMove((stage) => stages.push(stage));

    expect(stages).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/enquiry/analyse-photos");
    expect(await getInventory()).toMatchObject([
      { name: "3-seat sofa", catalogueId: "sofa-3", qty: 1, room: "Living room" },
    ]);
  });

  it("sends built-in sample photos to vision instead of returning a fixed demo list", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    const photo: Photo = {
      id: "sample-photo",
      url: "/assets/sample-room.jpg",
      dataUrl: "data:image/jpeg;base64,aGVsbG8=",
      name: "sample-room.jpg",
      status: "uploaded",
    };

    await uploadPhotos([photo]);
    await analyseMove(() => {});

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(await getInventory()).toEqual([]);
  });
});

describe("booking availability", () => {
  beforeEach(async () => {
    await resetDemo();
  });

  it("does not confirm a slot that became unavailable after selection", async () => {
    const [slot] = (await getAvailability()).filter((candidate) => candidate.available);
    if (!slot) throw new Error("Expected the demo calendar to contain an available slot.");

    await selectSlot(slot);
    await createBooking();

    await createMove();
    await selectSlot(slot);

    await expect(createBooking()).rejects.toThrow("SLOT_UNAVAILABLE");
  });
});
