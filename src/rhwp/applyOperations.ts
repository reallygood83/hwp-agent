import { TFile, type App } from "obsidian";
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
      const extension = getExtension(operation.source.path) || "png";
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

function buildImagePathCandidates(currentFile: TFile, sourcePath: string): string[] {
  const normalized = sourcePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const parentPath = currentFile.parent?.path;
  const candidates = [normalized];

  if (parentPath && parentPath !== "/") {
    candidates.push(`${parentPath}/${normalized}`);
  }

  return [...new Set(candidates.map((candidate) => candidate.replace(/\/+/g, "/")))];
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
