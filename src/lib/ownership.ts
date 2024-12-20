import { OwnershipResponse } from "@/types/ownership";

export async function getCurrentOwnership(): Promise<OwnershipResponse> {
  return {
    success: true,
    data: {
      event: 0,
      ownership_data: []
    }
  };
}