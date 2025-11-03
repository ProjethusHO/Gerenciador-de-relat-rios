import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Report, ReportContent, ContentHistory, TeamMember } from '../types';
import { getAISuggestion, generateParecerInsights, generateTextContinuation } from '../services/geminiService';
import Avatar from './Avatar';

// --- HELPER TO PARSE SAVED CONTENT ---
const parseContent = (content: string | undefined): ReportContent => {
  if (!content) return { assunto: '', processo: '', interessado: '', ementa: '', relatorio: '', parecer: '' };
  try {
      const parsed = JSON.parse(content);
      return typeof parsed === 'object' ? parsed : { assunto: '', processo: '', interessado: '', ementa: '', relatorio: content, parecer: '' };
  } catch {
      return { assunto: '', processo: '', interessado: '', ementa: '', relatorio: content, parecer: '' };
  }
};


// --- AI SUGGESTION POPUP ---
interface SuggestionPopupProps {
  suggestion: { type: 'correction' | 'continuation'; textForDisplay: string };
  onAccept: () => void;
  onDismiss: () => void;
}
const SuggestionPopup: React.FC<SuggestionPopupProps> = ({ suggestion, onAccept, onDismiss }) => {
  return (
    <div className="absolute bottom-2 right-2 bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-600 rounded-lg shadow-xl p-3 max-w-sm z-20 animate-fade-in">
      <p className="text-sm text-slate-800 dark:text-slate-200">
        <span className="font-bold text-indigo-600 dark:text-indigo-400">{suggestion.type === 'correction' ? 'Correção Sugerida: ' : 'Sugestão: '}</span>
        <span dangerouslySetInnerHTML={{ __html: suggestion.textForDisplay }}></span>
      </p>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex justify-end gap-4">
        <span>Pressione <kbd className="font-sans font-semibold border bg-slate-100 dark:bg-slate-600 px-1 py-0.5 rounded">Tab</kbd> para aceitar</span>
        <span><kbd className="font-sans font-semibold border bg-slate-100 dark:bg-slate-600 px-1 py-0.5 rounded">Esc</kbd> para ignorar</span>
      </div>
    </div>
  );
};


