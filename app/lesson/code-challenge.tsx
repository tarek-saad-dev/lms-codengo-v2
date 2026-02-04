"use client";

import { useState, useCallback } from "react";
import { runCode } from "@/lib/hackerearth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, Code2, Play, RotateCcw } from "lucide-react";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { indentUnit } from '@codemirror/language';
import { EditorState } from '@codemirror/state';

interface CodeChallengeProps {
  initialCode: string;
  language: "python" | "javascript" | "typescript";
  instructions: string;
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden?: boolean;
  }[];
  onComplete: () => void;
}

export const CodeChallenge = ({
  initialCode,
  language,
  instructions,
  testCases,
  onComplete,
}: CodeChallengeProps) => {
  const [code, setCode] = useState(initialCode.replace(/\\n/g, '\n'));
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [allTestsPassed, setAllTestsPassed] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; output: string; expected: string }[]>([]);

  const getLanguageExtension = useCallback(() => {
    switch (language) {
      case "javascript":
      case "typescript":
        return javascript();
      case "python":
        return python();
      default:
        return javascript();
    }
  }, [language]);

  const executeCode = async (source: string) => {
    try {
      const result = await runCode(source, language, '');
      if (result.status === 'error') {
        throw new Error(result.message);
      }
      return result.output;
    } catch (error) {
      throw new Error(`Execution failed: ${error.message}`);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("");
    setTestResults([]);

    try {
      const results = await Promise.all(
        testCases.map(async (test) => {
          try {
            const output = await executeCode(code);
            const outputStr = output.trim();
            const passed = outputStr === test.expectedOutput.trim();
            return { 
              passed, 
              output: test.isHidden ? "Hidden test case" : outputStr,
              expected: test.isHidden ? "Hidden" : test.expectedOutput
            };
          } catch (error) {
            return { 
              passed: false, 
              output: `Error: ${error.message}`,
              expected: test.isHidden ? "Hidden" : test.expectedOutput
            };
          }
        })
      );

      setTestResults(results);
      const allPassed = results.every((r) => r.passed);
      setAllTestsPassed(allPassed);
      setOutput(
        results
          .map(
            (r, i) =>
              `Test Case ${i + 1}: ${r.passed ? "✅ Passed" : "❌ Failed"}\n${testCases[i].isHidden 
                ? "[Hidden test case]" 
                : `Output: ${r.output}\nExpected: ${r.expected}`}`
          )
          .join("\n\n")
      );
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const resetCode = () => {
    setCode(initialCode);
    setOutput("");
    setTestResults([]);
    setAllTestsPassed(false);
  };

  const testCode = async () => {
    setIsRunning(true);
    setOutput("");

    try {
      const output = await executeCode(code);
      setOutput(`Output:\n${output}`);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col w-full max-w-5xl mx-auto p-3 sm:p-4 md:p-6 bg-white rounded-xl shadow-xl"
    >
      <div className="w-full mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-800">Code Challenge</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Instructions</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{instructions}</p>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-2 border-b">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {language.charAt(0).toUpperCase() + language.slice(1)} Editor
                </span>
                <div className="flex gap-2">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={testCode}
                      disabled={isRunning}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetCode}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <CodeMirror
              value={code}
              height="400px"
              extensions={[
                getLanguageExtension(),
                indentUnit.of('    '),
                EditorState.tabSize.of(4),
              ]}
              onChange={setCode}
              theme="dark"
              className="text-sm"
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true
              }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Run Tests
            </Button>
            <Button
              onClick={onComplete}
              disabled={!allTestsPassed}
              className={`flex items-center gap-2 ${
                allTestsPassed
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Complete Challenge
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-2 border-b">
              <span className="text-sm font-medium text-gray-700">Output</span>
            </div>
            <div className="p-4 bg-gray-900 text-gray-100 font-mono text-sm whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-auto">
              {isRunning ? "Running tests..." : output || "No output yet"}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">Test Cases</h3>
            <div className="space-y-2">
              {testCases.map((test, index) => (
                <div
                  key={index}
                  className="p-2 bg-white rounded border flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">
                    Test Case {index + 1}
                    {test.isHidden ? " (Hidden)" : ""}
                  </span>
                  {testResults[index] && (
                    <span
                      className={`text-sm font-medium ${
                        testResults[index].passed ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {testResults[index].passed ? "Passed" : "Failed"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
