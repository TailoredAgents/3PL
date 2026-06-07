import {
  brokerageAgentNames,
  defaultBrokerageAgentTemplates,
  getDefaultBrokerageAgentTemplate,
  type BrokerageAgentName,
  type BrokerageAgentTemplate,
} from "@/lib/agent-config";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export const CALL_RECORDING_DISCLOSURE_KEY = "callRecordingDisclosure";
export const AGENT_PROMPT_TEMPLATE_KEY_PREFIX = "agentPromptTemplate:";
export const AGENT_MODE_KEY_PREFIX = "agentMode:";
export const QUOTE_EMAIL_TEMPLATE_KEY = "quoteEmailTemplate";

export type AgentMode = "approve_first" | "autonomous";
export const alwaysAutonomousAgentNames = [
  "Conversation Notes Agent",
] as const satisfies readonly BrokerageAgentName[];

export const defaultCallRecordingDisclosure =
  "This call may be recorded and transcribed to help our team capture shipment details, improve service, and follow up accurately. By continuing, you consent to this recording.";
export const quoteEmailTemplatePlaceholders = [
  "brokerageName",
  "companyName",
  "contactFirstName",
  "originCity",
  "originState",
  "destinationCity",
  "destinationState",
  "equipment",
  "pickup",
  "pickupWindow",
  "delivery",
  "deliveryWindow",
  "commodity",
  "weight",
  "quotedRate",
  "validUntil",
  "validUntilMessage",
  "serviceDetails",
];
export const defaultQuoteEmailTemplate = {
  subject:
    "Freight quote: {{originCity}}, {{originState}} to {{destinationCity}}, {{destinationState}}",
  body: [
    "Hi {{contactFirstName}},",
    "Thank you for the opportunity. Based on the shipment details provided, we can cover this load for {{quotedRate}}.",
    "{{serviceDetails}}",
    "{{validUntilMessage}}",
    "If this works, reply with approval and any final pickup or delivery instructions. Once approved, we will move it into dispatch and send the required confirmation details.",
    "Thank you,",
    "{{brokerageName}}",
  ].join("\n\n"),
};

export function isAlwaysAutonomousAgent(agentName: BrokerageAgentName) {
  return alwaysAutonomousAgentNames.includes(
    agentName as (typeof alwaysAutonomousAgentNames)[number],
  );
}

export type AppSettingsView = {
  callRecordingDisclosure: string;
};
export type QuoteEmailTemplateView = {
  subject: string;
  body: string;
  isCustomized: boolean;
};
export type AgentPromptTemplateView = BrokerageAgentTemplate & {
  isCustomized: boolean;
  version: number;
  updated: string;
  changedBy: string | null;
};
export type AgentPromptVersionView = BrokerageAgentTemplate & {
  id: string;
  version: number;
  changeReason: string | null;
  changedBy: string | null;
  created: string;
};

export async function getAppSettings(): Promise<AppSettingsView> {
  if (!hasDatabaseUrl() || !prisma) {
    return {
      callRecordingDisclosure: defaultCallRecordingDisclosure,
    };
  }

  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: CALL_RECORDING_DISCLOSURE_KEY },
    });

    return {
      callRecordingDisclosure:
        setting?.value ?? defaultCallRecordingDisclosure,
    };
  } catch {
    return {
      callRecordingDisclosure: defaultCallRecordingDisclosure,
    };
  }
}

export async function getQuoteEmailTemplate(): Promise<QuoteEmailTemplateView> {
  if (!hasDatabaseUrl() || !prisma) {
    return {
      ...defaultQuoteEmailTemplate,
      isCustomized: false,
    };
  }

  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: QUOTE_EMAIL_TEMPLATE_KEY },
    });
    const customized = parseQuoteEmailTemplateSetting(setting?.value);

    return {
      ...defaultQuoteEmailTemplate,
      ...customized,
      isCustomized: Boolean(customized),
    };
  } catch {
    return {
      ...defaultQuoteEmailTemplate,
      isCustomized: false,
    };
  }
}

export async function saveQuoteEmailTemplate({
  subject,
  body,
}: {
  subject: string;
  body: string;
}) {
  if (!hasDatabaseUrl() || !prisma) {
    return;
  }

  await prisma.appSetting.upsert({
    where: { key: QUOTE_EMAIL_TEMPLATE_KEY },
    create: {
      key: QUOTE_EMAIL_TEMPLATE_KEY,
      value: JSON.stringify({ subject, body }),
    },
    update: {
      value: JSON.stringify({ subject, body }),
    },
  });
}

