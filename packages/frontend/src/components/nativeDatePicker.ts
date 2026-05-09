export function openNativeDatePicker(input: HTMLInputElement) {
  if (typeof input.showPicker !== "function") {
    return;
  }

  try {
    input.showPicker();
  } catch {
    // Some browsers can reject showPicker for non-interactive or unsupported states.
  }
}
