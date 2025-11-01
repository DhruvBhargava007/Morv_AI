/**
 * useRepairStream Hook
 * Manages Server-Sent Events connection for real-time AI form field streaming
 */

import { useState, useRef, useCallback } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface StreamFieldUpdate {
  field: string;
  value: any;
  reasoning: string;
  confidence: number;
}

export interface StreamState {
  isStreaming: boolean;
  isConnected: boolean;
  error: string | null;
  updates: StreamFieldUpdate[];
  completedFields: Set<string>;
}

export interface UseRepairStreamReturn {
  streamState: StreamState;
  startStream: (
    componentId: string,
    tankId: string,
    repairType: 'personnel_assignment' | 'work_order' | 'part_transfer'
  ) => void;
  stopStream: () => void;
  clearUpdates: () => void;
  getFieldValue: (field: string) => any;
  getFieldReasoning: (field: string) => string;
  getFieldConfidence: (field: string) => number;
}

export function useRepairStream(): UseRepairStreamReturn {
  const [streamState, setStreamState] = useState<StreamState>({
    isStreaming: false,
    isConnected: false,
    error: null,
    updates: [],
    completedFields: new Set(),
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const updatesMapRef = useRef<Map<string, StreamFieldUpdate>>(new Map());

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setStreamState((prev) => ({
      ...prev,
      isStreaming: false,
      isConnected: false,
    }));
  }, []);

  const startStream = useCallback(
    (
      componentId: string,
      tankId: string,
      repairType: 'personnel_assignment' | 'work_order' | 'part_transfer'
    ) => {
      // Stop any existing stream
      stopStream();

      // Reset state
      updatesMapRef.current.clear();
      setStreamState({
        isStreaming: true,
        isConnected: false,
        error: null,
        updates: [],
        completedFields: new Set(),
      });

      // Create POST request to initiate streaming
      fetch(`${API_BASE_URL}/api/repair/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          componentId,
          tankId,
          repairType,
        }),
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('No reader available');
          }

          setStreamState((prev) => ({ ...prev, isConnected: true }));

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.slice(6).trim();
                  // Skip empty lines
                  if (!jsonStr) continue;
                  
                  const data = JSON.parse(jsonStr);

                  if (data.type === 'connected') {
                    console.log('Stream connected:', data);
                  } else if (data.type === 'complete') {
                    console.log('Stream complete:', data);
                    setStreamState((prev) => ({
                      ...prev,
                      isStreaming: false,
                      isConnected: false,
                    }));
                  } else if (data.type === 'error') {
                    const errorMessage = typeof data.error === 'string' 
                      ? data.error 
                      : 'An unknown error occurred during streaming';
                    console.error('Stream error:', errorMessage);
                    setStreamState((prev) => ({
                      ...prev,
                      isStreaming: false,
                      isConnected: false,
                      error: errorMessage,
                    }));
                  } else if (data.field) {
                    // Field update
                    const update: StreamFieldUpdate = {
                      field: data.field,
                      value: data.value,
                      reasoning: data.reasoning || '',
                      confidence: data.confidence || 0,
                    };

                    updatesMapRef.current.set(data.field, update);

                    setStreamState((prev) => {
                      const newCompletedFields = new Set(prev.completedFields);
                      newCompletedFields.add(data.field);

                      return {
                        ...prev,
                        updates: Array.from(updatesMapRef.current.values()),
                        completedFields: newCompletedFields,
                      };
                    });
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e, line);
                  // If it's a JSON parsing error with partial data, skip it gracefully
                  if (e instanceof SyntaxError && line.includes('data: ')) {
                    console.warn('Skipping malformed JSON line:', line.substring(0, 100));
                    continue;
                  }
                  // For other errors, set error state but don't break the stream
                  setStreamState((prev) => ({
                    ...prev,
                    error: `Parse error: ${e instanceof Error ? e.message : String(e)}`,
                  }));
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error('Stream error:', error);
          setStreamState((prev) => ({
            ...prev,
            isStreaming: false,
            isConnected: false,
            error: error.message,
          }));
        });
    },
    [stopStream]
  );

  const clearUpdates = useCallback(() => {
    updatesMapRef.current.clear();
    setStreamState({
      isStreaming: false,
      isConnected: false,
      error: null,
      updates: [],
      completedFields: new Set(),
    });
  }, []);

  const getFieldValue = useCallback((field: string): any => {
    return updatesMapRef.current.get(field)?.value;
  }, []);

  const getFieldReasoning = useCallback((field: string): string => {
    return updatesMapRef.current.get(field)?.reasoning || '';
  }, []);

  const getFieldConfidence = useCallback((field: string): number => {
    return updatesMapRef.current.get(field)?.confidence || 0;
  }, []);

  return {
    streamState,
    startStream,
    stopStream,
    clearUpdates,
    getFieldValue,
    getFieldReasoning,
    getFieldConfidence,
  };
}

export default useRepairStream;

