export function nullableString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function splitContactName(contactName: string) {
  const [firstName, ...lastNameParts] = contactName.trim().split(/\s+/);

  return {
    firstName,
    lastName: lastNameParts.join(" ") || null,
  };
}

export function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export function checkboxValue(formData: FormData, key: string) {
  return formData.get(key) === "true";
}

export function optionalDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function composeShipperNotes(input: {
  lanes?: string;
  equipmentType?: string;
  monthlyVolume?: string;
  notes?: string;
}) {
  return [
    input.lanes ? `Lanes: ${input.lanes}` : null,
    input.equipmentType ? `Equipment: ${input.equipmentType}` : null,
    input.monthlyVolume ? `Volume: ${input.monthlyVolume}` : null,
    input.notes ? `Pain: ${input.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
