import { Button } from "../components/Button";
import { FIELD_CONTROL_CLASS, Field } from "../components/Field";
import { CATEGORY_COPY, CATEGORY_LIMITS } from "./categoryConstants";

export function CategoryCreateForm({
  newName,
  isCreating,
  error,
  onNameChange,
  onCreate
}: {
  newName: string;
  isCreating: boolean;
  error?: string | null;
  onNameChange: (name: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
      <Field label={CATEGORY_COPY.createLabel} error={error}>
        <input
          className={`${FIELD_CONTROL_CLASS} min-h-11`}
          value={newName}
          maxLength={CATEGORY_LIMITS.nameMaxLength}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={CATEGORY_COPY.createPlaceholder}
        />
      </Field>
      <Button
        type="button"
        className="self-start sm:mt-7"
        variant="primary"
        isLoading={isCreating}
        onClick={onCreate}
      >
        {isCreating ? CATEGORY_COPY.adding : CATEGORY_COPY.addCategory}
      </Button>
    </div>
  );
}
