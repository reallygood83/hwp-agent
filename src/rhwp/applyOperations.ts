import { FileSystemAdapter, TFile, type App } from "obsidian";
import { HwpDocument } from "@rhwp/core";
import type { RhwpOperation, RhwpOperationEnvelope } from "./operations";

export interface AppliedRhwpOperation {
  index: number;
  type: RhwpOperation["type"];
  result: unknown;
}

export interface ApplyRhwpOperationEnvelopeOptions {
  app: App;
  file: TFile;
  envelope: RhwpOperationEnvelope;
}

export async function applyRhwpOperationEnvelope({
  app,
  file,
  envelope
}: ApplyRhwpOperationEnvelopeOptions): Promise<AppliedRhwpOperation[]> {
  const buffer = await app.vault.readBinary(file);
  const doc = new HwpDocument(new Uint8Array(buffer));
  const applied: AppliedRhwpOperation[] = [];

  try {
    tryJson(doc.convertToEditable());

    for (let index = 0; index < envelope.operations.length; index += 1) {
      const operation = envelope.operations[index];
      const result = await applyOperation(app, file, doc, operation);
      applied.push({ index, type: operation.type, result });
    }

    const bytes = file.extension.toLowerCase() === "hwpx" ? doc.exportHwpx() : doc.exportHwp();
    await app.vault.modifyBinary(file, toArrayBuffer(bytes));
    return applied;
  } finally {
    doc.free();
  }
}

async function applyOperation(
  app: App,
  file: TFile,
  doc: HwpDocument,
  operation: RhwpOperation
): Promise<unknown> {
  switch (operation.type) {
    case "insert_text":
      return tryJson(
        doc.insertText(
          operation.target.sectionIndex,
          operation.target.paragraphIndex,
          operation.target.charOffset,
          operation.text
        )
      );
    case "replace_text": {
      const deleted = tryJson(
        doc.deleteText(
          operation.target.sectionIndex,
          operation.target.paragraphIndex,
          operation.target.charOffset,
          operation.target.length
        )
      );
      const inserted = tryJson(
        doc.insertText(
          operation.target.sectionIndex,
          operation.target.paragraphIndex,
          operation.target.charOffset,
          operation.text
        )
      );
      return { deleted, inserted };
    }
    case "replace_selection":
      return replaceSelectedText(doc, operation.selectedText, operation.replacement, operation.occurrence ?? 1);
    case "create_table": {
      const created = tryJson(
        doc.createTable(
          operation.target.sectionIndex,
          operation.target.paragraphIndex,
          operation.target.charOffset,
          operation.rows,
          operation.cols
        )
      );
      const tableRef = readCreatedTableRef(created, operation.target.paragraphIndex);

      for (let rowIndex = 0; rowIndex < operation.rows; rowIndex += 1) {
        for (let colIndex = 0; colIndex < operation.cols; colIndex += 1) {
          const text = operation.cells?.[rowIndex]?.[colIndex];
          if (!text) continue;
          const cellIndex = rowIndex * operation.cols + colIndex;
          doc.insertTextInCell(operation.target.sectionIndex, tableRef.paraIdx, tableRef.controlIdx, cellIndex, 0, 0, text);
        }
      }

      return created;
    }
    case "edit_table_cell":
      return tryJson(
        doc.insertTextInCell(
          operation.target.sectionIndex,
          operation.target.parentParagraphIndex,
          operation.target.controlIndex,
          operation.target.cellIndex,
          operation.target.cellParagraphIndex,
          operation.target.charOffset,
          operation.text
        )
      );
    case "insert_image": {
      const imageBytes = await readImageBytes(app, file, operation.source.path);
      if (operation.source.kind === "generated_file") {
        assertGeneratedImageLooksReal(imageBytes, operation.source.path);
      }
      const extension = detectImageExtension(imageBytes, operation.source.path);
      return tryJson(
        doc.insertPicture(
          operation.target.sectionIndex,
          operation.target.paragraphIndex,
          operation.target.charOffset,
          new Uint8Array(imageBytes),
          operation.layout.width,
          operation.layout.height,
          operation.layout.width,
          operation.layout.height,
          extension,
          operation.layout.description
        )
      );
    }
    case "save_document":
      return { ok: true, skipped: true };
  }
}

function replaceSelectedText(
  doc: HwpDocument,
  selectedText: string,
  replacement: string,
  occurrence: number
): unknown {
  const target = findTextOccurrence(doc, selectedText, occurrence);
  if (!target) {
    throw new Error("Selected text was not found in this HWP/HWPX document.");
  }

  const deleted = tryJson(doc.deleteText(target.sectionIndex, target.paragraphIndex, target.charOffset, selectedText.length));
  const inserted = replacement
    ? tryJson(doc.insertText(target.sectionIndex, target.paragraphIndex, target.charOffset, replacement))
    : { ok: true, skipped: true };

  return { ...target, deleted, inserted };
}

