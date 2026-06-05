import {
  defaultBrokerageAgentTemplates,
  getDefaultBrokerageAgentTemplate,
  type BrokerageAgentName,
  type BrokerageAgentTemplate,
} from "@/lib/agent-config";
import { hasDatabaseUrl, prisma } from "@/lib/prisma";

export const CALL_RECORDING_DISCLOSURE_KEY = "callRecordingDisclosure";
export const AGENT_PROMPT_TEMPLATE_KEY_PREFIX = "agentPromptTemplate:";

export const defaultCallRecordingDisclosure =
  "This call may be recorded and transcribed to help our team capture shipment details, improve service, and follow up accurately. By continuing, you consent to this recording.";

export type AppSettingsView = {
  callRecordingDisclosure: string;
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
