const fs = require('fs');
let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');

// We can check if wizard is already active inside startWizardFlow
const oldStartWizard = `  const startWizardFlow = async (currentHistory: Message[]) => {
    setWizardState(s => ({ ...s, isActive: true, step: 1, isLoadingData: true }));`;

const newStartWizard = `  const startWizardFlow = async (currentHistory: Message[]) => {
    if (wizardState.isActive) return; // Prevent double trigger
    setWizardState(s => ({ ...s, isActive: true, step: 1, isLoadingData: true }));`;

content = content.replace(oldStartWizard, newStartWizard);
fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);
