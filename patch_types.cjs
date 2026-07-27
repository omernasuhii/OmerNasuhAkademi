const fs = require('fs');

let ctx = fs.readFileSync('src/lib/StudentContext.tsx', 'utf8');
if (!ctx.includes('subscriptionStatus')) {
  ctx = ctx.replace('subscriptionPlan?: string;', 'subscriptionPlan?: string;\n  subscriptionStatus?: string;');
  fs.writeFileSync('src/lib/StudentContext.tsx', ctx);
}

let lay = fs.readFileSync('src/pages/coach/CoachLayout.tsx', 'utf8');
if (!lay.includes('subscriptionStatus?: string;')) {
  lay = lay.replace('photoURL?: string;', 'photoURL?: string;\n  subscriptionPlan?: string;\n  subscriptionStatus?: string;');
  fs.writeFileSync('src/pages/coach/CoachLayout.tsx', lay);
}