export async function getAgentPromptTemplates(): Promise<
  AgentPromptTemplateView[]
> {
  if (!hasDatabaseUrl() || !prisma) {
    return defaultBrokerageAgentTemplates.map((template) => ({
      ...template,
      isCustomized: false,
      version: 1,
      updated: "Default",
      changedBy: null,
    }));
  }

  try {
    const [settings, versions] = await Promise.all([
      prisma.appSetting.findMany({
        where: { key: { startsWith: AGENT_PROMPT_TEMPLATE_KEY_PREFIX } },
      }),
      prisma.agentPromptVersion.findMany({
        orderBy: [{ agentName: "asc" }, { version: "desc" }],
        include: { changedBy: true },
      }),
    ]);
    const settingsByAgent = new Map(
      settings.map((setting) => [
        setting.key.replace(AGENT_PROMPT_TEMPLATE_KEY_PREFIX, ""),
        setting.value,
      ]),
    );
    const latestVersionByAgent = new Map<string, (typeof versions)[number]>();
    for (const version of versions) {
      if (!latestVersionByAgent.has(version.agentName)) {
        latestVersionByAgent.set(version.agentName, version);
      }
    }

    return defaultBrokerageAgentTemplates.map((template) => {
      const customized = parsePromptTemplateSetting(
        settingsByAgent.get(template.agentName),
      );
      const latestVersion = latestVersionByAgent.get(template.agentName);

      return {
        ...template,
        ...customized,
        agentName: template.agentName,
        isCustomized: Boolean(customized),
        version: latestVersion?.version ?? 1,
        updated: latestVersion
          ? formatSettingsDate(latestVersion.createdAt)
          : "Default",
        changedBy: latestVersion?.changedBy?.name ?? null,
      };
    });
  } catch {
    return defaultBrokerageAgentTemplates.map((template) => ({
      ...template,
      isCustomized: false,
      version: 1,
      updated: "Default",
      changedBy: null,
    }));
  }
}

export async function getAgentPromptTemplate(
  agentName: BrokerageAgentName,
): Promise<AgentPromptTemplateView> {
  const defaultTemplate = getDefaultBrokerageAgentTemplate(agentName);

  if (!defaultTemplate) {
    throw new Error("Unknown agent template.");
  }

  if (!hasDatabaseUrl() || !prisma) {
    return {
      ...defaultTemplate,
      isCustomized: false,
      version: 1,
      updated: "Default",
      changedBy: null,
    };
  }

  try {
    const [setting, latestVersion] = await Promise.all([
      prisma.appSetting.findUnique({
        where: { key: getAgentPromptTemplateKey(agentName) },
      }),
      prisma.agentPromptVersion.findFirst({
        where: { agentName },
        orderBy: { version: "desc" },
        include: { changedBy: true },
      }),
    ]);
    const customized = parsePromptTemplateSetting(setting?.value);

    return {
      ...defaultTemplate,
      ...customized,
      agentName,
      isCustomized: Boolean(customized),
      version: latestVersion?.version ?? 1,
      updated: latestVersion
        ? formatSettingsDate(latestVersion.createdAt)
        : "Default",
      changedBy: latestVersion?.changedBy?.name ?? null,
    };
  } catch {
    return {
      ...defaultTemplate,
      isCustomized: false,
      version: 1,
      updated: "Default",
      changedBy: null,
    };
  }
}

export async function saveAgentPromptTemplate(
  template: BrokerageAgentTemplate,
  options?: {
    changedByUserId?: string | null;
    changeReason?: string | null;
  },
) {
  if (!hasDatabaseUrl() || !prisma) {
    return;
  }

  const latestVersion = await prisma.agentPromptVersion.findFirst({
    where: { agentName: template.agentName },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const value = JSON.stringify({
    systemPrompt: template.systemPrompt,
    task: template.task,
    placeholderNextAction: template.placeholderNextAction,
  });

  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: getAgentPromptTemplateKey(template.agentName) },
      create: {
        key: getAgentPromptTemplateKey(template.agentName),
        value,
      },
      update: {
        value,
      },
    }),
    prisma.agentPromptVersion.create({
      data: {
        agentName: template.agentName,
        version: (latestVersion?.version ?? 0) + 1,
        systemPrompt: template.systemPrompt,
        task: template.task,
        placeholderNextAction: template.placeholderNextAction,
        changeReason: options?.changeReason?.trim() || null,
        changedByUserId: options?.changedByUserId ?? null,
      },
    }),
  ]);
}

