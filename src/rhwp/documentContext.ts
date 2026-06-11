import type { HwpDocument } from "@rhwp/core";

export interface RhwpParagraphContext {
  sectionIndex: number;
  paragraphIndex: number;
  textPreview: string;
  charCount: number;
}

export interface RhwpTableContext {
  sectionIndex: number;
  parentParagraphIndex: number;
  controlIndex: number;
  rows: number | null;
  cols: number | null;
}

export interface RhwpImageContext {
  sectionIndex: number;
  parentParagraphIndex: number;
  controlIndex: number;
  mime: string | null;
  description: string;
}

export interface RhwpDocumentContext {
  fileName: string;
  extension: string;
  pageCount: number;
  paragraphs: RhwpParagraphContext[];
  tables: RhwpTableContext[];
  images: RhwpImageContext[];
  truncated: boolean;
}

const DEFAULT_MAX_PARAGRAPHS = 120;
const DEFAULT_TEXT_PREVIEW_LENGTH = 240;

export function extractRhwpDocumentContext(
  doc: HwpDocument,
  fileName: string,
  options: { maxParagraphs?: number; textPreviewLength?: number } = {}
): RhwpDocumentContext {
  const maxParagraphs = options.maxParagraphs ?? DEFAULT_MAX_PARAGRAPHS;
  const textPreviewLength = options.textPreviewLength ?? DEFAULT_TEXT_PREVIEW_LENGTH;
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const pageCount = getPageCount(doc);
  const paragraphs = extractParagraphs(doc, maxParagraphs, textPreviewLength);
  return {
    fileName,
    extension,
    pageCount,
    paragraphs,
    tables: [],
    images: [],
    truncated: paragraphs.length >= maxParagraphs
  };
}

function extractParagraphs(
  doc: HwpDocument,
  maxParagraphs: number,
  textPreviewLength: number
): RhwpParagraphContext[] {
  const paragraphs: RhwpParagraphContext[] = [];
  const sectionCount = getSectionCount(doc);
  for (let sectionIndex = 0; sectionIndex < sectionCount; sectionIndex += 1) {
    const paragraphCount = safeNumber(() => doc.getParagraphCount(sectionIndex), 0);
    for (let paragraphIndex = 0; paragraphIndex < paragraphCount; paragraphIndex += 1) {
      if (paragraphs.length >= maxParagraphs) return paragraphs;
      const length = safeNumber(() => doc.getParagraphLength(sectionIndex, paragraphIndex), 0);
      const text = safeString(() =>
        doc.getTextRange(sectionIndex, paragraphIndex, 0, Math.min(length, textPreviewLength))
      );
      paragraphs.push({
        sectionIndex,
        paragraphIndex,
        textPreview: text.replace(/\s+/g, " ").trim(),
        charCount: length
      });
    }
  }
  return paragraphs;
}

function getPageCount(doc: HwpDocument): number {
  const candidate = doc as HwpDocument & {
    pageCount?: () => number;
    getPageCount?: () => number;
  };
  if (typeof candidate.pageCount === "function") {
    return safeNumber(() => candidate.pageCount?.() ?? 1, 1);
  }
  if (typeof candidate.getPageCount === "function") {
    return safeNumber(() => candidate.getPageCount?.() ?? 1, 1);
  }
  return 1;
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

