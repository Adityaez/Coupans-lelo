"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface OfferEventData {
  id: string;
  type: string;
  amount: number | null;
  actorId: string;
  actorName: string;
  message: string | null;
  createdAt: string;
}

interface OfferData {
  id: string;
  amount: number;
  status: string;
  expiresAt: string;
  buyerId: string;
  listingId: string;
  sellerId: string;
}

interface UseRealtimeOffersReturn {
  offer: OfferData | null;
  events: OfferEventData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRealtimeOffer(offerId: string | null): UseRealtimeOffersReturn {
  const [offer, setOffer] = useState<OfferData | null>(null);
  const [events, setEvents] = useState<OfferEventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!offerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/offers/${offerId}/events`);
      if (!res.ok) {
        throw new Error("Failed to fetch offer events");
      }
      const data = await res.json();
      setOffer(data.offer);
      setEvents(data.events);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Subscribe to Supabase Realtime for live updates
  useEffect(() => {
    if (!offerId) return;

    const channel = supabase
      .channel(`offer-${offerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "OfferEvent",
          filter: `offerId=eq.${offerId}`,
        },
        () => {
          // Refetch on any change to offer events
          fetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Offer",
          filter: `id=eq.${offerId}`,
        },
        () => {
          // Refetch when offer itself changes (status update)
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [offerId, fetchData]);

  return { offer, events, loading, error, refresh: fetchData };
}
