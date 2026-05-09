const parseArpabet = (str) => {
  return str.trim().split(/\s+/).map(raw => {
    if (raw === '-' || raw === '--') return { phoneme: null, base: null, silent: true, ghost: false, stress: 0 };
    if (raw.startsWith('+')) {
        const clean = raw.replace(/^\+/, '').replace(/^\.+/, '');
        const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
        const phoneme = clean.replace(/[012]$/, '');
        const base = phoneme.replace(/[^A-Z]/gi, '').toUpperCase();
        return { phoneme, base, silent: false, ghost: true, stress };
    }
    const clean = raw.replace(/^\.+/, '');
    const stress = parseInt(clean.match(/([012])$/)?.[1] ?? '0');
    const phoneme = clean.replace(/[012]$/, '');
    const base = phoneme.replace(/[^A-Z]/gi, '').toUpperCase();
    return { phoneme, base, silent: false, ghost: false, stress };
  });
};

const alignWord = (word, arpa) => {
  const allTokens = parseArpabet(arpa);
  const chars = [...word];
  const aligned = [];
  
  let charIdx = 0;
  for (let i = 0; i < allTokens.length; i++) {
    const t = allTokens[i];
    if (t.ghost) {
      aligned.push({ char: null, ...t });
    } else {
      aligned.push({ char: chars[charIdx] || null, ...t });
      charIdx++;
    }
  }
  
  for (let i = charIdx; i < chars.length; i++) {
    aligned.push({ char: chars[i], phoneme: null, silent: true, stress: 0, ghost: false });
  }
  
  return aligned;
};

console.log(alignWord("example", "IH G^.Z AE1 M .P +AX L -"));
console.log(alignWord("one", "+W AH N -"));
