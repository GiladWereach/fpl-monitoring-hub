import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import '@testing-library/jest-dom';
import { ResourceMonitoringDashboard } from '../ResourceMonitoringDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js';
import { MetricsData } from '../types/monitoring-types';

// Mock data
const mockMetricsData: MetricsData[] = [{
  endpoint: 'test_endpoint',
  total_successes: 95,
  total_errors: 5,
  avg_response_time: 150,
  success_rate: 95,
  latest_success: '2024-01-01T00:00:00Z',
  latest_error: '2024-01-01T00:00:00Z',
  health_status: 'healthy'
}];

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn().mockImplementation(() => ({
      data: mockMetricsData,
      error: null,
      count: null,
      status: 200,
      statusText: "OK",
      // Required PostgrestFilterBuilder methods
      eq: vi.fn(),
      neq: vi.fn(),
      gt: vi.fn(),
      gte: vi.fn(),
      lt: vi.fn(),
      lte: vi.fn(),
      like: vi.fn(),
      ilike: vi.fn(),
      is: vi.fn(),
      in: vi.fn(),
      contains: vi.fn(),
      containedBy: vi.fn(),
      rangeLt: vi.fn(),
      rangeGt: vi.fn(),
      rangeGte: vi.fn(),
      rangeLte: vi.fn(),
      rangeAdjacent: vi.fn(),
      overlaps: vi.fn(),
      match: vi.fn(),
      imatch: vi.fn(),
      not: vi.fn(),
      or: vi.fn(),
      filter: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      range: vi.fn(),
      abortSignal: vi.fn(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      csv: vi.fn(),
      then: vi.fn(),
      select: vi.fn(),
      // Additional required methods
      likeAllOf: vi.fn(),
      likeAnyOf: vi.fn(),
      ilikeAllOf: vi.fn(),
      ilikeAnyOf: vi.fn(),
      textSearch: vi.fn(),
      textSearchAllOf: vi.fn(),
      textSearchAnyOf: vi.fn(),
      withTextSearch: vi.fn(),
      withTextSearchAllOf: vi.fn(),
      withTextSearchAnyOf: vi.fn(),
      fts: vi.fn(),
      plfts: vi.fn(),
      phfts: vi.fn(),
      wfts: vi.fn(),
      cs: vi.fn(),
      cd: vi.fn(),
      ova: vi.fn(),
      ovr: vi.fn(),
      sl: vi.fn(),
      sr: vi.fn(),
      nxl: vi.fn(),
      nxr: vi.fn(),
      adj: vi.fn(),
      // New required methods
      geojson: vi.fn(),
      explain: vi.fn(),
      rollback: vi.fn(),
      returns: vi.fn(),
      execute: vi.fn(),
      schema: vi.fn(),
      snapshot: vi.fn(),
      alter: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      insert: vi.fn(),
      update: vi.fn()
    }))
  }
}));

describe('ResourceMonitoringDashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it('renders loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ResourceMonitoringDashboard />
      </QueryClientProvider>
    );
    expect(screen.getByText(/Resource Usage/i)).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    const errorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(supabase.rpc).mockImplementationOnce(() => ({
      data: null,
      error: { message: 'Failed to fetch metrics' },
      count: null,
      status: 500,
      statusText: "Error",
      // Required PostgrestFilterBuilder methods
      eq: vi.fn(),
      neq: vi.fn(),
      gt: vi.fn(),
      gte: vi.fn(),
      lt: vi.fn(),
      lte: vi.fn(),
      like: vi.fn(),
      ilike: vi.fn(),
      is: vi.fn(),
      in: vi.fn(),
      contains: vi.fn(),
      containedBy: vi.fn(),
      rangeLt: vi.fn(),
      rangeGt: vi.fn(),
      rangeGte: vi.fn(),
      rangeLte: vi.fn(),
      rangeAdjacent: vi.fn(),
      overlaps: vi.fn(),
      match: vi.fn(),
      imatch: vi.fn(),
      not: vi.fn(),
      or: vi.fn(),
      filter: vi.fn(),
      order: vi.fn(),
      limit: vi.fn(),
      range: vi.fn(),
      abortSignal: vi.fn(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      csv: vi.fn(),
      then: vi.fn(),
      select: vi.fn(),
      // Additional required methods
      likeAllOf: vi.fn(),
      likeAnyOf: vi.fn(),
      ilikeAllOf: vi.fn(),
      ilikeAnyOf: vi.fn(),
      textSearch: vi.fn(),
      textSearchAllOf: vi.fn(),
      textSearchAnyOf: vi.fn(),
      withTextSearch: vi.fn(),
      withTextSearchAllOf: vi.fn(),
      withTextSearchAnyOf: vi.fn(),
      fts: vi.fn(),
      plfts: vi.fn(),
      phfts: vi.fn(),
      wfts: vi.fn(),
      cs: vi.fn(),
      cd: vi.fn(),
      ova: vi.fn(),
      ovr: vi.fn(),
      sl: vi.fn(),
      sr: vi.fn(),
      nxl: vi.fn(),
      nxr: vi.fn(),
      adj: vi.fn(),
      // New required methods
      geojson: vi.fn(),
      explain: vi.fn(),
      rollback: vi.fn(),
      returns: vi.fn(),
      execute: vi.fn(),
      schema: vi.fn(),
      snapshot: vi.fn(),
      alter: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      insert: vi.fn(),
      update: vi.fn()
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <ResourceMonitoringDashboard />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Failed to load resource metrics/i)).toBeInTheDocument();
    errorMock.mockRestore();
  });

  it('renders metrics when data is loaded', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <ResourceMonitoringDashboard />
      </QueryClientProvider>
    );

    expect(await screen.findByText(/Resource Usage/i)).toBeInTheDocument();
  });
});