export async function getAgentPromptVersionViews(
  take = 12,
): Promise<AgentPromptVersionView[]> {
  if (!hasDatabaseUrl() || !prisma) {
    return [];
  }

  try {
    const versions = await prisma.agentPromptVersion.findMany({
      orderBy: { createdAt: "desc" },
      include: { changedBy: true },
      take,
    });

    return versions.map((version) => ({
      id: version.id,
      agentName: version.agentName as BrokerageAgentName,
      version: version.version,
      systemPrompt: version.systemPrompt,
      task: version.task,
      placeholderNextAction: version.placeholderNextAction,
      changeReason: version.changeReason,
      changedBy: version.changedBy?.name ?? null,
      created: formatSettingsDate(version.createdAt),
    }));
  } catch {
    return [];
  }
}

function getAgentPromptTemplateKey(agentName: BrokerageAgentName) {
  return `${AGENT_PROMPT_TEMPLATE_KEY_PREFIX}${agentName}`;
}

function parsePromptTemplateSetting(
  value: string | null | undefined,
): Partial<BrokerageAgentTemplate> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const systemPrompt =
      typeof parsed.systemPrompt === "string" ? parsed.systemPrompt : undefined;
    const task = typeof parsed.task === "string" ? parsed.task : undefined;
    const placeholderNextAction =
      typeof parsed.placeholderNextAction === "string"
        ? parsed.placeholderNextAction
        : undefined;

    if (!systemPrompt && !task && !placeholderNextAction) {
      return null;
    }

    return {
      ...(systemPrompt ? { systemPrompt } : {}),
      ...(task ? { task } : {}),
      ...(placeholderNextAction ? { placeholderNextAction } : {}),
    };
  } catch {
    return null;
  }
}

export async function getAgentModes(): Promise<Record<BrokerageAgentName, AgentMode>> {
  const defaultModes = Object.fromEntries(
    brokerageAgentNames.map((name) => [
      name,
      isAlwaysAutonomousAgent(name) ? "autonomous" : "approve_first",
    ]),
  ) as Record<BrokerageAgentName, AgentMode>;

  if (!hasDatabaseUrl() || !prisma) {
    return defaultModes;
  }

  try {
    const settings = await prisma.appSetting.findMany({
      where: { key: { startsWith: AGENT_MODE_KEY_PREFIX } },
    });
    const byAgent = new Map(
      settings.map((s) => [s.key.replace(AGENT_MODE_KEY_PREFIX, ""), s.value]),
    );

    return Object.fromEntries(
      brokerageAgentNames.map((name) => {
        if (isAlwaysAutonomousAgent(name)) {
          return [name, "autonomous"];
        }
        const stored = byAgent.get(name);
        const mode: AgentMode = stored === "autonomous" ? "autonomous" : "approve_first";
        return [name, mode];
      }),
    ) as Record<BrokerageAgentName, AgentMode>;
  } catch {
    return defaultModes;
  }
}

export async function getAgentMode(agentName: BrokerageAgentName): Promise<AgentMode> {
  if (isAlwaysAutonomousAgent(agentName)) {
    return "autonomous";
  }

  if (!hasDatabaseUrl() || !prisma) {
    return "approve_first";
  }

  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: `${AGENT_MODE_KEY_PREFIX}${agentName}` },
    });
    return setting?.value === "autonomous" ? "autonomous" : "approve_first";
  } catch {
    return "approve_first";
  }
}

export async function saveAgentMode(
  agentName: BrokerageAgentName,
  mode: AgentMode,
): Promise<void> {
  if (isAlwaysAutonomousAgent(agentName)) {
    return;
  }

  if (!hasDatabaseUrl() || !prisma) {
    return;
  }

  const key = `${AGENT_MODE_KEY_PREFIX}${agentName}`;
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value: mode },
    update: { value: mode },
  });
}

function parseQuoteEmailTemplateSetting(
  value: string | null | undefined,
): Partial<Omit<QuoteEmailTemplateView, "isCustomized">> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const subject =
      typeof parsed.subject === "string" ? parsed.subject.trim() : undefined;
    const body = typeof parsed.body === "string" ? parsed.body.trim() : undefined;

    if (!subject && !body) {
      return null;
    }

    return {
      ...(subject ? { subject } : {}),
      ...(body ? { body } : {}),
    };
  } catch {
    return null;
  }
}

function formatSettingsDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
