const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '=== Design Token & Style Linter ===');

// List of allowed project custom color keywords (from tailwind.config.js)
const allowedCustomColors = [
  'luxuryBlack', 'luxuryCoal', 'luxuryBronze', 'luxuryGold', 'luxuryGoldLight', 'luxuryGoldDark', 'luxuryAmber', 'brandCyan', 'inkBlue', 'mutedGrey',
  'floxMidnightInk', 'floxSnowWhite', 'floxSlateGray', 'floxAnthracite', 'floxLightFog', 'floxObsidianBlack', 'floxElectricViolet', 'floxVividRose',
  'nexoraCanvas', 'nexoraSurface', 'nexoraSurfaceMuted', 'nexoraBorder', 'nexoraRule', 'nexoraText', 'nexoraMuted', 'nexoraSubtle', 'nexoraSidebar',
  'nexoraSidebarPanel', 'nexoraBrand', 'nexoraBrandDark', 'nexoraBrandSoft', 'nexoraSuccess', 'nexoraWarning', 'nexoraDanger', 'nexoraTeal', 'nexoraLavender',
  'white', 'black', 'transparent', 'current', 'inherit'
];

// List of standard generic tailwind colors to flag as non-design-token
const genericTailwindColors = [
  'slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green',
  'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose'
];

try {
  let diffOutput = '';
  try {
    diffOutput = execSync('git diff --name-only HEAD', { encoding: 'utf8' });
  } catch (err) {
    console.warn('Could not run git diff. Scanning all files in src/components...');
    // Fallback: search all JSX/JS files in src/components
    const walk = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(file));
        } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.ts')) {
          results.push(file);
        }
      });
      return results;
    };
    if (fs.existsSync('src')) {
      diffOutput = walk('src').join('\n');
    }
  }

  const files = diffOutput
    .split('\n')
    .map(f => f.trim())
    .filter(f => f.startsWith('src/') && (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx')));

  if (files.length === 0) {
    console.log('\x1b[32m%s\x1b[0m', 'No uncommitted source code changes detected to lint for design tokens.');
    process.exit(0);
  }

  let totalViolations = 0;

  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    const fileViolations = [];

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Check for inline style hardcoding colors
      const inlineStyleMatch = line.match(/style=\{\{\s*.*?(color|background|backgroundColor|borderColor|fill|stroke)\s*:\s*['"`](#[0-9a-fA-F]{3,6}|[a-zA-Z]+)['"`]/i);
      if (inlineStyleMatch) {
        const value = inlineStyleMatch[2];
        if (!['transparent', 'inherit', 'initial', 'unset', 'none'].includes(value.toLowerCase())) {
          fileViolations.push({
            lineNum,
            type: 'Inline Hardcoded Color',
            message: `Avoid hardcoded style property [${inlineStyleMatch[1]}: '${value}']. Use Tailwind utility classes instead.`,
            snippet: line.trim()
          });
        }
      }

      // 2. Check for arbitrary Tailwind colors: bg-[#...] or text-[#...] or border-[#...]
      const arbitraryColorMatch = line.match(/(bg|text|border|fill|stroke)-\[\s*(#[0-9a-fA-F]{3,6}|rgb.*?|hsl.*?)\s*\]/gi);
      if (arbitraryColorMatch) {
        arbitraryColorMatch.forEach(match => {
          fileViolations.push({
            lineNum,
            type: 'Arbitrary Color class',
            message: `Avoid arbitrary color class [${match}]. Map it to a Tailwind theme config token.`,
            snippet: line.trim()
          });
        });
      }

      // 3. Check for generic Tailwind colors e.g. bg-blue-500, text-red-600
      genericTailwindColors.forEach(color => {
        const genericColorRegex = new RegExp(`\\b(bg|text|border|ring|from|to|via)-${color}-\\d{2,3}\\b`, 'g');
        const genericMatch = line.match(genericColorRegex);
        if (genericMatch) {
          genericMatch.forEach(match => {
            fileViolations.push({
              lineNum,
              type: 'Generic Tailwind Color',
              message: `Avoid standard Tailwind color [${match}]. Nexora uses custom brand tokens like [luxuryGold, nexoraBrand, floxElectricViolet, etc.].`,
              snippet: line.trim()
            });
          });
        }
      });

      // 4. Check for arbitrary spacing/sizing e.g. w-[15px] or p-[20px] instead of flox-spacing tokens
      const arbitrarySpacingMatch = line.match(/(w|h|p|m|gap|top|bottom|left|right|space)-\[\s*(\d+px|\d+rem)\s*\]/gi);
      if (arbitrarySpacingMatch) {
        arbitrarySpacingMatch.forEach(match => {
          fileViolations.push({
            lineNum,
            type: 'Arbitrary Spacing',
            message: `Avoid arbitrary spacing class [${match}]. Use standard Tailwind spacing or Flox-specific spacing tokens (e.g. flox-8, flox-16).`,
            snippet: line.trim()
          });
        });
      }
    });

    if (fileViolations.length > 0) {
      console.log(`\n\x1b[31m%s\x1b[0m`, `Violations found in ${file}:`);
      fileViolations.forEach(v => {
        console.log(`  Line ${v.lineNum}: \x1b[33m[${v.type}]\x1b[0m ${v.message}`);
        console.log(`    Code: \x1b[90m${v.snippet}\x1b[0m`);
      });
      totalViolations += fileViolations.length;
    }
  });

  if (totalViolations > 0) {
    console.log(`\n\x1b[31m%s\x1b[0m`, `Total violations: ${totalViolations}. Please fix these style issues to adhere to the Nexora Design System.`);
    process.exit(1);
  } else {
    console.log('\n\x1b[32m%s\x1b[0m', 'Design System Token Linter: PASSED! No hardcoded or generic styles found.');
    process.exit(0);
  }

} catch (error) {
  console.error('Error running token check:', error.message);
  process.exit(1);
}
