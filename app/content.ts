export type NoteSection = {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  code?: {
    language: string;
    label: string;
    value: string;
  };
  evidence?: Array<[string, string]>;
};

export type LabNote = {
  slug: string;
  caseId: string;
  title: string;
  summary: string;
  date: string;
  readingTime: string;
  tags: string[];
  classification: string;
  sections: NoteSection[];
};

export const notes: LabNote[] = [
  {
    slug: "staged-loader-static-triage",
    caseId: "CASE-001",
    title: "Unpacking a staged loader without executing it",
    summary:
      "A static-first workflow for recovering an embedded payload, validating its boundaries, and documenting the hand-off between stages.",
    date: "2026.08.17",
    readingTime: "8 min",
    tags: ["pe", "unpacking", "static-analysis"],
    classification: "research note",
    sections: [
      {
        id: "initial-triage",
        title: "Initial triage",
        paragraphs: [
          "The sample presented as a small PE32 executable with an unusually sparse import table and a high-entropy final section. Rather than stepping into it immediately, I treated the file as a container and mapped every region that could plausibly hold a second stage.",
          "The objective was not attribution. It was to produce a reproducible account of what the loader stored, how it transformed that data, and where execution would transfer next.",
        ],
        evidence: [
          ["format", "PE32 / x86"],
          ["imports", "LoadLibraryA, GetProcAddress, VirtualAlloc"],
          ["anomaly", "high-entropy overlay after final section"],
          ["working hypothesis", "embedded second-stage payload"],
        ],
      },
      {
        id: "finding-boundaries",
        title: "Finding the payload boundaries",
        paragraphs: [
          "Cross-references from the entry routine converged on a short loop that read beyond the last mapped section. The loop used a constant-sized key schedule and stopped at a length copied directly from the overlay header.",
          "That gave three independent boundary checks: the overlay offset, the decoded length field, and the allocation size passed to the eventual memory copy. Agreement between all three made extraction possible without running the loader.",
        ],
        bullets: [
          "Record file offsets and virtual addresses separately.",
          "Confirm size fields against both the file length and allocation call.",
          "Hash the original and extracted objects before further transformation.",
        ],
      },
      {
        id: "recovery-script",
        title: "Recovery script",
        paragraphs: [
          "The decoder was small enough to reproduce in a disposable script. The important part was preserving the transformation exactly and refusing malformed sizes instead of attempting a best-effort decode.",
        ],
        code: {
          language: "python",
          label: "extract_stage.py",
          value: `from pathlib import Path\n\nblob = Path("sample.bin").read_bytes()\noffset = 0x6200\nlength = int.from_bytes(blob[offset:offset + 4], "little")\nkey = blob[offset + 4:offset + 20]\nciphertext = blob[offset + 20:offset + 20 + length]\n\nif len(ciphertext) != length:\n    raise ValueError("truncated stage")\n\nstage = bytes(value ^ key[index % len(key)]\n              for index, value in enumerate(ciphertext))\nPath("stage.recovered.bin").write_bytes(stage)`,
        },
      },
      {
        id: "result",
        title: "Result and confidence",
        paragraphs: [
          "The recovered object began with a valid PE signature and contained the networking imports absent from the loader. Its entry point matched the destination of the final indirect call after relocation. Those facts support the staged-loader hypothesis without requiring live execution.",
          "A sandbox run would still be useful for observing configuration and command-and-control behavior, but it is no longer needed to explain the first-stage mechanics.",
        ],
      },
    ],
  },
  {
    slug: "opaque-predicate-cfg",
    caseId: "CASE-002",
    title: "Tracing an opaque predicate through a flattened CFG",
    summary:
      "How I reduced a noisy dispatcher loop into a small set of meaningful state transitions and rebuilt the function's control flow.",
    date: "2026.08.04",
    readingTime: "11 min",
    tags: ["deobfuscation", "cfg", "x64"],
    classification: "reverse engineering",
    sections: [
      {
        id: "symptom",
        title: "The symptom",
        paragraphs: [
          "The target function contained dozens of basic blocks, but nearly every block returned to the same switch-like dispatcher. Conventional graph view emphasized the noise: repeated compare-and-branch sequences, state writes, and edges that appeared feasible but were never selected.",
          "I stopped treating the dispatcher as ordinary control flow and instead modeled it as a state machine. Each block became a transition from an incoming state value to one or more outgoing values.",
        ],
      },
      {
        id: "predicate",
        title: "Proving the predicate",
        paragraphs: [
          "One branch depended on an arithmetic expression over a value already constrained to a byte. Exhaustive evaluation over that domain showed one side was unreachable. A symbolic proof was possible, but a tiny domain table was faster to review and easier to attach to the case notes.",
        ],
        code: {
          language: "python",
          label: "predicate_check.py",
          value: `def branch(value: int) -> bool:\n    value &= 0xff\n    return ((value * value + value) & 1) == 1\n\nreachable = [value for value in range(256) if branch(value)]\nassert reachable == []`,
        },
      },
      {
        id: "reconstruction",
        title: "Reconstructing the graph",
        bullets: [
          "Name dispatcher states by behavior, not by their numeric constants.",
          "Remove transitions guarded by proven-invariant predicates.",
          "Collapse blocks that only assign the next state.",
          "Re-run data-flow analysis on the simplified graph.",
        ],
        paragraphs: [
          "After eliminating impossible transitions and collapsing pure state assignments, the apparent maze reduced to a validation routine with four decisions and a single error exit. Renaming around those decisions made the remaining data flow readable without patching the binary.",
        ],
      },
      {
        id: "lesson",
        title: "What transferred",
        paragraphs: [
          "The useful technique was not a particular deobfuscator. It was changing representations: from a hostile control-flow graph to a small transition table. That shift made invariants visible and created a reviewable path from observation to conclusion.",
        ],
      },
    ],
  },
  {
    slug: "yara-config-infostealer",
    caseId: "CASE-003",
    title: "Designing a resilient YARA rule around a config decoder",
    summary:
      "A detection note focused on stable implementation details instead of family names, packed-byte signatures, or disposable infrastructure.",
    date: "2026.07.22",
    readingTime: "7 min",
    tags: ["yara", "detection", "configuration"],
    classification: "detection engineering",
    sections: [
      {
        id: "goal",
        title: "Detection goal",
        paragraphs: [
          "The sample family changed packers and network indicators frequently, so a useful rule had to live below those layers. The most stable candidate was its configuration decoder: a short routine that located a marker, decoded length-prefixed fields, and validated the result with a fixed checksum step.",
          "I treated the rule as a hypothesis about implementation behavior, then assembled a small clean and malicious corpus to measure how well that hypothesis held.",
        ],
      },
      {
        id: "rule",
        title: "Rule sketch",
        code: {
          language: "yara",
          label: "config_decoder.yar",
          value: `rule Config_Decoder_Structure\n{\n  meta:\n    author = "[ blank ]"\n    purpose = "portfolio example"\n\n  strings:\n    $marker = { 43 46 47 00 01 ?? ?? 00 }\n    $decode = { 0F B6 ?? ?? 33 ?? 88 ?? ?? 48 FF C? }\n\n  condition:\n    uint16(0) == 0x5A4D and\n    filesize < 2MB and\n    $marker and $decode\n}`,
        },
        paragraphs: [
          "The byte sequences above are illustrative portfolio data rather than a production signature. A real rule would include corpus-backed comments, known-good testing, and a versioned source set.",
        ],
      },
      {
        id: "quality",
        title: "Quality checks",
        bullets: [
          "Prefer two independent implementation anchors over one long sequence.",
          "Document which compiler variations were tested.",
          "Track false positives as first-class case evidence.",
          "Keep infrastructure indicators outside the core family rule.",
        ],
      },
      {
        id: "outcome",
        title: "Outcome",
        paragraphs: [
          "The final detection survived the alternate packer in the test set because it targeted the unpacked decoder body, while the corpus test exposed one benign collision that led to a tighter marker constraint. The result was smaller, clearer, and easier to maintain than the initial family-wide signature.",
        ],
      },
    ],
  },
];

export const projects = [
  {
    code: "LAB-01",
    title: "PE triage pipeline",
    description:
      "A reproducible static-analysis workflow for metadata, imports, entropy, strings, and suspicious region extraction.",
    tags: ["python", "pefile", "triage"],
    status: "documented",
  },
  {
    code: "LAB-02",
    title: "String deobfuscation harness",
    description:
      "Small emulation adapters for lifting common stack-string and rolling-XOR routines out of noisy binaries.",
    tags: ["emulation", "deobfuscation", "x64"],
    status: "research",
  },
  {
    code: "LAB-03",
    title: "Memory artifact notebook",
    description:
      "A case-oriented collection of Volatility queries, process-tree pivots, and evidence-preserving export steps.",
    tags: ["memory", "dfir", "windows"],
    status: "in progress",
  },
];

export const capabilities = [
  ["static analysis", "PE structure, imports, strings, resources, packer clues"],
  ["dynamic analysis", "isolated execution, API traces, behavioral timelines"],
  ["deobfuscation", "control-flow recovery, string decoders, config extraction"],
  ["detection", "YARA design, IOC context, repeatable validation"],
];