// --- WYSIWYG EDITOR COMPONENT ---
interface WysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows: number;
  onFocus: () => void;
  editorRef: React.RefObject<HTMLDivElement>;
}
const WysiwygEditor: React.FC<WysiwygEditorProps> = ({ value, onChange, rows, onFocus, editorRef }) => {
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value, editorRef]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => onChange(e.currentTarget.innerHTML);
  const handleExecCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };
  const handleImageUpload = () => imageInputRef.current?.click();
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => handleExecCommand('insertImage', event.target?.result as string);
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };
  const insertTable = () => {
    const tableHtml = `<table class="w-full border-collapse border border-slate-400 dark:border-slate-500 my-4"><thead><tr class="bg-slate-100 dark:bg-slate-700"><th class="border border-slate-300 dark:border-slate-600 p-2">Cabeçalho 1</th><th class="border border-slate-300 dark:border-slate-600 p-2">Cabeçalho 2</th></tr></thead><tbody><tr><td class="border border-slate-300 dark:border-slate-600 p-2">Célula 1</td><td class="border border-slate-300 dark:border-slate-600 p-2">Célula 2</td></tr></tbody></table><p><br></p>`;
    handleExecCommand('insertHTML', tableHtml);
  }

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-t-lg flex-wrap">
        <button type="button" title="Negrito" onClick={() => handleExecCommand('bold')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold">B</button>
        <button type="button" title="Itálico" onClick={() => handleExecCommand('italic')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 italic">I</button>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
        <button type="button" title="Título 1" onClick={() => handleExecCommand('formatBlock', '<h1>')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-lg">H1</button>
        <button type="button" title="Título 2" onClick={() => handleExecCommand('formatBlock', '<h2>')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-base">H2</button>
        <button type="button" title="Título 3" onClick={() => handleExecCommand('formatBlock', '<h3>')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-sm">H3</button>
        <div className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-1"></div>
        <button type="button" title="Inserir Tabela" onClick={insertTable} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v2H5V5zm0 4h10v2H5V9zm0 4h10v2H5v-2z" /></svg></button>
        <button type="button" title="Inserir Imagem" onClick={handleImageUpload} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg></button>
      </div>
      <input type="file" ref={imageInputRef} onChange={handleImageFileChange} accept="image/*" hidden />
      <div ref={editorRef} contentEditable={true} onInput={handleInput} onFocus={onFocus} style={{ minHeight: `${rows * 1.5 + 1.5}rem` }} className="w-full p-3 outline-none" />
    </div>
  );
};


// --- VERSION HISTORY SIDEBAR ---
interface VersionHistorySidebarProps {
  history: ContentHistory[];
  allUsers: TeamMember[];
  onRestore: (entry: ContentHistory) => void;
  onClose: () => void;
}
const VersionHistorySidebar: React.FC<VersionHistorySidebarProps> = ({ history, allUsers, onRestore, onClose }) => (
  <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-slate-800 shadow-2xl border-l dark:border-slate-700 flex flex-col animate-slide-in-right z-10">
    <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
      <h4 className="font-bold text-lg">Linha do Tempo</h4>
      <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700">&times;</button>
    </div>
    <ul className="flex-1 overflow-y-auto p-2">
      {[...history].reverse().map((entry, index) => {
        const user = allUsers.find(u => u.id === entry.editorId);
        return (
          <li key={index} className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Avatar name={user?.name || '?'} className="w-7 h-7 text-xs"/>
                    <div>
                        <p className="text-sm font-semibold">{user?.name || 'Sistema'}</p>
                        <p className="text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                </div>
                <button onClick={() => onRestore(entry)} className="text-xs font-bold text-indigo-600 hover:underline">Restaurar</button>
            </div>
          </li>
        )
      })}
    </ul>
  </div>
);


// --- AI INSIGHTS BOX ---
interface AIInsightBoxProps {
    insight: string;
    isLoading: boolean;
    onClose: () => void;
}
const AIInsightBox: React.FC<AIInsightBoxProps> = ({ insight, isLoading, onClose }) => (
    <div className="absolute top-0 right-full mr-4 w-80 bg-indigo-50 dark:bg-slate-900 border border-indigo-200 dark:border-slate-700 rounded-lg shadow-lg p-4 animate-fade-in z-10">
        <div className="flex justify-between items-center mb-2">
            <h5 className="font-bold text-indigo-800 dark:text-indigo-300">Insights da IA</h5>
            <button onClick={onClose} className="text-sm font-bold">&times;</button>
        </div>
        {isLoading ? <p>Analisando...</p> : <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{insight}</div>}
    </div>
);

// --- MAIN REPORT EDITOR COMPONENT ---
interface ReportEditorProps {
    report: Report;
    allUsers: TeamMember[];
    onUpdateContent: (reportId: string, content: string) => void;
    onRestoreContentVersion: (reportId: string, historyEntry: ContentHistory) => void;
    onBack: () => void;
    onFinishAndSign: () => void;
    isAuthor: boolean;
    isDraft: boolean;
    hasUserSigned: boolean;
}

const ReportEditor: React.FC<ReportEditorProps> = ({ report, allUsers, onUpdateContent, onRestoreContentVersion, onBack, onFinishAndSign, isAuthor, isDraft, hasUserSigned }) => {
    const initialContent = parseContent(report.content);
    const [content, setContent] = useState<ReportContent>(initialContent);
    const [saveStatus, setSaveStatus] = useState<'salvo' | 'salvando' | 'não salvo'>('salvo');
    
    const [activeEditor, setActiveEditor] = useState<'relatorio' | 'parecer' | null>(null);
    const [isHistoryVisible, setIsHistoryVisible] = useState(false);

    // AI Suggestions State
    const [suggestion, setSuggestion] = useState<{ type: 'correction' | 'continuation'; textForDisplay: string; textForReplacement: string; originalText?: string; targetField: keyof ReportContent } | null>(null);
    const [isAISuggesting, setIsAISuggesting] = useState(false);
    const suggestionTimer = useRef<number | null>(null);
    const relatorioEditorRef = useRef<HTMLDivElement>(null);
    const parecerEditorRef = useRef<HTMLDivElement>(null);

    // AI Insights State
    const [parecerInsight, setParecerInsight] = useState<string | null>(null);
    const [isInsightLoading, setIsInsightLoading] = useState(false);
    const [hasFetchedParecerInsights, setHasFetchedParecerInsights] = useState(false);

    // Auto-save logic
    useEffect(() => {
      const handler = setTimeout(() => {
        const currentContentString = JSON.stringify(content);
        if (currentContentString !== report.content) {
          setSaveStatus('salvando');
          onUpdateContent(report.id, currentContentString);
          setTimeout(() => setSaveStatus('salvo'), 1000); 
        }
      }, 2000);
      return () => clearTimeout(handler);
    }, [content, report.id, report.content, onUpdateContent]);

    // Automatic Parecer Insights on Focus
    useEffect(() => {
      const getInsights = async () => {
         setIsInsightLoading(true);
         setParecerInsight('');
         try {
             const insights = await generateParecerInsights(report, allUsers);
             setParecerInsight(insights);
         } catch(e: any) {
              setParecerInsight(`Erro: ${e.message}`);
         } finally {
             setIsInsightLoading(false);
         }
      };

      if (activeEditor === 'parecer' && !hasFetchedParecerInsights) {
        getInsights();
        setHasFetchedParecerInsights(true);
      }
    }, [activeEditor, hasFetchedParecerInsights, report, allUsers]);

    const handleDismissSuggestion = useCallback(() => setSuggestion(null), []);

    const handleAcceptSuggestion = useCallback(() => {
        if (!suggestion) return;

        const { type, textForReplacement, targetField, originalText } = suggestion;
        let newHtml = content[targetField];

        if (type === 'correction' && originalText) {
            // Find and replace the original text with the final, clean replacement text
            const lastIndex = newHtml.lastIndexOf(originalText);
            if (lastIndex !== -1) {
                newHtml = newHtml.substring(0, lastIndex) + textForReplacement + newHtml.substring(lastIndex + originalText.length);
            } else {
                // Fallback if originalText isn't found (should be rare)
                newHtml += textForReplacement;
            }
        } else if (type === 'continuation') {
            // For continuations, simply append the clean new text
            newHtml += textForReplacement;
        }
        
        handleContentChange(targetField, newHtml, true);
        
        const targetEditor = targetField === 'relatorio' ? relatorioEditorRef.current : parecerEditorRef.current;
        if (targetEditor) {
            // Move cursor to the end after accepting
            targetEditor.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(targetEditor);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }

    }, [suggestion, content]);


    // Keydown listener for suggestions
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!suggestion) return;
            if (e.key === 'Tab') {
                e.preventDefault();
                handleAcceptSuggestion();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                handleDismissSuggestion();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [suggestion, handleAcceptSuggestion, handleDismissSuggestion]);


    const handleContentChange = (field: keyof ReportContent, value: string, suggestionAccepted = false) => {
        setContent(prev => ({...prev, [field]: value}));
        setSaveStatus('não salvo');
        
        if (suggestion) handleDismissSuggestion();
        if (suggestionTimer.current) clearTimeout(suggestionTimer.current);

        if (!suggestionAccepted) {
            suggestionTimer.current = window.setTimeout(() => {
                fetchSuggestion(field, value);
            }, 1500);
        }
    };

    const fetchSuggestion = async (field: keyof ReportContent, text: string) => {
      if (isAISuggesting || text.trim().length < 50) return;
      setIsAISuggesting(true);
      try {
        const result = await getAISuggestion(text);
        if (result && result.type !== 'none' && result.textForDisplay && result.textForReplacement) {
          setSuggestion({ ...result, targetField: field } as any);
        }
      } catch (e) {
        console.error("Failed to get AI suggestion", e);
      } finally {
        setIsAISuggesting(false);
      }
    };
    
    const handleManualReview = () => {
        if (activeEditor && !isAISuggesting) {
            const currentFieldContent = content[activeEditor];
            fetchSuggestion(activeEditor, currentFieldContent);
        }
    };

    const handleRequestContinuation = async () => {
        if (!activeEditor || isAISuggesting) return;
        setIsAISuggesting(true);
        const currentText = content[activeEditor];
        try {
            const continuationHtml = await generateTextContinuation(currentText);
            if (continuationHtml) {
                setSuggestion({
                    type: 'continuation',
                    textForDisplay: `<ins style="color:blue; text-decoration:none;">${continuationHtml}</ins>`,
                    textForReplacement: continuationHtml,
                    targetField: activeEditor,
                });
            }
        } catch (e) {
            console.error("Failed to get AI continuation", e);
        } finally {
            setIsAISuggesting(false);
        }
    };

    return (
      <div className="lg:col-span-3 space-y-4 relative">
        <div className="flex justify-between items-center flex-wrap gap-2">
            <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">Editor de Conteúdo</h3>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isAISuggesting ? 'animate-spin' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h.5a1.5 1.5 0 010 3H14a1 1 0 00-1 1v.5a1.5 1.5 0 01-3 0V9a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H9a1 1 0 001-1v-.5a1.5 1.5 0 011.5-1.5zM3 13.5a1.5 1.5 0 013 0V14a1 1 0 001 1h.5a1.5 1.5 0 010 3H7a1 1 0 00-1 1v.5a1.5 1.5 0 01-3 0V18a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H3a1 1 0 001-1v-.5z" /></svg>
                    <span className="font-semibold">Assistente IA</span>
                </div>
                 <div className="flex items-center gap-2">
                    <button
                        onClick={handleManualReview}
                        disabled={!activeEditor || isAISuggesting}
                        className="px-3 py-1.5 text-sm font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:bg-sky-400 disabled:cursor-not-allowed"
                        title="Pedir uma revisão ou sugestão da IA para o campo ativo"
                    >
                        Revisar com IA
                    </button>
                     <button
                        onClick={handleRequestContinuation}
                        disabled={!activeEditor || isAISuggesting}
                        className="px-3 py-1.5 text-sm font-semibold text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed"
                        title="Pedir para a IA continuar o texto no campo ativo"
                    >
                        Sugerir Continuação
                    </button>
                 </div>
                <span className="text-sm text-slate-500 italic">
                    {saveStatus === 'salvo' && 'Alterações salvas'}
                    {saveStatus === 'salvando' && 'Salvando...'}
                </span>
                <button onClick={() => setIsHistoryVisible(true)} className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700">Linha do Tempo</button>
                <button onClick={onBack} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">Retornar</button>
                 {isAuthor && isDraft && !hasUserSigned && (
                     <button onClick={onFinishAndSign} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">Assinar</button>
                 )}
            </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="form-label">Assunto</label><input type="text" value={content.assunto} onChange={e => handleContentChange('assunto', e.target.value)} className="w-full form-input" /></div>
            <div><label className="form-label">Interessado</label><input type="text" value={content.interessado} onChange={e => handleContentChange('interessado', e.target.value)} className="w-full form-input" /></div>
          </div>
          <div><label className="form-label">Ementa</label><textarea value={content.ementa} onChange={e => handleContentChange('ementa', e.target.value)} rows={3} className="w-full form-textarea" /></div>
          <div className="relative">
              <label className="form-label">Relatório</label>
              <WysiwygEditor editorRef={relatorioEditorRef} value={content.relatorio} onChange={value => handleContentChange('relatorio', value)} rows={10} onFocus={() => setActiveEditor('relatorio')} />
              {suggestion && suggestion.targetField === 'relatorio' && <SuggestionPopup suggestion={suggestion} onAccept={handleAcceptSuggestion} onDismiss={handleDismissSuggestion} />}
          </div>
          <div className="relative">
              <label className="form-label">Parecer do relator(a)</label>
              <WysiwygEditor editorRef={parecerEditorRef} value={content.parecer} onChange={value => handleContentChange('parecer', value)} rows={5} onFocus={() => setActiveEditor('parecer')} />
              {suggestion && suggestion.targetField === 'parecer' && <SuggestionPopup suggestion={suggestion} onAccept={handleAcceptSuggestion} onDismiss={handleDismissSuggestion} />}
              {parecerInsight !== null && <AIInsightBox insight={parecerInsight} isLoading={isInsightLoading} onClose={() => setParecerInsight(null)} />}
          </div>
        </div>

        {isHistoryVisible && <VersionHistorySidebar history={report.contentHistory} allUsers={allUsers} onClose={() => setIsHistoryVisible(false)} onRestore={(entry) => onRestoreContentVersion(report.id, entry)} />}
      </div>
    );
};

export default ReportEditor;