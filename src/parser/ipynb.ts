import {
    ICell,
    ICodeCell,
    IDisplayData,
    IError,
    IMimeBundle,
    INotebookContent,
    IOutput,
    IStream,
    MultilineString,
    IExecuteResult,
} from '@jupyterlab/nbformat';
import renderMarkdown from './markdown.js';
import { Renderer } from './parser.js';
import { AnsiUp } from 'ansi_up';

const ansiup = new AnsiUp();
ansiup.use_classes = true;
const renderAnsi: Renderer = (content: string) => ansiup.ansi_to_html(content);

function joinMultilineString(str: MultilineString): string {
    return Array.isArray(str) ? str.join('') : str;
}

function contain(
    content: MultilineString,
    classNames: string | string[],
    tag: string = 'div',
): string {
    function prefix(classNames: string | string[]): string {
        if (Array.isArray(classNames)) {
            return classNames.map((c) => prefix(c)).join(' ');
        }
        return `ipynb-${classNames}`;
    }
    classNames = prefix(classNames);

    return `<${tag} class="${classNames}">${joinMultilineString(content)}</${tag}>`;
}

function escapeHTML(raw: string): string {
    return raw.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function executionCount(count: ICell['execution_count']): string {
    return contain(`[${count?.toString() ?? ' '}]:`, 'execution-count');
}

const renderNotebook: Renderer = (content: string): string => {
    const nb = JSON.parse(content) as INotebookContent;
    const language = nb.metadata.kernelspec?.language ?? nb.metadata.language_info?.name;

    function renderDisplayData(data: IMimeBundle): string {
        const identity = (content: string) => content;
        const renderMap: [string, (content: string) => string][] = [
            ['image/png', (content) => `<img src="data:image/png;base64,${content}" />`],
            ['image/jpeg', (content) => `<img src="data:image/jpeg;base64,${content}" />`],
            ['image/svg+xml', identity],
            ['text/svg+xml', identity],
            ['text/html', identity],
            ['text/markdown', renderMarkdown],
            ['text/plain', (content) => contain(escapeHTML(content), 'output-plain', 'pre')],
        ];
        const result = renderMap.find(([mimeType]) => mimeType in data);
        if (!result) return '';
        const [format, render] = result;
        return render(joinMultilineString(data[format] as MultilineString));
    }

    function renderOutput(output: IOutput): string {
        switch (output.output_type) {
            case 'stream':
                const text = joinMultilineString((output as IStream).text);
                return contain(
                    renderAnsi(text),
                    `output-stream-${(output as IStream).name}`,
                    'pre',
                );
            case 'error':
                const traceback = (output as IError).traceback.join('\n');
                return contain(renderAnsi(traceback), 'output-error', 'pre');
            case 'display_data': {
                const displayData = (output as IDisplayData).data;
                return renderDisplayData(displayData);
            }
            case 'execute_result': {
                const displayData = (output as IExecuteResult).data;
                return contain(
                    [executionCount(output.execution_count), renderDisplayData(displayData)],
                    'output-execution-result',
                );
            }
            default:
                return '';
        }
    }

    function renderCell(cell: ICell): string {
        const source = joinMultilineString(cell.source);

        switch (cell.cell_type) {
            case 'code':
                const content = [
                    executionCount(cell.execution_count),
                    renderMarkdown(`\`\`\`${language}\n${source}\n\`\`\``),
                ];
                if (Array.isArray(cell.outputs)) {
                    content.push(...(cell as ICodeCell).outputs.map(renderOutput));
                }
                return contain(content, 'cell-code');
            case 'markdown':
                return contain(renderMarkdown(source), 'cell-markdown');
            default:
                // 'raw' cells aren't normally rendered
                return '';
        }
    }

    return nb.cells.map(renderCell).join('\n\n');
};
export default renderNotebook;
