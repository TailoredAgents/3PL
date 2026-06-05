import {
  defaultBrokerageAgentTemplates,
  getDefaultBrokerageAgentTemplate,
  type BrokerageAgentName,
  type BrokerageAgentTemplate,
} from "@/lib/agent-config";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export const CALL_RECORDING_DISCLOSURE_KEY = "callRecordingDisclosure";
export const AGENT_PROMPT_TEMPLATE_KEY_PREFIX = "agentPromptTemplate:";
export const QUOTE_EMAIL_TEMPLATE_KEY = "quoteEmailTemplate";

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
    }));
  }

  try {
    const settings = await prisma.appSetting.findMany({
      where: { key: { startsWith: AGENT_PROMPT_TEMPLATE_KEY_PREFIX } },
    });
    const settingsByAgent = new Map(
      settings.map((setting) => [
        setting.key.replace(AGENT_PROMPT_TEMPLATE_KEY_PREFIX, ""),
        setting.value,
      ]),
    );

    return defaultBrokerageAgentTemplates.map((template) => {
      const customized = parsePromptTemplateSetting(
        settingsByAgent.get(template.agentName),
      );

      return {
        ...template,
        ...customized,
        agentName: template.agentName,
        isCustomized: Boolean(customized),
      };
    });
  } catch {
    return defaultBrokerageAgentTemplates.map((template) => ({
      ...template,
      isCustomized: false,
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
    };
  }

  try {
    const setting = await prisma.appSetting.findUnique({
      where: { key: getAgentPromptTemplateKey(agentName) },
    });
    const customized = parsePromptTemplateSetting(setting?.value);

    return {
      ...defaultTemplate,
      ...customized,
      agentName,
      isCustomized: Boolean(customized),
    };
  } catch {
    return {
      ...defaultTemplate,
      isCustomized: false,
    };
  }
}

export async function saveAgentPromptTemplate(
  template: BrokerageAgentTemplate,
) {
  if (!hasDatabaseUrl() || !prisma) {
    return;
  }

  await prisma.appSetting.upsert({
    where: { key: getAgentPromptTemplateKey(template.agentName) },
    create: {
      key: getAgentPromptTemplateKey(template.agentName),
      value: JSON.stringify({
        systemPrompt: template.systemPrompt,
        task: template.task,
        placeholderNextAction: template.placeholderNextAction,
      }),
    },
    update: {
      value: JSON.stringify({
        systemPrompt: template.systemPrompt,
        task: template.task,
        placeholderNextAction: template.placeholderNextAction,
      }),
    },
  });
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
