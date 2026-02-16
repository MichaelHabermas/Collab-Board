export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCallResult {
  toolName: string;
  result: unknown;
  error?: string;
}

export interface AIExecuteRequest {
  requestId: string;
  boardId: string;
  prompt: string;
  context?: {
    selectedObjectIds?: string[];
    viewportBounds?: { x: number; y: number; width: number; height: number };
  };
}

export interface AIExecuteResponse {
  requestId: string;
  success: boolean;
  toolCalls: ToolCallResult[];
  message?: string;
  error?: string;
}
