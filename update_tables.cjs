const fs = require('fs');
const p = require('path');
function walk(d) {
  fs.readdirSync(d).forEach(f => {
    const pf = p.join(d, f);
    if (fs.statSync(pf).isDirectory()) {
      walk(pf);
    } else if (pf.endsWith('.jsx') || pf.endsWith('.tsx')) {
      let c = fs.readFileSync(pf, 'utf8');
      let orig = c;
      c = c.replace(/className="min-w-full divide-y/g, 'className="min-w-max divide-y');
      c = c.replace(/min-w-\[150px\]/g, 'min-w-[250px]');
      c = c.replace(/min-w-\[120px\]/g, 'min-w-[160px]');
      if (c !== orig) {
        fs.writeFileSync(pf, c);
        console.log('Updated ' + pf);
      }
    }
  });
}
walk('./src/pages');
