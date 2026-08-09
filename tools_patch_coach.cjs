const fs = require('fs');

let coachTsx = fs.readFileSync('src/pages/coach/CoachAssistant.tsx', 'utf8');

// I will write a custom string replacement script since the changes are significant.
// Replace the Message type if it exists, or change the state type.
coachTsx = coachTsx.replace(
  `const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([`,
  `type Message = { id?: string; role: 'user' | 'model' | 'function'; content?: string; functionCalls?: any[]; functionResponse?: any; name?: string; };\n  const [messages, setMessages] = useState<Message[]>([`
);

coachTsx = coachTsx.replace(
  `role: 'assistant',`,
  `id: 'greeting', role: 'model',`
);

coachTsx = coachTsx.replace(
  `const newMessagesForUser = [...messages, { role: 'user' as const, content: userMessage }];`,
  `const newMessagesForUser = [...messages, { id: Date.now().toString(), role: 'user' as const, content: userMessage }];`
);

// We need to implement executeFunction
let executeFuncStr = `
  const executeFunction = async (name: string, args: any) => {
    if (name === 'get_coach_students_data') {
      try {
        const studentName = args.studentName;
        const dataTypes = args.dataTypes || [];
        
        let filteredStudents = students;
        if (studentName) {
           filteredStudents = students.filter(s => s.displayName.toLowerCase().includes(studentName.toLowerCase()));
        }

        const summarized = filteredStudents.map(s => {
          const res: any = { uid: s.uid, name: s.displayName, package: s.summaryData.subscriptionPlan };
          if (dataTypes.length === 0 || dataTypes.includes('programs')) res.programs = { daily: s.summaryData.dailyPrograms?.slice(0,3), weekly: s.summaryData.weeklyPrograms?.slice(0,2) };
          if (dataTypes.length === 0 || dataTypes.includes('books')) res.books = s.summaryData.books?.slice(0,5);
          if (dataTypes.length === 0 || dataTypes.includes('exams')) { res.exams = s.summaryData.exams?.slice(0,3); res.analyses = s.summaryData.examAnalyses?.slice(0,2); }
          if (dataTypes.length === 0 || dataTypes.includes('appointments')) res.appointments = s.summaryData.appointments?.filter((a:any) => a.status === 'pending');
          return res;
        });

        return { studentsData: summarized };
      } catch(e:any) {
        return { error: e.message };
      }
    }
    return { error: "Unknown function" };
  };
`;

coachTsx = coachTsx.replace(
  `const handleSendMessage = async (e?: React.FormEvent) => {`,
  executeFuncStr + `\n  const handleSendMessage = async (e?: React.FormEvent) => {`
);

// We will replace the try block in handleSendMessage with the loop
const oldTryBlockMatch = coachTsx.match(/try \{[\s\S]*?\} catch \(error\) \{/);

if (oldTryBlockMatch) {
  let newTryBlock = `try {
      let currentHistory = [...newMessagesForUser];
      let done = false;

      while (!done) {
        const res = await fetch('/api/coach-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            history: currentHistory.map(m => ({
              role: m.role,
              content: m.content,
              functionCalls: m.functionCalls,
              functionResponse: m.functionResponse,
              name: m.name
            })),
            userContext: { firstName: userData?.firstName }
          })
        });

        if (!res.ok) {
          throw new Error(await res.text() || 'Asistan yanıt veremedi.');
        }

        const resJson = await res.json();
        
        if (resJson.functionCalls && resJson.functionCalls.length > 0) {
          const functionCallsMessage: Message = {
            id: Date.now().toString() + "-call",
            role: 'model',
            functionCalls: resJson.functionCalls
          };
          currentHistory = [...currentHistory, functionCallsMessage];
          setMessages(prev => [...prev, functionCallsMessage]);

          const results = [];
          for (const fc of resJson.functionCalls) {
             const result = await executeFunction(fc.name, fc.args);
             results.push({ name: fc.name, response: result, id: fc.id });
          }
          
          for (const result of results) {
            const funcResMsg: Message = {
              id: Date.now().toString() + "-res",
              role: 'function',
              name: result.name,
              functionResponse: result.response
            };
            currentHistory = [...currentHistory, funcResMsg];
            setMessages(prev => [...prev, funcResMsg]);
          }
        } else if (resJson.text) {
          const modelMessage: Message = {
            id: Date.now().toString() + "-model",
            role: 'model',
            content: resJson.text
          };
          currentHistory = [...currentHistory, modelMessage];
          setMessages(prev => [...prev, modelMessage]);
          saveChatHistory(currentHistory);
          done = true;
        } else {
          done = true;
        }
      }

    } catch (error) {`;
  
  coachTsx = coachTsx.replace(oldTryBlockMatch[0], newTryBlock);
}

// Update JSX rendering part
coachTsx = coachTsx.replace(
  `{messages.map((message, idx) => {`,
  `{messages.map((message, idx) => {
              if (message.role === 'function' || message.functionCalls) return null;`
);

coachTsx = coachTsx.replace(
  `message.role === 'assistant' ?`,
  `message.role === 'model' ?`
);

coachTsx = coachTsx.replace(
  `message.role === 'assistant'`,
  `message.role === 'model'`
);


fs.writeFileSync('src/pages/coach/CoachAssistant.tsx', coachTsx);
