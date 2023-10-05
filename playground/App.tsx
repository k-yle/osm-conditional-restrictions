import { useEffect, useMemo, useState } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { parseConditionalRestrictions } from 'osm-conditional-restrictions';
// eslint-disable-next-line import/no-extraneous-dependencies
import { MarkerSeverity, type editor } from 'monaco-editor';

const getInitialValue = () => {
  return (
    decodeURIComponent(window.location.hash.slice(1).replaceAll('+', '%20')) ||
    'yes @ (09:00-17:00 AND weight < 3.5)'
  );
};

export const App = () => {
  const monaco = useMonaco();
  const [conditionalValue, setConditionalValue] = useState(getInitialValue);

  useEffect(() => {
    window.history.replaceState(
      '',
      '',
      `#${conditionalValue.replaceAll('+', '%2B').replaceAll(' ', '+')}`,
    );
  }, [conditionalValue]);

  useEffect(() => {
    if (!monaco) return;

    monaco.languages.register({ id: 'conditionals' });
    monaco.languages.setMonarchTokensProvider('conditionals', {
      keywords: ['@', ';', 'AND'],
      tokenizer: {
        root: [
          [/=.+/, 'comment'],
          [/([();@]|AND)/, 'keyword'],
        ],
      },
    });
  }, [monaco]);

  const result = useMemo(() => {
    const errors: editor.IMarkerData[] = [];
    try {
      return {
        result: parseConditionalRestrictions('access', {
          access: 'no',
          'access:conditional': conditionalValue,
        }),
      };
    } catch (error) {
      if (monaco) {
        const index =
          typeof error === 'object' &&
          error &&
          'offset' in error &&
          typeof error.offset === 'number'
            ? error.offset
            : undefined;
        errors.push({
          severity: MarkerSeverity.Error,
          startLineNumber: 1,
          startColumn: index ?? 0,
          endLineNumber: 1,
          endColumn:
            typeof index === 'number' ? index + 1 : conditionalValue.length + 1,
          message: error instanceof Error ? error.message : `${error}`,
        });
      }
      return { error };
    } finally {
      if (monaco) {
        for (const model of monaco.editor.getModels()) {
          monaco.editor.setModelMarkers(model, 'parser', errors);
        }
      }
    }
  }, [conditionalValue, monaco]);

  const height = 100;

  return (
    <>
      <Editor
        height={`${height}px`}
        defaultLanguage="conditionals"
        value={conditionalValue}
        theme="vs-dark"
        onChange={(newValue) =>
          setConditionalValue(newValue?.replaceAll(/(\r|\n)/g, '') || '')
        }
      />
      <Editor
        height={`calc(100dvh - ${height + 5}px)`}
        defaultLanguage="json"
        value={
          result.error
            ? `${result.error}`
            : JSON.stringify(result.result?.exceptions, null, 2)
        }
        theme="vs-dark"
        options={{ readOnly: true }}
      />
    </>
  );
};
