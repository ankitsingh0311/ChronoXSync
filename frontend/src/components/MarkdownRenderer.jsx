// =============================================================================
// ChronoSync 3D — Luxury MarkdownRenderer.jsx
// =============================================================================
// Renders academic responses, mathematical models, algorithms, tables,
// and code snippets into ultra-luxurious, readable 3D UI blocks.
// =============================================================================

import React, { useState } from 'react';
import { Copy, Check, Terminal, FileCode, Sparkles } from 'lucide-react';

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const blocks = parseBlocks(content);

  return (
    <div className={`space-y-3.5 leading-relaxed text-sm ${className}`} style={{ color: 'inherit' }}>
      {blocks.map((block, idx) => (
        <BlockItem key={idx} block={block} />
      ))}
    </div>
  );
}

function BlockItem({ block }) {
  const [copied, setCopied] = useState(false);

  switch (block.type) {
    case 'code': {
      const handleCopy = () => {
        navigator.clipboard.writeText(block.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };

      const lang = block.language?.toLowerCase() || 'code';

      return (
        <div className="my-3.5 rounded-xl overflow-hidden border border-white/12 bg-[#090a10] shadow-xl font-mono text-xs">
          {/* Luxury Metallic Code Header */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-[#121420] border-b border-white/10 text-white/60">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <span className="flex items-center gap-1.5 uppercase font-semibold text-[11px] tracking-wider text-amber-400">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                {lang}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] hover:text-white bg-white/5 hover:bg-white/10 transition border border-white/10 text-white/70"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 overflow-x-auto text-[#f1f5f9] leading-relaxed whitespace-pre font-mono text-[12.5px] bg-[#07080d]/80 selection:bg-amber-500/30">
            <code>{block.code}</code>
          </pre>
        </div>
      );
    }

    case 'h1':
      return (
        <h1 className="text-xl sm:text-2xl font-bold font-outfit tracking-tight text-white mt-4 mb-2 pb-1.5 border-b border-white/10 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
          <InlineRenderer text={block.text} />
        </h1>
      );

    case 'h2':
      return (
        <h2 className="text-lg sm:text-xl font-bold font-outfit tracking-tight text-[#f8fafc] mt-3.5 mb-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
          <InlineRenderer text={block.text} />
        </h2>
      );

    case 'h3':
      return (
        <h3 className="text-base sm:text-lg font-semibold font-outfit text-white/95 mt-3 mb-1 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <InlineRenderer text={block.text} />
        </h3>
      );

    case 'h4':
      return (
        <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-300/90 mt-2.5 mb-1 font-mono">
          <InlineRenderer text={block.text} />
        </h4>
      );

    case 'blockquote':
      return (
        <div className="my-2.5 p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-3 border-amber-400 text-xs sm:text-sm text-amber-100/90 shadow-sm backdrop-blur-xs">
          <InlineRenderer text={block.text} />
        </div>
      );

    case 'list':
      return (
        <ul className="my-2.5 space-y-2 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
              <div className="flex-1 leading-relaxed">
                <InlineRenderer text={item} />
              </div>
            </li>
          ))}
        </ul>
      );

    case 'ordered-list':
      return (
        <ol className="my-2.5 space-y-2.5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
              <span className="font-outfit text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 rounded-md w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                {i + 1}
              </span>
              <div className="flex-1 leading-relaxed">
                <InlineRenderer text={item} />
              </div>
            </li>
          ))}
        </ol>
      );

    case 'table':
      return (
        <div className="my-3.5 overflow-x-auto rounded-xl border border-white/12 shadow-lg bg-[#0e101a]/70 backdrop-blur-xs">
          <table className="w-full border-collapse text-left text-xs font-mono">
            <thead>
              <tr className="bg-white/8 border-b border-white/12 text-amber-300">
                {block.headers.map((h, i) => (
                  <th key={i} className="p-2.5 font-semibold uppercase tracking-wider text-[11px]">
                    <InlineRenderer text={h.trim()} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-white/6 hover:bg-white/[0.04] transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 text-slate-300">
                      <InlineRenderer text={cell.trim()} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'paragraph':
    default:
      if (!block.text.trim()) return null;
      return (
        <p className="my-1.5 text-xs sm:text-sm leading-relaxed text-slate-200 font-normal">
          <InlineRenderer text={block.text} />
        </p>
      );
  }
}

// Inline formatting: **bold**, *italic*, `code`, and plain text
function InlineRenderer({ text }) {
  if (!text) return null;

  const tokens = [];
  let remaining = text;
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(remaining)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', val: remaining.substring(lastIndex, match.index) });
    }

    const tokenText = match[0];
    if (tokenText.startsWith('`') && tokenText.endsWith('`')) {
      tokens.push({ type: 'code', val: tokenText.slice(1, -1) });
    } else if (tokenText.startsWith('**') && tokenText.endsWith('**')) {
      tokens.push({ type: 'bold', val: tokenText.slice(2, -2) });
    } else if (tokenText.startsWith('*') && tokenText.endsWith('*')) {
      tokens.push({ type: 'italic', val: tokenText.slice(1, -1) });
    } else {
      tokens.push({ type: 'text', val: tokenText });
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < remaining.length) {
    tokens.push({ type: 'text', val: remaining.substring(lastIndex) });
  }

  return (
    <>
      {tokens.map((tok, i) => {
        if (tok.type === 'code') {
          return (
            <code
              key={i}
              className="px-1.5 py-0.5 mx-0.5 rounded text-[11.5px] font-mono bg-white/10 text-amber-300 border border-white/15 shadow-xs"
            >
              {tok.val}
            </code>
          );
        }
        if (tok.type === 'bold') {
          return (
            <strong key={i} className="font-semibold text-white">
              {tok.val}
            </strong>
          );
        }
        if (tok.type === 'italic') {
          return (
            <em key={i} className="italic text-slate-300">
              {tok.val}
            </em>
          );
        }
        return <span key={i}>{tok.val}</span>;
      })}
    </>
  );
}

// Block parser for code blocks, lists, headings, and paragraphs
function parseBlocks(markdown) {
  const lines = markdown.split(/\r?\n/);
  const blocks = [];
  let inCode = false;
  let codeBuffer = [];
  let codeLang = '';
  let inList = false;
  let listItems = [];
  let inOrderedList = false;
  let orderedListItems = [];
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      blocks.push({ type: 'list', items: [...listItems] });
      listItems = [];
      inList = false;
    }
  };

  const flushOrderedList = () => {
    if (inOrderedList && orderedListItems.length > 0) {
      blocks.push({ type: 'ordered-list', items: [...orderedListItems] });
      orderedListItems = [];
      inOrderedList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableHeaders.length > 0) {
      blocks.push({ type: 'table', headers: [...tableHeaders], rows: [...tableRows] });
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Code block check
    if (trimmed.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', language: codeLang, code: codeBuffer.join('\n') });
        codeBuffer = [];
        codeLang = '';
        inCode = false;
      } else {
        flushList();
        flushOrderedList();
        flushTable();
        inCode = true;
        codeLang = trimmed.slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // Markdown Table check
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushList();
      flushOrderedList();
      const cells = trimmed
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim());

      // If separator line |---|---|
      if (cells.every((c) => /^:?-+:?$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    // Unordered List check
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushOrderedList();
      inList = true;
      listItems.push(trimmed.slice(2));
      continue;
    } else {
      flushList();
    }

    // Ordered List check
    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      flushList();
      inOrderedList = true;
      orderedListItems.push(orderedMatch[2]);
      continue;
    } else {
      flushOrderedList();
    }

    // Headings
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: trimmed.slice(5) });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4) });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3) });
      continue;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2) });
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'blockquote', text: trimmed.slice(2) });
      continue;
    }

    // Paragraph
    if (trimmed.length > 0) {
      blocks.push({ type: 'paragraph', text: trimmed });
    }
  }

  flushList();
  flushOrderedList();
  flushTable();

  if (inCode && codeBuffer.length > 0) {
    blocks.push({ type: 'code', language: codeLang, code: codeBuffer.join('\n') });
  }

  return blocks;
}
