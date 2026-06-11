export type RhwpOperation =
  | InsertTextOperation
  | ReplaceTextOperation
  | ReplaceSelectionOperation
  | CreateTableOperation
  | EditTableCellOperation
  | InsertImageOperation
  | SaveDocumentOperation;

export interface RhwpOperationEnvelope {
  version: 1;
  summary: string;
  requiresUserApproval: boolean;
  operations: RhwpOperation[];
}

export interface DocumentPosition {
  sectionIndex: number;
  paragraphIndex: number;
  charOffset: number;
}

export interface InsertTextOperation {
  type: "insert_text";
  target: DocumentPosition;
  text: string;
}

export interface ReplaceTextOperation {
  type: "replace_text";
  target: DocumentPosition & {
    length: number;
  };
  text: string;
}

export interface ReplaceSelectionOperation {
  type: "replace_selection";
  selectedText: string;
  replacement: string;
  occurrence?: number;
}

export interface CreateTableOperation {
  type: "create_table";
  target: DocumentPosition;
  rows: number;
  cols: number;
  cells?: string[][];
}

export interface EditTableCellOperation {
  type: "edit_table_cell";
  target: {
    sectionIndex: number;
    parentParagraphIndex: number;
    controlIndex: number;
    cellIndex: number;
    cellParagraphIndex: number;
    charOffset: number;
  };
  text: string;
}

export interface InsertImageOperation {
  type: "insert_image";
  target: DocumentPosition;
  source: {
    kind: "vault_file" | "generated_file";
    path: string;
  };
  layout: {
    width: number;
    height: number;
    description: string;
  };
}

export interface SaveDocumentOperation {
  type: "save_document";
}

export function validateOperationEnvelope(value: unknown): RhwpOperationEnvelope {
  if (!isRecord(value)) throw new Error("Operation envelope must be an object.");
  if (value.version !== 1) throw new Error("Unsupported operation envelope version.");
  if (typeof value.summary !== "string") throw new Error("Operation envelope summary is required.");
  if (typeof value.requiresUserApproval !== "boolean") {
    throw new Error("Operation envelope requiresUserApproval must be boolean.");
  }
  if (!Array.isArray(value.operations)) throw new Error("Operation envelope operations must be an array.");
  return {
    version: 1,
    summary: value.summary,
    requiresUserApproval: value.requiresUserApproval,
    operations: value.operations.map(validateOperation)
  };
}

function validateOperation(value: unknown): RhwpOperation {
  if (!isRecord(value) || typeof value.type !== "string") {
    throw new Error("Operation must include a type.");
  }
  switch (value.type) {
    case "insert_text":
      return { type: "insert_text", target: readPosition(value.target), text: readText(value.text) };
    case "replace_text":
      return {
        type: "replace_text",
        target: { ...readPosition(value.target), length: readNonNegativeInt(readRecord(value.target).length, "length") },
        text: readText(value.text)
      };
    case "replace_selection":
      return {
        type: "replace_selection",
        selectedText: readText(value.selectedText),
        replacement: readString(value.replacement, "replacement"),
        occurrence: value.occurrence === undefined ? undefined : readPositiveInt(value.occurrence, "occurrence")
      };
    case "create_table":
      return {
        type: "create_table",
        target: readPosition(value.target),
        rows: readPositiveInt(value.rows, "rows"),
        cols: readPositiveInt(value.cols, "cols"),
        cells: Array.isArray(value.cells) ? value.cells.map(readStringArray) : undefined
      };
    case "edit_table_cell": {
      const target = readRecord(value.target);
      return {
        type: "edit_table_cell",
        target: {
          sectionIndex: readNonNegativeInt(target.sectionIndex, "sectionIndex"),
          parentParagraphIndex: readNonNegativeInt(target.parentParagraphIndex, "parentParagraphIndex"),
          controlIndex: readNonNegativeInt(target.controlIndex, "controlIndex"),
          cellIndex: readNonNegativeInt(target.cellIndex, "cellIndex"),
          cellParagraphIndex: readNonNegativeInt(target.cellParagraphIndex, "cellParagraphIndex"),
          charOffset: readNonNegativeInt(target.charOffset, "charOffset")
        },
        text: readText(value.text)
      };
    }
    case "insert_image": {
      const source = readRecord(value.source);
      const layout = readRecord(value.layout);
      const kind = source.kind === "generated_file" ? "generated_file" : "vault_file";
      return {
        type: "insert_image",
        target: readPosition(value.target),
        source: { kind, path: readText(source.path) },
        layout: {
          width: readPositiveInt(layout.width, "width"),
          height: readPositiveInt(layout.height, "height"),
          description: typeof layout.description === "string" ? layout.description : ""
        }
      };
    }
    case "save_document":
      return { type: "save_document" };
    default:
      throw new Error(`Unsupported operation type: ${value.type}`);
  }
}

function readPosition(value: unknown): DocumentPosition {
  const target = readRecord(value);
  return {
    sectionIndex: readNonNegativeInt(target.sectionIndex, "sectionIndex"),
    paragraphIndex: readNonNegativeInt(target.paragraphIndex, "paragraphIndex"),
    charOffset: readNonNegativeInt(target.charOffset, "charOffset")
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Expected object.");
  return value;
}

function readText(value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") throw new Error("Expected non-empty text.");
  return value;
}

function readString(value: unknown, label: string): string {
  if (typeof value !== "string") throw new Error(`${label} must be a string.`);
  return value;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) throw new Error("Expected string array.");
  return value.map((item) => (typeof item === "string" ? item : String(item ?? "")));
}

function readPositiveInt(value: unknown, label: string): number {
  const numberValue = readNonNegativeInt(value, label);
  if (numberValue <= 0) throw new Error(`${label} must be positive.`);
  return numberValue;
}

function readNonNegativeInt(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
