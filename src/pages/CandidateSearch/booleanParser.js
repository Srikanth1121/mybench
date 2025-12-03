// booleanParser.js
// Improved Boolean parser with support for:
// - quoted phrases
// - parentheses
// - NOT (unary), AND, OR with correct precedence (NOT > AND > OR)
// - implicit AND insertion (fixes cases like: "A" NOT "B" -> "A" AND NOT "B")
// - returns { groups: [{ and:[], not:[] }], and:[], or:[], not:[] }
// - LinkedIn-style GLOBAL NOT inheritance

export function parseBooleanQuery(rawQuery) {
  if (!rawQuery || !rawQuery.toString().trim()) {
    return { groups: [], and: [], or: [], not: [] };
  }

  const input = rawQuery.toString().trim();

  // -----------------------
  // TOKENIZER
  // -----------------------
  function tokenize(q) {
    const tokens = [];
    const re = /\s*("([^"]+)"|\(|\)|\bAND\b|\bOR\b|\bNOT\b|[^\s()"]+)\s*/gi;
    let m;
    while ((m = re.exec(q)) !== null) {
      const raw = m[1];
      if (!raw) continue;
      const upper = raw.toUpperCase();
      if (raw === "(") {
        tokens.push({ type: "LPAR", value: "(" });
      } else if (raw === ")") {
        tokens.push({ type: "RPAR", value: ")" });
      } else if (["AND", "OR", "NOT"].includes(upper)) {
        tokens.push({ type: "OP", value: upper });
      } else if (m[2] !== undefined) {
        const phrase = m[2].trim().replace(/\s+/g, " ").toLowerCase();
        tokens.push({ type: "TERM", value: phrase });
      } else {
        tokens.push({ type: "TERM", value: raw.toLowerCase().trim() });
      }
    }
    return tokens;
  }

  let rawTokens = tokenize(input);
  if (!rawTokens.length) return { groups: [], and: [], or: [], not: [] };

  // -----------------------
  // INSERT IMPLICIT ANDs
  // If previous token is TERM or RPAR and next token is TERM, LPAR, or OP(NOT)
  // then inject an implicit AND between them.
  // -----------------------
  function insertImplicitAnds(tokens) {
    const out = [];
    const isPrevOperand = (t) => t && (t.type === "TERM" || t.type === "RPAR");
    const isNextStartOperand = (t) =>
      t && (t.type === "TERM" || t.type === "LPAR" || (t.type === "OP" && t.value === "NOT"));
    for (let i = 0; i < tokens.length; i++) {
      const tk = tokens[i];
      const prev = out.length ? out[out.length - 1] : null;
      if (prev && isPrevOperand(prev) && isNextStartOperand(tk)) {
        out.push({ type: "OP", value: "AND" });
      }
      out.push(tk);
    }
    return out;
  }

  rawTokens = insertImplicitAnds(rawTokens);

  // -----------------------
  // INFIX → POSTFIX (RPN)
  // -----------------------
  function toPostfix(tokens) {
    const prec = { NOT: 3, AND: 2, OR: 1 };
    const assoc = { NOT: "right", AND: "left", OR: "left" };
    const out = [];
    const ops = [];

    for (let tk of tokens) {
      if (tk.type === "TERM") {
        out.push(tk);
      } else if (tk.type === "OP") {
        const op = tk.value;
        while (ops.length) {
          const top = ops[ops.length - 1];
          if (top.type !== "OP") break;
          const topOp = top.value;
          const shouldPop =
            (assoc[op] === "left" && prec[op] <= prec[topOp]) ||
            (assoc[op] === "right" && prec[op] < prec[topOp]);
          if (shouldPop) out.push(ops.pop());
          else break;
        }
        ops.push(tk);
      } else if (tk.type === "LPAR") {
        ops.push(tk);
      } else if (tk.type === "RPAR") {
        while (ops.length && ops[ops.length - 1].type !== "LPAR") {
          out.push(ops.pop());
        }
        if (ops.length && ops[ops.length - 1].type === "LPAR") ops.pop();
      }
    }

    while (ops.length) {
      const t = ops.pop();
      if (t.type !== "LPAR" && t.type !== "RPAR") out.push(t);
    }

    return out;
  }

  const postfix = toPostfix(rawTokens);

  // -----------------------
  // POSTFIX → AST
  // -----------------------
  function buildAST(postfix) {
    const st = [];
    for (const tk of postfix) {
      if (tk.type === "TERM") {
        st.push({ type: "TERM", value: tk.value });
      } else if (tk.type === "OP") {
        const op = tk.value;
        if (op === "NOT") {
          const child = st.pop();
          if (child) st.push({ type: "NOT", child });
        } else if (op === "AND" || op === "OR") {
          const right = st.pop();
          const left = st.pop();
          if (left && right) st.push({ type: op, left, right });
          else if (right) st.push(right);
          else if (left) st.push(left);
        }
      }
    }
    return st.length ? st[0] : null;
  }

  const ast = buildAST(postfix);
  if (!ast) return { groups: [], and: [], or: [], not: [] };

  // -----------------------
  // AST → OR GROUPS
  // -----------------------
  function collectGroups(node) {
    if (!node) return [];
    if (node.type === "OR") {
      return [...collectGroups(node.left), ...collectGroups(node.right)];
    }
    return [flatten(node)];
  }

  function flatten(node) {
    const out = { and: [], not: [] };

    function walk(n) {
      if (!n) return;
      if (n.type === "TERM") {
        out.and.push(n.value);
      } else if (n.type === "AND") {
        walk(n.left);
        walk(n.right);
      } else if (n.type === "NOT") {
        const terms = collectTerms(n.child);
        out.not.push(...terms);
      } else if (n.type === "OR") {
        out.and.push(...collectTerms(n.left), ...collectTerms(n.right));
      }
    }

    walk(node);
    out.and = [...new Set(out.and)];
    out.not = [...new Set(out.not)];
    return out;
  }

  function collectTerms(node) {
    const out = [];
    (function walk(n) {
      if (!n) return;
      if (n.type === "TERM") out.push(n.value);
      if (n.left) walk(n.left);
      if (n.right) walk(n.right);
      if (n.child) walk(n.child);
    })(node);
    return [...new Set(out)];
  }

  let groups = collectGroups(ast);
  groups = groups.filter((g) => (g.and && g.and.length) || (g.not && g.not.length));

  // implicit OR when no operators typed at all: make each word an OR-group (preserve NOTs)
  const hasOp = /(\bAND\b|\bOR\b|\bNOT\b)/i.test(input);

  if (!hasOp && groups.length > 0) {
    const flatAnd = groups.flatMap((g) => g.and).filter(Boolean);
    const flatNot = groups.flatMap((g) => g.not).filter(Boolean);
    if (flatAnd.length > 1) {
      const newGroups = flatAnd.map((t) => ({ and: [t], not: [...new Set(flatNot)] }));
      return {
        groups: newGroups,
        and: [],
        or: flatAnd,
        not: [...new Set(flatNot)],
      };
    }
  }

  // LinkedIn-style global NOT
  const allNot = [...new Set(groups.flatMap((g) => g.not || []))];
  if (allNot.length > 0) {
    groups = groups.map((g) => ({
      and: g.and || [],
      not: [...new Set([...(g.not || []), ...allNot])],
    }));
  }

  // legacy convenience arrays
  const legacyAnd = [];
  const legacyOr = [];
  const legacyNot = [];

  if (groups.length === 1) {
    legacyAnd.push(...(groups[0].and || []));
    legacyNot.push(...(groups[0].not || []));
  } else {
    const isSimpleOR = groups.every((g) => (g.and && g.and.length === 1) && (!g.not || g.not.length === 0));
    if (isSimpleOR) {
      groups.forEach((g) => legacyOr.push(g.and[0]));
    } else {
      groups.forEach((g) => {
        legacyAnd.push(...(g.and || []));
        legacyNot.push(...(g.not || []));
      });
    }
  }

  return {
    groups,
    and: [...new Set(legacyAnd)],
    or: [...new Set(legacyOr)],
    not: [...new Set(legacyNot)],
  };
}
