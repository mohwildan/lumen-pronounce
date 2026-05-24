import '@src/SidePanel.css';
import { t } from '@extension/i18n';
import { PROJECT_URL_OBJECT, useStorage, withErrorBoundary, withSuspense } from '@extension/shared';
import { exampleThemeStorage } from '@extension/storage';
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui';
import ChatApp from './ChatApp';

const SidePanel = () => {
  return (
    <div className="App h-screen flex flex-col bg-[#22211c] text-[#fdfbf6] font-sans">
      <div className="p-3 flex items-center gap-3 bg-[#1a1915] border-b border-[#3e3c33]">
        <img src={chrome.runtime.getURL('icon-128.png')} className="h-6 w-6 rounded-md shadow-md bg-[#11110f] border border-[#3e3c33]" alt="logo" />
        <div className="flex flex-col">
          <span className="font-bold text-[1.1rem] leading-none" style={{ fontFamily: "'Fraunces', Georgia, serif", letterSpacing: '-.01em' }}>Lumen</span>
          <span className="text-[#8c887a] text-[0.58rem] font-bold tracking-widest uppercase">Support Chat</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden bg-[#22211c]">
        <ChatApp />
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
