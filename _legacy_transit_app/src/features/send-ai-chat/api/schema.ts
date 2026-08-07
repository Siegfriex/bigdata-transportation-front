import type { AiChatResponse } from "../../../entities/chat-message/model/types";
import type { ReportType } from "../../../entities/report/model/types";
import type { UserPreferences } from "../../../entities/user-preferences/model/types";
import type { AiChatRequest } from "../server/chatResponder";

const REPORT_TYPES = new Set<ReportType>(["boarding", "carriage", "deadline", "recovery"]);
const CROWD_SENSITIVITY = new Set<UserPreferences["crowdSensitivity"]>(["low", "normal", "high"]);
const AI_STYLE = new Set<UserPreferences["aiStyle"]>(["brief", "detailed", "emergency"]);

export class AiChatValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiChatValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new AiChatValidationError(`${field} must be a string`);
  }
  return value;
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new AiChatValidationError(`${field} must be a finite number`);
  }
  return value;
}

function optionalBoolean(value: unknown, field: string): boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "boolean") {
    throw new AiChatValidationError(`${field} must be a boolean`);
  }
  return value;
}

function optionalStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new AiChatValidationError(`${field} must be a string array`);
  }
  return value;
}

function validatePreferences(value: unknown): UserPreferences | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    throw new AiChatValidationError("context.preferences must be an object");
  }

  const home = optionalString(value.home, "context.preferences.home") ?? "";
  const work = optionalString(value.work, "context.preferences.work") ?? "";
  const crowdSensitivity = optionalString(value.crowdSensitivity, "context.preferences.crowdSensitivity") ?? "normal";
  const maxTaxiFee = optionalNumber(value.maxTaxiFee, "context.preferences.maxTaxiFee") ?? 0;
  const walkLimitMin = optionalNumber(value.walkLimitMin, "context.preferences.walkLimitMin") ?? 0;
  const useBike = optionalBoolean(value.useBike, "context.preferences.useBike") ?? false;
  const aiStyle = optionalString(value.aiStyle, "context.preferences.aiStyle") ?? "brief";
  const favoriteRoutes = optionalStringArray(value.favoriteRoutes, "context.preferences.favoriteRoutes") ?? [];

  if (!CROWD_SENSITIVITY.has(crowdSensitivity as UserPreferences["crowdSensitivity"])) {
    throw new AiChatValidationError("context.preferences.crowdSensitivity is invalid");
  }
  if (!AI_STYLE.has(aiStyle as UserPreferences["aiStyle"])) {
    throw new AiChatValidationError("context.preferences.aiStyle is invalid");
  }

  return {
    home,
    work,
    crowdSensitivity: crowdSensitivity as UserPreferences["crowdSensitivity"],
    maxTaxiFee,
    walkLimitMin,
    useBike,
    aiStyle: aiStyle as UserPreferences["aiStyle"],
    favoriteRoutes,
  };
}

export function validateAiChatRequest(value: unknown): AiChatRequest {
  if (!isRecord(value)) {
    throw new AiChatValidationError("request body must be an object");
  }

  if (typeof value.message !== "string" || value.message.trim() === "") {
    throw new AiChatValidationError("message is required");
  }

  if (value.message.length > 2000) {
    throw new AiChatValidationError("message must be 2000 characters or fewer");
  }

  if (value.context !== undefined && value.context !== null && !isRecord(value.context)) {
    throw new AiChatValidationError("context must be an object");
  }

  const context = isRecord(value.context) ? value.context : undefined;

  return {
    message: value.message,
    context: context
      ? {
          startStation: optionalString(context.startStation, "context.startStation"),
          endStation: optionalString(context.endStation, "context.endStation"),
          deadlineTime: optionalString(context.deadlineTime, "context.deadlineTime"),
          preferences: validatePreferences(context.preferences),
        }
      : undefined,
  };
}

export function validateAiChatResponse(value: unknown): AiChatResponse {
  if (!isRecord(value)) {
    throw new AiChatValidationError("AI response must be an object");
  }

  if (typeof value.textAnswer !== "string" || value.textAnswer.trim() === "") {
    throw new AiChatValidationError("AI response textAnswer is required");
  }

  const suggestedReportType = optionalString(value.suggestedReportType, "suggestedReportType");
  if (suggestedReportType && !REPORT_TYPES.has(suggestedReportType as ReportType)) {
    throw new AiChatValidationError("suggestedReportType is invalid");
  }

  return {
    textAnswer: value.textAnswer,
    suggestedReportType: suggestedReportType ? (suggestedReportType as ReportType) : null,
    startStation: optionalString(value.startStation, "startStation"),
    endStation: optionalString(value.endStation, "endStation"),
    recommendedCarNo: optionalString(value.recommendedCarNo, "recommendedCarNo"),
    routeIndex: optionalNumber(value.routeIndex, "routeIndex"),
  };
}
