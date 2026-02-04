interface ExecutionResult {
  he_id: string;
  output: string;
  status: 'success' | 'running' | 'error';
  message: string;
}

const HACKEREARTH_API_URL = 'https://api.hackerearth.com/v4/partner/code-evaluation/submissions/';

export async function runCode(source: string, language: string, input: string = ''): Promise<ExecutionResult> {
  // First request to compile and get he_id
  const submitResponse = await fetch(HACKEREARTH_API_URL, {
    method: 'POST',
    headers: {
      'client-secret': process.env.NEXT_PUBLIC_HACKEREARTH_SECRET!,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      lang: language === 'python' ? 'PYTHON3' : 'JAVASCRIPT_NODE',
      source,
      input,
      memory_limit: 243232,
      time_limit: 5,
    }),
  });

  if (!submitResponse.ok) {
    throw new Error('Failed to submit code');
  }

  const submitData = await submitResponse.json();
  const he_id = submitData.he_id;

  // Poll for results
  let attempts = 0;
  const maxAttempts = 20;
  
  while (attempts < maxAttempts) {
    const resultResponse = await fetch(`${HACKEREARTH_API_URL}${he_id}/`, {
      headers: {
        'client-secret': process.env.NEXT_PUBLIC_HACKEREARTH_SECRET!,
      },
    });

    if (!resultResponse.ok) {
      throw new Error('Failed to get results');
    }

    const resultData = await resultResponse.json();
    console.log('Result data:', resultData);

    // Check request status
    if (resultData.request_status.code === 'REQUEST_COMPLETED') {
      const runStatus = resultData.result.run_status;
      
      // If output is a URL, fetch the actual output
      let finalOutput = runStatus.output;
      if (finalOutput && finalOutput.startsWith('https://')) {
        const outputResponse = await fetch(finalOutput);
        finalOutput = await outputResponse.text();
      }

      return {
        he_id,
        output: finalOutput || 'Program executed successfully but produced no output',
        status: runStatus.status === 'AC' ? 'success' : 
                runStatus.status === 'NA' ? 'running' : 'error',
        message: resultData.result.compile_status
      };
    }

    // If still compiling or queued, wait and try again
    if (['REQUEST_INITIATED', 'REQUEST_QUEUED', 'CODE_COMPILED'].includes(resultData.request_status.code)) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      continue;
    }

    // If request failed
    if (resultData.request_status.code === 'REQUEST_FAILED') {
      throw new Error(resultData.request_status.message || 'Execution failed');
    }

    attempts++;
  }

  throw new Error('Timeout waiting for execution results');
}