function findTextOccurrence(
  doc: HwpDocument,
  needle: string,
  occurrence: number
): { sectionIndex: number; paragraphIndex: number; charOffset: number; occurrence: number } | null {
  let seen = 0;
  const sectionCount = getSectionCount(doc);
  for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex += 1) {
    const paragraphCount = safeNumber(() => doc.getParagraphCount(sectionIndex), 0);
    for (let paragraphIndex = 0; paragraphIndex < paragraphCount; paragraphIndex += 1) {
      const length = safeNumber(() => doc.getParagraphLength(sectionIndex, paragraphIndex), 0);
      if (length <= 0) continue;

      const text = safeString(() => doc.getTextRange(sectionIndex, paragraphIndex, 0, length));
      let start = 0;
      while (start <= text.length) {
        const charOffset = text.indexOf(needle, start);
        if (charOffset < 0) break;
        seen += 1;
        if (seen === occurrence) {
          return { sectionIndex, paragraphIndex, charOffset, occurrence: seen };
        }
        start = charOffset + Math.max(needle.length, 1);
      }
    }
  }
  return null;
}

async function readImageBytes(app: App, currentFile: TFile, sourcePath: string): Promise<ArrayBuffer> {
  const candidates = buildImagePathCandidates(currentFile, sourcePath);

  for (const candidate of candidates) {
    const abstractFile = app.vault.getAbstractFileByPath(candidate);
    if (abstractFile instanceof TFile) {
      return app.vault.readBinary(abstractFile);
    }
    if (await app.vault.adapter.exists(candidate)) {
      return app.vault.adapter.readBinary(candidate);
    }
  }

  throw new Error(`Image file not found in vault: ${sourcePath}`);
}

function assertGeneratedImageLooksReal(imageBytes: ArrayBuffer, sourcePath: string): void {
  const minGeneratedImageBytes = 1024;
  if (imageBytes.byteLength >= minGeneratedImageBytes) return;
  throw new Error(
    `Generated image is too small (${imageBytes.byteLength} bytes): ${sourcePath}. ` +
    "Codex likely created a placeholder instead of a real generated image. Try again after enabling a real Codex image-generation tool/model."
  );
}

function buildImagePathCandidates(currentFile: TFile, sourcePath: string): string[] {
  const normalizedInput = sourcePath.trim().replace(/\\/g, "/");
  const normalized = toVaultRelativePath(currentFile, normalizedInput) ?? normalizedInput.replace(/^\/+/, "");
  const parentPath = currentFile.parent?.path;
  const candidates = [normalized];

  if (parentPath && parentPath !== "/") {
    candidates.push(`${parentPath}/${normalized}`);
  }

  return [...new Set(candidates.map((candidate) => candidate.replace(/\/+/g, "/")))];
}

function toVaultRelativePath(currentFile: TFile, sourcePath: string): string | null {
  const adapter = currentFile.vault.adapter;
  const basePath =
    adapter instanceof FileSystemAdapter
      ? adapter.getBasePath()
      : "getBasePath" in adapter && typeof adapter.getBasePath === "function"
        ? adapter.getBasePath()
        : "basePath" in adapter && typeof adapter.basePath === "string"
          ? adapter.basePath
          : "";
  if (!basePath) return null;

  const normalizedBasePath = basePath.replace(/\\/g, "/").replace(/\/+$/, "");
  if (sourcePath === normalizedBasePath) return "";
  if (!sourcePath.startsWith(`${normalizedBasePath}/`)) return null;
  return sourcePath.slice(normalizedBasePath.length + 1);
}

function detectImageExtension(imageBytes: ArrayBuffer, sourcePath: string): string {
  const bytes = new Uint8Array(imageBytes);
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpg";
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "png";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "gif";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return getExtension(sourcePath) || "png";
}

function readCreatedTableRef(value: unknown, fallbackParaIdx: number): { paraIdx: number; controlIdx: number } {
  if (isRecord(value)) {
    return {
      paraIdx: readNumber(value.paraIdx, fallbackParaIdx),
      controlIdx: readNumber(value.controlIdx, 0)
    };
  }
  return { paraIdx: fallbackParaIdx, controlIdx: 0 };
}

function tryJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getSectionCount(doc: HwpDocument): number {
  const candidate = doc as HwpDocument & {
    getSectionCount?: () => number;
    sectionCount?: () => number;
  };
  if (typeof candidate.getSectionCount === "function") {
    return safeNumber(() => candidate.getSectionCount?.() ?? 1, 1);
  }
  if (typeof candidate.sectionCount === "function") {
    return safeNumber(() => candidate.sectionCount?.() ?? 1, 1);
  }
  return 1;
}

function safeNumber(read: () => number, fallback: number): number {
  try {
    const value = read();
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function safeString(read: () => string): string {
  try {
    return read();
  } catch {
    return "";
  }
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getExtension(path: string): string {
  const name = path.split(/[\\/]/).pop() || "";
  const dotIndex = name.lastIndexOf(".");
  return dotIndex >= 0 ? name.slice(dotIndex + 1).toLowerCase() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}
